import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { type, copy, templateId, scrapedHtml } = await req.json()

    let html = ''

    if (type === 'clone') {
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 16000,
        messages: [
          {
            role: 'user',
            content: `You are an elite frontend developer specializing in pixel-perfect HTML clones.

STEP 1 — ANALYZE the source HTML:
- Identify every section from top to bottom (announcement bars, hero, comparison tables, feature sections, CTA boxes, reviews, FAQ, footer, sticky CTAs)
- Extract the exact colors (hex codes), fonts, spacing, border-radius, box-shadows
- Note the layout patterns (flexbox, grid, max-widths, padding)
- Identify all interactive elements (countdowns, accordions, marquees, sticky bars)

STEP 2 — BUILD the clone:
- Write clean HTML that recreates every section in the exact same order
- Write all CSS inside a <style> tag in the <head>
- Use the exact same hex color codes from the source
- Use Google Fonts to match the fonts (Oswald for bold/display, Inter or Lato for body)
- Keep all image URLs exactly as they appear in the source
- Recreate all interactive elements using vanilla JavaScript in a <script> tag
- Make it fully mobile responsive with media queries

STEP 3 — OUTPUT rules:
- Single self-contained HTML file
- No external CSS files
- No Shopify scripts, tracking pixels, or third party app scripts
- No Liquid tags
- Works when pasted directly into Shopify as a standalone page
- Output ONLY the raw HTML starting with <!DOCTYPE html>
- Zero explanations, zero markdown, zero code fences

HERE IS THE HTML SOURCE TO CLONE:
${(scrapedHtml || '').slice(0, 100000)}`,
          },
        ],
      })

      const content = message.content[0]
      if (content.type === 'text') {
        html = content.text
          .replace(/^```html\n?/i, '')
          .replace(/^```\n?/, '')
          .replace(/\n?```$/, '')
          .trim()
      }

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
FORMAT: Honest review headline, star rating, verdict box, pros list, deep dive sections, comparison table, buy box with guarantee. Mobile responsive.`
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