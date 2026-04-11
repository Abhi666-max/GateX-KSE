'use client'

import Link from 'next/link'
import { ShieldOff, ArrowLeft } from 'lucide-react'
import { GlassCard } from '@/components/stitch/GlassCard'
import { NeonButton } from '@/components/stitch/NeonButton'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-destructive/5 pointer-events-none" />
      <GlassCard className="w-full max-w-sm text-center relative z-10" delay={0}>
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-destructive/10 text-destructive mb-4 ring-1 ring-destructive/30 mx-auto">
          <ShieldOff size={32} strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-white/50 text-sm mb-8">
          You do not have the required role to access this area.
          Contact your system administrator.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/auth/login">
            <NeonButton glowColor="cyan" className="w-full bg-primary/10 text-primary border border-primary/30">
              Switch Account
            </NeonButton>
          </Link>
          <Link href="/" className="text-white/30 text-sm hover:text-white/60 transition-colors flex items-center justify-center gap-2">
            <ArrowLeft className="w-3 h-3" /> Back to Portal
          </Link>
        </div>
      </GlassCard>
    </div>
  )
}
