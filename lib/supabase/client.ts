import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (uses anon key, respects RLS)
export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase client environment variables')
  }

  return createClient(supabaseUrl, anonKey)
}
