'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { GlassCard } from '@/components/stitch/GlassCard'
import { NeonButton } from '@/components/stitch/NeonButton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, Check, X, Users, Clock, ShieldCheck, LogOut,
  Activity, AlertTriangle, TrendingUp, Building2, Zap,
  Download, Trash2, UserCheck
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import type { DbVisitor } from '@/types/database'

/* ── Animated counter ─────────────────────────────────────── */
function AnimatedCounter({ value, className = '' }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 600
    const start = display
    const diff = value - start
    if (diff === 0) return
    const startTime = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(start + diff * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [value])
  return <span className={className}>{display}</span>
}

/* ── Mini bar chart ───────────────────────────────────────── */
function MiniBarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase">{label}</p>
      <div className="flex items-end gap-[3px] h-12">
        {data.map((v, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${(v / max) * 100}%` }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 rounded-sm bg-primary/40 min-h-[2px] hover:bg-primary/70 transition-colors"
            title={`${v}`}
          />
        ))}
      </div>
    </div>
  )
}

/* ── Time utility ─────────────────────────────────────────── */
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

/* ── CSV Export Utility ───────────────────────────────────── */
function exportToCSV(visitors: DbVisitor[]) {
  const headers = ['ID', 'Visitor Name', 'Phone', 'Gender', 'ID Proof', 'ID Number', 'Host', 'Purpose', 'No. of Visitors', 'Status', 'Created At']
  const rows = visitors.map(v => [
    v.id.split('-')[0].toUpperCase(),
    v.visitor_name || '',
    v.phone || '',
    v.gender || '',
    v.id_proof_type || '',
    v.id_proof_number || '',
    v.host_name || '',
    `"${(v.purpose || '').replace(/"/g, '""')}"`,
    v.num_visitors || 1,
    v.status,
    new Date(v.created_at).toLocaleString(),
  ])
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gatex-kse_visitors_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Exported', { description: `${visitors.length} records exported to CSV.` })
}

