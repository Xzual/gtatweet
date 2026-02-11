import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Export the client, but handle empty values gracefully for build-time (will throw at runtime if still empty)
export const supabase = createClient(
    supabaseUrl || 'https://placeholder-url.supabase.co',
    supabaseAnonKey || 'placeholder-key'
)
