import { NextRequest, NextResponse } from 'next/server'
import { generateAdvertorial } from '@/lib/claude'

const TEMPLATE_PROMPTS: Record<string, string> = {
  'advertorial-news': `You are an expert advertorial copywriter. Create a NEWS-STYLE advertorial landing page.

FORMAT REQUIREMENTS:
- Looks like a real news/editorial article
- Top urgency bar (red background, white text, stock warning + offer)
- Publication-style header with logo placeholder, date, author byline
- Large compelling headline (H1)
- Subheadline that hooks the reader
- Article body with drop cap on first paragraph
- Inline CTA button mid-article (green, high contrast)
- Social proof section with Facebook-style comments (3-5 fake but realistic comments)
- Bottom CTA section with offer and guarantee
- Sticky sidebar on desktop with CTA (position: fixed right side)
- Mobile responsive

DESIGN: White background, newspaper-style typography, green CTA buttons (#2e7d32), red urgency bar`,

  'advertorial-listicle': `You are an expert advertorial copywriter. Create a LISTICLE-STYLE advertorial landing page.

FORMAT REQUIREMENTS:
- Curiosity headline ("X Reasons Why..." or "X Things That...")
- Short intro paragraph
- Numbered list items (5-7 items) each with an icon/emoji, bold title, and 2-3 sentences
- Each list item naturally leads to the product
- Mid-page CTA after item 3-4
- Social proof (star ratings, customer count)
- Bottom offer section with urgency
- Mobile responsive

DESIGN: Clean white background, numbered items with circle badges, green CTA buttons`,

  'advertorial-story': `You are an expert advertorial copywriter. Create a STORY/BEFORE-AFTER advertorial landing page.

FORMAT REQUIREMENTS:
- Attention-grabbing headline focused on transformation
- Personal story format: Character intro → Problem → Discovery → Transformation → CTA
- Conversational first-person voice
- Quote callouts (blockquote style) for emotional moments
- "Before" vs "After" comparison section
- Doctor/expert quote for credibility
- Social proof comments
- Urgency-based CTA at bottom
- Mobile responsive

DESIGN: Warm editorial feel, tan/cream accents, serif fonts for story sections`,

  'advertorial-review': `You are an expert advertorial copywriter. Create a REVIEW/EDITORIAL advertorial landing page.

FORMAT REQUIREMENTS:
- "Honest Review" style headline
- Editorial credibility bar (publication name, reviewer credentials)
- Star rating display (4.8/5)
- Quick verdict box at top
- Pros list with checkmarks (no cons)
- Deep dive sections (how it works, who it's for, results)
- Expert/doctor quote
- Side-by-side comparison with competitors (product wins)
- "Buy Box" at bottom with offer, guarantee, CTA button
- Mobile responsive

DESIGN: Professional editorial look, trust signals throughout, blue/green CTA`
}

export async function POST(req: NextRequest) {
  try {
    const { type, url, copy, templateId, scrapedHtml } = await req.json()

    let prompt = ''

    if (type === 'clone') {
      prompt = `You are an expert frontend developer and advertorial copywriter.

${scrapedHtml ? `Here is the HTML structure of a landing page I want to clone:
<source_html>
${scrapedHtml.slice(0, 30000)}
</source_html>

Analyze its layout, sections, and design patterns.` : `I want to create an advertorial landing page similar to: ${url}`}

Create a complete, self-contained HTML advertorial page that:
1. MIMICS the structural layout and section flow of the reference
2. Uses this copy and product information:
   - Headline: ${copy.headline || 'A compelling headline'}
   - Subheadline: ${copy.subheadline || ''}
   - Body copy: ${copy.body_copy || ''}
   - Product name: ${copy.product_name || 'Product'}
   - CTA text: ${copy.cta_text || 'CHECK AVAILABILITY'}
   - Offer: ${copy.offer || '70% OFF Today Only'}
3. Includes realistic fake social proof comments (Facebook-style)
4. Has proper mobile responsiveness
5. Has urgency elements (limited stock, countdown feel)
6. Uses professional advertorial design patterns

OUTPUT: Return ONLY the complete HTML document. No explanations. No markdown. Just the raw HTML starting with <!DOCTYPE html>.`

    } else {
      // Template mode
      const basePrompt = TEMPLATE_PROMPTS[templateId] || TEMPLATE_PROMPTS['advertorial-news']
      const copyData = Object.entries(copy)
        .filter(([k]) => k !== 'page_title')
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')

      prompt = `${basePrompt}

USE THIS COPY AND PRODUCT INFORMATION:
${copyData}

TECHNICAL REQUIREMENTS:
- Complete self-contained HTML document (<!DOCTYPE html> through </html>)
- All CSS inline in <style> tags in <head>
- No external dependencies except Google Fonts
- Mobile responsive with media queries
- CTA buttons use onclick that could be replaced with real URLs
- Placeholder images use https://placehold.co/[dimensions]/[bg]/[text] format
- Realistic fake social proof comments (use realistic names, not "John Doe")

OUTPUT: Return ONLY the complete HTML document. No explanations. No markdown. No code fences. Just raw HTML.`
    }

    const html = await generateAdvertorial(prompt)

    // Clean up any markdown code fences Claude might add
    const cleaned = html
      .replace(/^```html\n?/i, '')
      .replace(/^```\n?/, '')
      .replace(/\n?```$/, '')
      .trim()

    return NextResponse.json({ html: cleaned })
  } catch (e: any) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: e.message || 'Generation failed' }, { status: 500 })
  }
}
