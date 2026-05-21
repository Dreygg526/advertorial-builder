import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Could not fetch URL (status ${res.status}). Try copying the HTML manually using browser inspect.` }, { status: 400 })
    }

    const html = await res.text()
    // Return success — the HTML will be used in the generate step
    return NextResponse.json({ success: true, length: html.length, html: html.slice(0, 50000) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to scrape URL' }, { status: 500 })
  }
}
