'use client'

import dynamic from 'next/dynamic'
import { GlassCard } from '@/components/stitch/GlassCard'
import { NeonButton } from '@/components/stitch/NeonButton'
import { DepthHoverContainer } from '@/components/stitch/DepthHoverContainer'
import Link from 'next/link'
import { ShieldCheck, UserPlus, Fingerprint, Building2 } from 'lucide-react'
import { motion } from 'framer-motion'

const Hero3D = dynamic(
  () => import('@/components/Hero3D').then(m => ({ default: m.Hero3D })),
  { ssr: false, loading: () => <div className="absolute inset-0 bg-background" /> }
)



export default function Home() {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden text-foreground selection:bg-primary/30 gradient-mesh">
      <Hero3D />

      {/* Foreground UI */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20">

        {/* ── Institutional header ──────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute top-8 left-8 flex items-center gap-3 pointer-events-none z-20"
        >
          <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-primary/80">Keystone School of Engineering</p>
            <p className="text-[10px] text-white/30 tracking-wider">Intelligent Visitor Management System</p>
          </div>
        </motion.div>

        {/* ── Hero text ────────────────────────────────────── */}
        <div className="text-center space-y-5 max-w-3xl pointer-events-none mb-20">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-7xl md:text-9xl font-black tracking-[-0.04em] bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-transparent">
              GATEX<span className="text-primary">-KSE</span>
            </h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-lg md:text-xl text-white/40 font-light tracking-wide max-w-md mx-auto"
          >
            Enterprise-grade campus security.{' '}
            <span className="text-white/60">AI-powered visitor intelligence.</span>
          </motion.p>
        </div>

        {/* ── Action cards ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl z-20">

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <DepthHoverContainer>
              <GlassCard delay={0.1} glowColor="cyan" className="h-[280px] flex w-full">
                <div className="w-full h-full flex flex-col items-center justify-center space-y-5 group">
                  <div className="p-4 rounded-2xl bg-primary/[0.06] text-primary group-hover:scale-105 transition-transform duration-700 w-fit self-center">
                    <UserPlus size={36} strokeWidth={1.5} />
                  </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-1.5 tracking-tight">Request Pass</h2>
                  <p className="text-white/40 text-sm leading-relaxed">Initialize a new visitor entry sequence.</p>
                </div>
                <Link href="/visitor/request" className="w-full mt-auto pt-2">
                  <NeonButton glowColor="cyan" className="w-full bg-primary/[0.08] hover:bg-primary/15 text-primary border border-primary/20">
                    Begin Sequence
                  </NeonButton>
                </Link>
                </div>
              </GlassCard>
            </DepthHoverContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <DepthHoverContainer>
              <GlassCard delay={0.2} glowColor="indigo" className="h-[280px] flex w-full">
                <div className="w-full h-full flex flex-col items-center justify-center space-y-5 group">
                  <div className="p-4 rounded-2xl bg-secondary/[0.06] text-secondary group-hover:scale-105 transition-transform duration-700 w-fit self-center">
                    <ShieldCheck size={36} strokeWidth={1.5} />
                  </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-1.5 tracking-tight">Command Center</h2>
                  <p className="text-white/40 text-sm leading-relaxed">Authorize requests & monitor analytics.</p>
                </div>
                <Link href="/admin" className="w-full mt-auto pt-2">
                  <NeonButton glowColor="indigo" className="w-full bg-secondary/[0.08] hover:bg-secondary/15 text-secondary border border-secondary/20">
                    Access Portal
                  </NeonButton>
                </Link>
                </div>
              </GlassCard>
            </DepthHoverContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>
            <DepthHoverContainer>
              <GlassCard delay={0.3} className="h-[280px] flex w-full">
                <div className="w-full h-full flex flex-col items-center justify-center space-y-5 group">
                  <div className="p-4 rounded-2xl bg-white/[0.04] text-white/70 group-hover:scale-105 transition-transform duration-700 group-hover:text-primary w-fit self-center">
                    <Fingerprint size={36} strokeWidth={1.5} />
                  </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-1.5 tracking-tight">Security Hub</h2>
                  <p className="text-white/40 text-sm leading-relaxed">Terminal-grade QR verification system.</p>
                </div>
                <Link href="/security" className="w-full mt-auto pt-2">
                  <NeonButton glowColor="cyan" variant="outline" className="w-full border-white/10 text-white/70 hover:bg-white/[0.04] hover:text-white">
                    Launch Terminal
                  </NeonButton>
                </Link>
                </div>
              </GlassCard>
            </DepthHoverContainer>
          </motion.div>

        </div>

        {/* ── Footer watermark ─────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-6 text-center pointer-events-none"
        >
          <p className="text-[10px] text-white/15 tracking-[0.3em] uppercase">
            Keystone School of Engineering, Pune · Powered by GateX-KSE v2.0
          </p>
          <p className="text-[9px] text-white/10 tracking-[0.2em] mt-1">
            Engineered by Abhijeet Kangane
          </p>
        </motion.div>

      </div>
    </main>
  )
}
