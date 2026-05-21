import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { title, html, type, source_url, template_name } = await req.json()

    const { data, error } = await supabase
      .from('saved_pages')
      .insert({
        title,
        html,
        type,
        source_url: source_url || null,
        template_name: template_name || null,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('Save error:', e)
    return NextResponse.json({ error: e.message || 'Save failed' }, { status: 500 })
  }
}
