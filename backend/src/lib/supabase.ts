import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const anonKey = process.env.SUPABASE_ANON_KEY!

// Admin client — bypasses RLS (use only server-side)
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Anon client — respects RLS
export const supabase = createClient(supabaseUrl, anonKey)

// Create a client scoped to a user JWT (respects RLS as that user)
export function supabaseForUser(token: string) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
}
