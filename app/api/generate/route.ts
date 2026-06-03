import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  timeout: 240 * 1000,
})

const MAX_INPUT_CHARS = 3_200_000

export async function POST(req: NextRequest) {
  try {
    const { type, copy, templateId, scrapedHtml, screenshot } = await req.json()

    let html = ''

    if (type === 'clone') {
      let source = scrapedHtml || ''
      if (source.length > MAX_INPUT_CHARS) source = source.slice(0, MAX_INPUT_CHARS)

      const hasScreenshot =
        typeof screenshot === 'string' && screenshot.startsWith('data:image')

      // Auto-detect mode: real HTML markup -> PRESERVE; lean extract -> REBUILD.
      const looksLikeHtml = /<\s*(div|section|body|html|header|main|p|h1|img)[\s>]/i.test(source)
      const mode = looksLikeHtml ? 'preserve' : 'rebuild'

      const userContent: Anthropic.MessageParam['content'] = []

      if (hasScreenshot) {
        const [meta, b64] = screenshot.split(',')
        const mediaType = (meta.match(/data:(image\/\w+);/)?.[1] || 'image/png') as
          | 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: b64 },
        })
      }

      const preservePrompt = `You are an expert at making an existing web page SELF-CONTAINED without changing how it looks.

You are given the page's HTML with CSS inlined inside <style> tags.${hasScreenshot ? ' You ALSO have a screenshot of the rendered page — treat it as the source of truth for appearance and match it exactly.' : ''}

YOUR JOB IS TO PRESERVE, NOT REBUILD. Do NOT redesign, "improve", or re-create from scratch.

PRESERVE EXACTLY: structure, element order, class names, ids, ALL text verbatim; every CSS value (hex, rgba, px, font-family, weight, line-height, letter-spacing, radius, shadow, gap, padding, margin, max-width, grid/flex) exactly; all image/background URLs; the original fonts.

MAKE IT SELF-CONTAINED (only allowed changes): consolidate CSS into one <style> in <head> with identical values; recreate JS-only interactivity (accordions, countdowns, sticky bars) with minimal vanilla JS; make relative asset paths absolute; remove ONLY Liquid tags, tracking pixels, analytics, third-party app scripts; keep the source's own media queries.

OUTPUT: one file starting with <!DOCTYPE html>. Raw HTML only — no explanation, no markdown, no code fences.

HERE IS THE SOURCE (HTML with CSS inlined):
${source}`

      const rebuildPrompt = `You are an elite frontend developer. Rebuild a landing page as ONE clean, self-contained HTML file.

This page was built with a page-builder, so its original markup is bloated and is NOT provided. Instead you have:
1. ${hasScreenshot ? 'A SCREENSHOT of the rendered page — your SOURCE OF TRUTH for layout, colors, spacing, fonts, and section order. Match it as closely as possible.' : 'NO screenshot — infer a clean, attractive advertorial layout from the content below.'}
2. A content extract listing the exact text, headings, button labels, image URLs, and links, IN PAGE ORDER.

RULES:
- ${hasScreenshot ? 'Reproduce the visual design from the screenshot: section order, layout (hero, comparison table, byline, reviews, FAQ, CTAs, sticky bars), colors (read hex values off the screenshot), fonts, rounded corners, shadows, spacing.' : 'Lay out the sections cleanly in the order given, like a high-converting advertorial.'}
- Use the EXACT text from the extract — do not paraphrase, invent, or omit copy.
- Use the EXACT image URLs ([IMAGE] lines) and link/button targets from the extract.
- Clean semantic HTML, all CSS in one <style> tag in <head>. Load matching Google Fonts.
- Recreate interactive elements (countdown timers, accordions, sticky CTA bars, comparison tables) with vanilla JS in one <script> tag.
- Fully mobile responsive with media queries.

OUTPUT: one file starting with <!DOCTYPE html>. Raw HTML only — no explanation, no markdown, no code fences.

CONTENT EXTRACT (in page order):
${source}`

      userContent.push({ type: 'text', text: mode === 'preserve' ? preservePrompt : rebuildPrompt })

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 32000,
        messages: [{ role: 'user', content: userContent }],
      })

      html = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim()

      if (message.stop_reason === 'max_tokens') {
        return NextResponse.json({
          html,
          warning: 'Output hit the length limit and may be cut off near the bottom.',
        })
      }

      return NextResponse.json({ html, mode })
    } else {
      const { generateAdvertorial } = await import('@/lib/claude')

      const TEMPLATE_PROMPTS: Record<string, string> = {
        'advertorial-news': `You are an expert advertorial copywriter. Create a NEWS-STYLE advertorial landing page.
FORMAT: Top urgency bar, author byline, large headline, article body, inline CTA, social proof comments, bottom CTA. White background, green CTAs, red urgency bar. Mobile responsive.`,
        'advertorial-listicle': `You are an expert advertorial copywriter. Create a LISTICLE-STYLE advertorial landing page.
FORMAT: Curiosity headline, numbered list 5-7 items with emoji+title+description, mid-page CTA, reviews, urgency bottom CTA. Mobile responsive.`,
        'advertorial-story': `You are an expert advertorial copywriter. Create a STORY/BEFORE-AFTER advertorial landing page.
FORMAT: Transformation headline, story arc (problem→discovery→result), quote callouts, before/after section, social proof, urgency CTA. Mobile responsive.`,
        'advertorial-review': `You are an expert advertorial copywriter. Create a REVIEW/EDITORIAL advertorial landing page.
FORMAT: Honest review headline, star rating, verdict box, pros list, deep dive sections, comparison table, buy box with guarantee. Mobile responsive.`,
      }

      const basePrompt = TEMPLATE_PROMPTS[templateId] || TEMPLATE_PROMPTS['advertorial-news']
      const copyData = Object.entries(copy || {})
        .filter(([k]) => k !== 'page_title')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')

      const prompt = `${basePrompt}

COPY: ${copyData}

OUTPUT: Complete self-contained HTML only. No explanations. No markdown.`

      html = await generateAdvertorial(prompt)
      html = html.replace(/^```html\n?/i, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

      return NextResponse.json({ html })
    }
  } catch (e: any) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: e?.message || 'Generation failed' }, { status: 500 })
  }
}