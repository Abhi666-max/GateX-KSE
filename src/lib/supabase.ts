/**
 * SSR-aware Supabase Client (Browser)
 *
 * Uses @supabase/ssr to persist session via cookies so that
 * Next.js Server Components and middleware can read auth state.
 * Uses the publishable anon key only — safe to expose to client.
 */
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Singleton for use in client components
// Re-export for backwards compatibility with existing imports
export const supabase = createClient()