export default function AdminDashboard() {
  const [visitors, setVisitors] = useState<DbVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [lockdown, setLockdown] = useState(false)

  const fetchVisitors = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('visitors')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[AdminDashboard] fetchVisitors error', error)
      toast.error('Load Failed', { description: error.message || 'Could not fetch visitor records.' })
      setVisitors([])
      setLoading(false)
      return
    }

    setVisitors((data ?? []) as DbVisitor[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchVisitors()
    const channel = supabase
      .channel('admin_visitors_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, fetchVisitors)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchVisitors])

  const handleAction = async (visitor: DbVisitor, action: 'APPROVE' | 'REJECT') => {
    setActionLoading(visitor.id)
    try {
      const res = await fetch('/api/admin/passes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitor_id: visitor.id, action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error('Action Failed', { description: data.error ?? 'Please try again.' })
        return
      }
      if (action === 'APPROVE') {
        toast.success('Access Granted', {
          description: `Pass generated for ${visitor.visitor_name || visitor.host_name}.`,
        })
      } else {
        toast.error('Entry Denied', {
          description: `${visitor.visitor_name || 'Visitor'}'s request rejected.`,
        })
      }
    } catch {
      toast.error('Network Error', { description: 'Could not reach server.' })
    } finally {
      setActionLoading(null)
    }
  }

  const handleReset = async () => {
    if (!confirm('⚠️ This will permanently delete ALL visitor records, passes, and logs. This action cannot be undone.\n\nAre you sure?')) return
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      if (res.ok) {
        toast.success('System Reset', { description: 'All visitor data has been purged.' })
        setVisitors([])
      } else {
        toast.error('Reset Failed')
      }
    } catch {
      toast.error('Network Error')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  /* Analytics */
  const pending = visitors.filter(v => v.status === 'PENDING').length
  const approved = visitors.filter(v => v.status === 'APPROVED').length
  const rejected = visitors.filter(v => v.status === 'REJECTED').length
  const totalVisitorCount = visitors.reduce((sum, v) => sum + (v.num_visitors || 1), 0)

  const hourlyData = useMemo(() => {
    const slots = Array(7).fill(0)
    const now = Date.now()
    visitors.forEach(v => {
      const age = (now - new Date(v.created_at).getTime()) / 3600000
      const slot = Math.min(Math.floor(age), 6)
      slots[6 - slot]++
    })
    return slots
  }, [visitors])

  const entryExitRatio = approved > 0 ? ((approved / Math.max(visitors.length, 1)) * 100).toFixed(0) : '0'

  return (
    <div className={`min-h-screen p-4 md:p-8 relative overflow-hidden transition-colors duration-700 ${
      lockdown ? 'bg-red-950/30' : 'bg-background'
    } gradient-mesh`}>
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-secondary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[40vw] h-[40vw] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Lockdown overlay */}
      <AnimatePresence>
        {lockdown && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <AlertTriangle className="w-24 h-24 text-red-500 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-4xl font-black text-red-500 tracking-tight mb-3">LOCKDOWN ACTIVE</h2>
              <p className="text-red-300/60 mb-8">All visitor entry suspended. No new passes will be issued.</p>
              <Button onClick={() => setLockdown(false)} className="bg-red-500 hover:bg-red-600 text-white px-8">
                Deactivate Lockdown
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-white/30 hover:text-white/60 transition-colors flex items-center gap-2 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-primary/60 tracking-[0.15em] uppercase font-medium">Keystone Engineering</p>
                <h1 className="text-lg font-bold tracking-tight text-white/90">GateX-KSE Command Center</h1>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => exportToCSV(visitors)} disabled={visitors.length === 0}
              className="text-white/30 hover:text-white/60 transition-colors text-xs">
              <Download className="w-3.5 h-3.5 mr-1.5" /> Export CSV
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}
              className="text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Reset Data
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLockdown(true)}
              className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs">
              <AlertTriangle className="w-3.5 h-3.5 mr-1.5" /> Lockdown
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}
              className="text-white/30 hover:text-white/60 transition-colors text-xs">
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Sign out
            </Button>
          </div>
        </div>

        {/* ── Stat cards ─────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <GlassCard delay={0.05} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-1">Total Requests</p>
                {loading ? <Skeleton className="h-8 w-14 bg-white/5" /> : (
                  <AnimatedCounter value={visitors.length} className="text-3xl font-bold tracking-tighter" />
                )}
              </div>
              <div className="p-2 rounded-lg bg-white/[0.04]"><Users className="w-4 h-4 text-white/40" /></div>
            </div>
          </GlassCard>

          <GlassCard delay={0.08} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-primary/60 tracking-[0.15em] uppercase mb-1">Total People</p>
                {loading ? <Skeleton className="h-8 w-14 bg-white/5" /> : (
                  <AnimatedCounter value={totalVisitorCount} className="text-3xl font-bold tracking-tighter text-primary" />
                )}
              </div>
              <div className="p-2 rounded-lg bg-primary/[0.06]"><UserCheck className="w-4 h-4 text-primary/60" /></div>
            </div>
          </GlassCard>

          <GlassCard delay={0.1} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-amber-400/60 tracking-[0.15em] uppercase mb-1">Pending</p>
                {loading ? <Skeleton className="h-8 w-14 bg-white/5" /> : (
                  <AnimatedCounter value={pending} className="text-3xl font-bold tracking-tighter text-amber-400" />
                )}
              </div>
              <div className="p-2 rounded-lg bg-amber-400/[0.06]"><Clock className="w-4 h-4 text-amber-400/60" /></div>
            </div>
            {pending > 0 && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full">
                  <Zap className="w-2.5 h-2.5" /> Requires attention
                </span>
              </div>
            )}
          </GlassCard>

          <GlassCard delay={0.15} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-emerald-400/60 tracking-[0.15em] uppercase mb-1">Active Passes</p>
                {loading ? <Skeleton className="h-8 w-14 bg-white/5" /> : (
                  <AnimatedCounter value={approved} className="text-3xl font-bold tracking-tighter text-emerald-400" />
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-400/[0.06]"><ShieldCheck className="w-4 h-4 text-emerald-400/60" /></div>
            </div>
          </GlassCard>

          <GlassCard delay={0.2} className="!p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-1">Approval Rate</p>
                {loading ? <Skeleton className="h-8 w-14 bg-white/5" /> : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tracking-tighter">{entryExitRatio}</span>
                    <span className="text-sm text-white/30">%</span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-white/[0.04]"><TrendingUp className="w-4 h-4 text-white/40" /></div>
            </div>
          </GlassCard>
        </div>

        {/* ── Analytics row ──────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <GlassCard delay={0.25} className="!p-4 md:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary/60" />
                <p className="text-xs font-medium text-white/50">Visitor Activity</p>
              </div>
              <span className="text-[10px] text-white/20 tracking-wider font-mono">LAST 7H</span>
            </div>
            <MiniBarChart data={hourlyData} label="" />
          </GlassCard>

          <GlassCard delay={0.3} className="!p-4">
            <p className="text-[10px] text-white/30 tracking-[0.15em] uppercase mb-3">Status Breakdown</p>
            <div className="space-y-2.5">
              {[
                { label: 'Approved', count: approved, color: 'emerald' },
                { label: 'Pending', count: pending, color: 'amber' },
                { label: 'Rejected', count: rejected, color: 'red' },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-white/50">{item.label}</span>
                    <span className="text-white/30">{item.count}</span>
                  </div>
                  <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${visitors.length > 0 ? (item.count / visitors.length) * 100 : 0}%` }}
                      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                      className={`h-full rounded-full bg-${item.color}-400/60`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* ── Live Feed Table ────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
          <GlassCard hoverEffect={false} className="!p-0 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04] flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-white/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Visitor Feed
              </h2>
              <span className="text-[10px] text-white/20 font-mono tracking-wider">REALTIME</span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.04] hover:bg-transparent">
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase w-[80px]">ID</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Visitor</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Gender</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Host</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">ID Proof</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Purpose</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Guests</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Time</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase">Status</TableHead>
                    <TableHead className="text-[10px] text-white/25 tracking-[0.1em] uppercase text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {loading
                      ? Array(5).fill(0).map((_, i) => (
                          <TableRow key={i} className="border-white/[0.03]">
                            <TableCell colSpan={10}><Skeleton className="h-8 w-full bg-white/[0.03]" /></TableCell>
                          </TableRow>
                        ))
                      : visitors.map((v) => (
                          <motion.tr key={v.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.3 }} className="border-white/[0.03] hover:bg-white/[0.015] transition-colors border-b group">
                            <TableCell className="font-mono text-[11px] text-white/30">{v.id.split('-')[0].toUpperCase()}</TableCell>
                            <TableCell>
                              <div>
                                <p className="font-medium text-sm text-white/80">{v.visitor_name || 'N/A'}</p>
                                <p className="text-[10px] text-white/25 font-mono">{v.phone}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-white/40 text-xs">{v.gender || '—'}</TableCell>
                            <TableCell className="text-white/60 text-sm">{v.host_name}</TableCell>
                            <TableCell>
                              <div className="text-[10px]">
                                <p className="text-white/40">{v.id_proof_type || '—'}</p>
                                <p className="text-white/20 font-mono">{v.id_proof_number || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-white/35 max-w-[140px] truncate text-xs">{v.purpose}</TableCell>
                            <TableCell className="text-white/40 text-center text-xs">{v.num_visitors || 1}</TableCell>
                            <TableCell className="text-white/25 text-[11px]">{timeAgo(v.created_at)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] px-2 py-0.5 font-medium ${
                                v.status === 'APPROVED' ? 'border-emerald-400/30 text-emerald-400 bg-emerald-400/[0.06]'
                                : v.status === 'REJECTED' ? 'border-red-400/30 text-red-400 bg-red-400/[0.06]'
                                : 'border-amber-400/30 text-amber-400 bg-amber-400/[0.06]'
                              }`}>
                                {v.status === 'APPROVED' ? '● APPROVED' : v.status === 'REJECTED' ? '● DENIED' : '◌ PENDING'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              {v.status === 'PENDING' && (
                                <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                  <NeonButton glowColor="cyan" size="sm" disabled={actionLoading === v.id || lockdown}
                                    onClick={() => handleAction(v, 'APPROVE')}
                                    className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-400/20 text-xs h-7 px-3">
                                    <Check className="w-3 h-3 mr-1" /> Grant
                                  </NeonButton>
                                  <Button size="sm" variant="ghost" disabled={actionLoading === v.id}
                                    onClick={() => handleAction(v, 'REJECT')}
                                    className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10 border border-red-400/10 text-xs h-7 px-3">
                                    <X className="w-3 h-3 mr-1" /> Deny
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {!loading && visitors.length === 0 && (
              <div className="py-16 text-center text-white/20">
                <Users className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No visitor records yet</p>
                <p className="text-[10px] text-white/10 mt-1">New requests will appear here in real-time</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
