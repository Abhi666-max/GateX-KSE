'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/stitch/GlassCard'
import { NeonButton } from '@/components/stitch/NeonButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ShieldCheck, Loader2, Building2, Lock } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Step 1: Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error || !data?.user) {
        toast.error('Authentication Failed', { description: error?.message ?? 'Invalid credentials.' })
        setLoading(false)
        return
      }

      // Step 2: Fetch role from public.users
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profileError || !profile?.role) {
        toast.error('Access Denied', {
          description: profileError?.message ?? 'User role not found. Contact administrator.',
        })
        setLoading(false)
        return
      }

      const role = (profile.role as string).toUpperCase()
      toast.success('Access Granted', { description: `Welcome. Role: ${role}` })

      // Step 3: Determine target route
      let targetRoute = next
      if (role === 'ADMIN') targetRoute = '/admin'
      else if (role === 'SECURITY') targetRoute = '/security'

      // CRITICAL FIX: Use window.location.href (hard/full navigation) instead of router.push().
      //
      // WHY: router.push() is a client-side soft navigation — the login page component
      // never unmounts, so `loading` stays `true` forever (infinite spinner).
      // It also does NOT reliably send session cookies to Next.js middleware on the
      // first request, causing middleware to think the user is not authenticated.
      //
      // window.location.href does a full page reload — cookies are sent fresh,
      // middleware can verify the session correctly, and the spinner resolves naturally.
      window.location.href = targetRoute

    } catch (err) {
      console.error('[Login] Unexpected error:', err)
      toast.error('Login Failed', { description: 'An unexpected error occurred.' })
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@gatex-kse.io"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm"
        />
      </div>

      <NeonButton
        type="submit"
        disabled={loading}
        glowColor="cyan"
        className="w-full h-11 bg-primary/[0.08] hover:bg-primary/15 text-primary border border-primary/20 mt-3"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-3.5 h-3.5 mr-2" />}
        {loading ? 'Authenticating...' : 'Access System'}
      </NeonButton>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden gradient-mesh">
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="w-full" delay={0}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/[0.06] text-primary mb-5 ring-1 ring-primary/20">
              <ShieldCheck size={28} strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">
              GateX<span className="text-primary">-KSE</span>
            </h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Building2 className="w-3 h-3 text-white/20" />
              <p className="text-[10px] text-white/25 tracking-[0.15em] uppercase">Keystone School of Engineering</p>
            </div>
          </div>

          <Suspense fallback={<div className="h-[260px] animate-pulse rounded-lg bg-white/[0.03]" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-white/[0.05] text-center">
            <Link href="/" className="text-white/20 text-xs hover:text-white/40 transition-colors">
              ← Return to public portal
            </Link>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
