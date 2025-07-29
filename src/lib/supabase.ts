import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Legacy client for compatibility (fallback if env vars not set)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types
export interface DbItemRecord {
  id: string
  user_id: string
  item: string
  location: string
  created_at: string
  raw_input: string
  source: string
  tags: string[]
  updated_at?: string
}

export interface DbRecycleBinItem extends DbItemRecord {
  deleted_at: string
  delete_reason: string
}