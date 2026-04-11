'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/stitch/GlassCard'
import { Loader2, CheckCircle2, Clock, XCircle, ArrowLeft, Building2, Shield } from 'lucide-react'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import type { DbVisitor, DbPass } from '@/types/database'
import { motion, AnimatePresence } from 'framer-motion'

export default function StatusPage() {
  const { id } = useParams<{ id: string }>()
  const [visitor, setVisitor] = useState<DbVisitor | null>(null)
  const [pass, setPass] = useState<DbPass | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    const { data: v, error } = await supabase
      .from('visitors')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    setLoading(false)
    if (error || !v) return

    setVisitor(v)

    if (v.status === 'APPROVED') {
      const { data: p } = await supabase
        .from('passes')
        .select('*')
        .eq('visitor_id', id)
        .maybeSingle()
      if (p) setPass(p)
    }
  }

  useEffect(() => {
    if (!id) return
    fetchData()

    const channel = supabase
      .channel(`visitor_status_${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'visitors',
          filter: `id=eq.${id}`,
        },
        async (payload) => {
          const updated = payload.new as DbVisitor
          setVisitor(updated)

          if (updated.status === 'APPROVED') {
            const { data: p } = await supabase
              .from('passes')
              .select('*')
              .eq('visitor_id', id)
              .maybeSingle()
            if (p) setPass(p)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gradient-mesh">
        <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
      </div>
    )
  }

  if (!visitor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 gradient-mesh">
        <GlassCard className="text-center max-w-sm" delay={0}>
          <p className="text-red-400/80 text-sm">Visitor record not found.</p>
          <Link href="/" className="text-white/30 mt-4 block text-xs hover:text-white/50 transition-colors">← Return to portal</Link>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden gradient-mesh">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/3 rounded-full blur-[120px] pointer-events-none" />

      <Link href="/" className="absolute top-6 left-6 text-white/25 hover:text-white/50 group flex items-center gap-2 transition-colors z-20">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs">Portal</span>
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <GlassCard className="max-w-sm w-full text-center" delay={0}>
          {/* Header */}
          <div className="mb-1">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Building2 className="w-3 h-3 text-primary/40" />
              <p className="text-[9px] text-primary/40 tracking-[0.15em] uppercase">Keystone Engineering</p>
            </div>
            <h1 className="text-lg font-bold text-white/80">Pass Status</h1>
            <p className="text-white/20 text-[11px] font-mono mt-1">ID: {visitor.id.split('-')[0].toUpperCase()}</p>
          </div>

          <AnimatePresence mode="wait">
            {visitor.status === 'PENDING' && (
              <motion.div
                key="pending"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8 text-amber-400"
              >
                <Clock className="w-14 h-14 animate-pulse" />
                <div>
                  <p className="font-semibold text-lg">Awaiting Approval</p>
                  <p className="text-white/30 text-sm mt-1">Your host has been notified.</p>
                </div>
                <div className="flex gap-1 mt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-amber-400"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {visitor.status === 'REJECTED' && (
              <motion.div
                key="rejected"
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4 py-8 text-red-400"
              >
                <XCircle className="w-14 h-14" />
                <div>
                  <p className="font-semibold text-lg">Entry Denied</p>
                  <p className="text-white/30 text-sm mt-1">Your request was not approved.</p>
                </div>
              </motion.div>
            )}

            {visitor.status === 'APPROVED' && pass && (
              <motion.div
                key="approved"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-5 py-4"
              >
                <div className="text-emerald-400 flex flex-col items-center gap-1">
                  <CheckCircle2 className="w-8 h-8" />
                  <p className="font-black text-lg uppercase tracking-[0.2em]">Approved</p>
                </div>

                <div className="p-3 bg-white rounded-2xl shadow-[0_0_50px_rgba(0,245,255,0.12)] mx-auto w-fit">
                  <QRCodeSVG
                    value={pass.qr_code_hash}
                    size={180}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="text-center space-y-1.5">
                  <p className="text-xs text-white/50">
                    Valid until{' '}
                    <span className="text-primary font-mono">
                      {new Date(pass.valid_until).toLocaleString()}
                    </span>
                  </p>
                  
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <Shield className="w-3 h-3 text-emerald-400" />
                      <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Keystone Institutional Verification</p>
                    </div>
                    <p className="text-[10px] text-white/20 italic">Present this QR code to security at the gate.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  )
}
