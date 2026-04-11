/**
 * Server-Only Supabase Client
 *
 * Uses the SERVICE_ROLE key which bypasses all RLS policies.
 * ⚠️  NEVER import this file in client components or expose it to the browser.
 * This module is safe only inside Next.js API routes (route.ts) and Server Components.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    '[supabase-server] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
    'Ensure both are set in .env.local and are NOT prefixed NEXT_PUBLIC_ for secret values.'
  )
}

/**
 * Admin-level Supabase client. Bypasses all RLS.
 * Only use in server-side routes after manual authentication checks.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})
