/**
 * GateX Middleware — Route Protection (FIXED v2)
 *
 * Root cause of bug:
 *   The middleware was querying public.users with the anon key.
 *   RLS blocked the query because auth.uid() was not established
 *   in the Edge Runtime before the query ran → userRecord was always
 *   null → every user got redirected to /unauthorized.
 *
 * Fix:
 *   Use a separate Supabase admin client (service_role key) ONLY for
 *   the role lookup. The session cookie client is still used for
 *   getUser() to keep auth secure. Service role bypasses RLS safely
 *   on the server side and is never exposed to the browser.
 */
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes requiring specific roles (uppercase to match DB values)
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/admin': ['ADMIN'],
  '/api/admin': ['ADMIN'],
  '/security': ['SECURITY', 'ADMIN'],
  '/api/security': ['SECURITY', 'ADMIN'],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Determine if this path requires protection
  const requiredRoles = Object.entries(PROTECTED_ROUTES).find(([route]) =>
    pathname.startsWith(route)
  )?.[1]

  if (!requiredRoles) {
    // Public route — allow through, but still refresh session cookies
    return NextResponse.next({ request })
  }

  // ── Step 1: Create session client (anon key + cookies) ──────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // ── Step 2: Verify authenticated user ───────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error('[GateX Middleware] Auth error:', authError.message)
  }

  if (!user) {
    // Not logged in — redirect to login
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    console.log(`[GateX Middleware] No session → redirecting to login from ${pathname}`)
    return NextResponse.redirect(loginUrl)
  }

  // ── Step 3: Fetch role using service_role (bypasses RLS safely) ──
  // This is safe because this code ONLY runs on the server (Edge).
  // The service_role key is never sent to the client.
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return []
        },
        setAll() {
          // Admin client doesn't need to set cookies
        },
      },
    }
  )

  const { data: userRecord, error: roleError } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (roleError) {
    console.error('[GateX Middleware] Role fetch error:', roleError.message)
  }

  const userRole = userRecord?.role as string | undefined

  console.log(`[GateX Middleware] User: ${user.email} | Role: ${userRole} | Path: ${pathname}`)

  if (!userRole) {
    console.warn(`[GateX Middleware] Role not found for user ${user.id}`)
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
  }

  if (!requiredRoles.includes(userRole.toUpperCase())) {
    console.warn(
      `[GateX Middleware] Role "${userRole}" not in [${requiredRoles.join(', ')}] for ${pathname}`
    )
    return NextResponse.redirect(new URL('/auth/unauthorized', request.url))
  }

  // ── Step 4: Access granted ───────────────────────────────────────
  console.log(`[GateX Middleware] ✅ Access granted → ${pathname}`)
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static  (static files)
     * - _next/image   (image optimization files)
     * - favicon.ico
     * - Public visitor routes (/visitor/*)
     * - Auth routes (/auth/*)
     */
    '/((?!_next/static|_next/image|favicon.ico|visitor|auth).*)',
  ],
}
