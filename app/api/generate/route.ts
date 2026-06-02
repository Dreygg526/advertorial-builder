import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    // `screenshot` is an optional base64 data URL of the page (data:image/png;base64,...)
    const { type, copy, templateId, scrapedHtml, screenshot } = await req.json()

    let html = ''

    if (type === 'clone') {
      // Size guard: ~4 chars per token. Cap source at ~700k chars (~175k tokens)
      // so we never hit the 1M input limit even with a screenshot attached.
      const MAX_CHARS = 700000
      let source = scrapedHtml || ''
      if (source.length > MAX_CHARS) {
        source = source.slice(0, MAX_CHARS)
      }

      // Build the message content. If a screenshot is provided, send it as an
      // image block so the model can SEE the real layout, not just guess from markup.
      const userContent: Anthropic.MessageParam['content'] = []

      if (screenshot && typeof screenshot === 'string' && screenshot.startsWith('data:image')) {
        const [meta, b64] = screenshot.split(',')
        const mediaType = (meta.match(/data:(image\/\w+);/)?.[1] || 'image/png') as
          | 'image/png'
          | 'image/jpeg'
          | 'image/webp'
          | 'image/gif'
        userContent.push({
          type: 'image',
          source: { type: 'base64', media_type: mediaType, data: b64 },
        })
      }

      userContent.push({
        type: 'text',
        text: `You are an expert at making an existing web page SELF-CONTAINED without changing how it looks.

You are given the page's HTML, and (when present) the CSS is already inlined inside <style> tags within that HTML. ${screenshot ? 'You are ALSO given a screenshot of the rendered page — treat the screenshot as the source of truth for visual appearance and match it exactly.' : ''}

YOUR JOB IS TO PRESERVE, NOT REBUILD.
Do NOT redesign, re-author, "improve", simplify, or re-create the page from scratch. Reproduce it.

PRESERVE EXACTLY:
- The same HTML structure, element order, nesting, class names, ids, and ALL text content — verbatim.
- ALL CSS values exactly as given: every hex color, rgba, px value, font-family, font-weight, line-height, letter-spacing, border-radius, box-shadow, gap, padding, margin, max-width, grid/flex rule. Copy them; do not invent or "round" them.
- ALL image src URLs, background-image URLs, and asset links exactly as they appear.
- The exact fonts referenced in the source (keep the original @import / font-family). Do NOT substitute Oswald/Inter/Lato unless the source actually uses them.

MAKE IT SELF-CONTAINED (the only changes you may make):
- Consolidate all CSS into a single <style> tag in <head>, keeping every value identical.
- For interactive behavior that has NO inline handler (accordions, countdown timers, sliders, sticky bars, marquees), recreate it with minimal vanilla JavaScript in one <script> tag, matching the original behavior.
- Convert relative asset paths to absolute URLs where you can infer the origin.
- Remove ONLY: Shopify Liquid tags, tracking pixels, analytics, and third-party app <script> tags.
- Keep it mobile responsive using the source's own media queries — do not change the breakpoints.

OUTPUT RULES:
- One self-contained HTML file beginning with <!DOCTYPE html>.
- Output ONLY raw HTML. No explanation, no markdown, no code fences.

HERE IS THE SOURCE (HTML with CSS inlined):
${source}`,
      })

      const message = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 32000,
        messages: [{ role: 'user', content: userContent }],
      })

      // Concatenate every text block (long outputs can arrive in multiple blocks)
      html = message.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map(b => b.text)
        .join('')
        .replace(/^```html\n?/i, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim()
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
    }

    return NextResponse.json({ html })
  } catch (e: any) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 })
  }
}