import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type SavedPage = {
  id: string
  title: string
  html: string
  type: 'clone' | 'template'
  source_url?: string
  template_name?: string
  created_at: string
}
