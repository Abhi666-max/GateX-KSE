'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Scanner } from '@yudiel/react-qr-scanner'
import {
  ArrowLeft, CheckCircle2, ScanLine, XCircle, Loader2,
  AlertTriangle, Building2, Clock, Radio
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { DbVisitor } from '@/types/database'

// ─── Types ──────────────────────────────────────────────
type ScanState = 'IDLE' | 'PROCESSING' | 'VALID' | 'INVALID' | 'DUPLICATE' | 'EXPIRED'

interface ScanResult {
  state: ScanState
  visitor?: DbVisitor
  passId?: string
  reason?: string
  message?: string
}

interface ScanHistoryEntry {
  time: string
  host: string
  state: ScanState
  id: string
}

const RESET_DELAY: Record<ScanState, number> = {
  IDLE: 0, PROCESSING: 0, VALID: 3000, INVALID: 2500, DUPLICATE: 2500, EXPIRED: 2500,
}

const GATES = ['Gate A — Main Entrance', 'Gate B — Side Wing'] as const

export default function SecurityScanner() {
  const [scan, setScan] = useState<ScanResult>({ state: 'IDLE' })
  const [selectedGate, setSelectedGate] = useState(0)
  const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([])
  const [scanCount, setScanCount] = useState(0)
  const lastScanned = useRef<string | null>(null)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleTimeString('en-IN', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([80, 40, 80])
  }

  const resetToIdle = useCallback(() => {
    lastScanned.current = null
    setScan({ state: 'IDLE' })
  }, [])

  const handleScan = useCallback(
    async (result: { rawValue: string }[]) => {
      if (!result?.[0]) return
      const qrHash = result[0].rawValue
      if (qrHash === lastScanned.current || scan.state !== 'IDLE') return
      lastScanned.current = qrHash

      setScan({ state: 'PROCESSING' })
      triggerHaptic()

      try {
        const res = await fetch('/api/security/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qr_hash: qrHash, action: 'ENTRY', gate: GATES[selectedGate] }),
        })

        const data = await res.json()
        let nextState: ScanState

        if (res.ok && data.valid) {
          nextState = 'VALID'
          setScan({ state: nextState, visitor: data.visitor as DbVisitor, passId: data.pass?.id })
          setScanHistory(prev => [{
            time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            host: (data.visitor as DbVisitor)?.host_name || 'Unknown',
            state: 'VALID' as ScanState,
            id: (data.pass?.id as string)?.split('-')[0]?.toUpperCase() || '',
          }, ...prev].slice(0, 10))
        } else {
          const reason = data.reason as string | undefined
          if (reason === 'DUPLICATE_SCAN') nextState = 'DUPLICATE'
          else if (reason === 'PASS_EXPIRED') nextState = 'EXPIRED'
          else nextState = 'INVALID'
          setScan({ state: nextState, reason: data.reason, message: data.message })
          setScanHistory(prev => [{
            time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
            host: data.message || 'Unknown',
            state: nextState as ScanState,
            id: '',
          }, ...prev].slice(0, 10))
        }

        setScanCount(c => c + 1)
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(resetToIdle, RESET_DELAY[nextState])
      } catch {
        setScan({ state: 'INVALID', message: 'Network error. Check connection.' })
        if (resetTimer.current) clearTimeout(resetTimer.current)
        resetTimer.current = setTimeout(resetToIdle, 2500)
      }
    },
    [scan.state, resetToIdle, selectedGate]
  )

  const borderColor =
    scan.state === 'VALID' ? 'border-emerald-500/40' :
    scan.state === 'INVALID' || scan.state === 'EXPIRED' || scan.state === 'DUPLICATE' ? 'border-red-500/40' :
    'border-transparent'

  return (
    <div className={`fixed inset-0 bg-black flex flex-col overflow-hidden touch-none select-none transition-colors duration-500 border-4 ${borderColor}`}>
      {/* Camera feed */}
      <div className="absolute inset-0 z-0">
        {scan.state === 'IDLE' && (
          <Scanner
            onScan={handleScan}
            components={{ finder: false }}
            styles={{ container: { width: '100%', height: '100%' } }}
          />
        )}
      </div>

      {/* Dim when not idle */}
      {scan.state !== 'IDLE' && (
        <div className="absolute inset-0 z-10 bg-black/70 backdrop-blur-sm" />
      )}

      {/* ── HUD Top Bar ──────────────────────────────── */}
      <div className="relative z-50 flex items-center justify-between px-4 py-3 bg-black/60 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-lg bg-white/[0.06] text-white/50 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-primary/60" />
            <div>
              <p className="text-[9px] text-primary/50 tracking-[0.15em] uppercase font-medium">Keystone Security</p>
              <p className="text-xs font-semibold text-white/80">{GATES[selectedGate]}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-white/25 tracking-wider uppercase">Clock</p>
            <p className="text-sm font-mono text-white/60">{currentTime}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-white/25 tracking-wider uppercase">Scans</p>
            <p className="text-sm font-mono text-primary">{scanCount}</p>
          </div>
        </div>
      </div>

      {/* ── Gate selector ────────────────────────────── */}
      <div className="relative z-50 flex gap-2 px-4 py-2 bg-black/40">
        {GATES.map((gate, i) => (
          <button
            key={gate}
            onClick={() => setSelectedGate(i)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
              selectedGate === i
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-white/[0.04] text-white/30 border border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {gate.split(' — ')[0]}
          </button>
        ))}
      </div>

      {/* ── Scan Reticle ─────────────────────────────── */}
      {scan.state === 'IDLE' && (
        <>
          <div className="absolute top-28 left-0 right-0 z-20 text-center pointer-events-none">
            <h1 className="text-lg font-bold text-white/80 tracking-[0.2em] flex items-center justify-center gap-2">
              <ScanLine className="text-primary w-5 h-5" /> SCAN QR PASS
            </h1>
          </div>

          <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
            <div className="w-[65vw] max-w-[320px] aspect-square relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/80 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/80 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/80 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/80 rounded-br-md" />
              <motion.div
                animate={{ y: ['0%', '100%', '0%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute top-0 left-3 right-3 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_12px_rgba(0,245,255,0.8)]"
              />
            </div>
          </div>
        </>
      )}

      {/* ── State overlays ───────────────────────────── */}
      <AnimatePresence mode="wait">
        {scan.state === 'PROCESSING' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-14 h-14 animate-spin text-primary" />
            <p className="text-primary/80 font-mono tracking-[0.3em] text-xs">VERIFYING SIGNATURE…</p>
          </motion.div>
        )}

        {scan.state === 'VALID' && (
          <motion.div
            key="valid"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute inset-0 z-40 bg-emerald-500/10 flex flex-col items-center justify-center p-8 text-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
              className="w-28 h-28 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_80px_rgba(16,185,129,0.5)]"
            >
              <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
            </motion.div>
            <div className="space-y-3">
              <p className="font-black text-4xl text-white tracking-[0.3em]">CLEAR</p>
              {scan.visitor && (
                <div className="space-y-2">
                  <p className="text-emerald-300 text-xl font-bold">{scan.visitor.visitor_name || scan.visitor.host_name}</p>
                  <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-white/50">
                    <span>{scan.visitor.gender || 'N/A'}</span>
                    <span className="text-white/15">·</span>
                    <span>{scan.visitor.id_proof_type}: {scan.visitor.id_proof_number}</span>
                    <span className="text-white/15">·</span>
                    <span>{scan.visitor.num_visitors || 1} guest{(scan.visitor.num_visitors || 1) > 1 ? 's' : ''}</span>
                  </div>
                  <p className="text-white/25 text-xs">Host: {scan.visitor.host_name}</p>
                  <p className="text-white/30 font-mono text-xs mt-1">
                    Pass: {scan.passId?.split('-')[0].toUpperCase()} · {GATES[selectedGate].split(' — ')[0]}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {(scan.state === 'INVALID' || scan.state === 'EXPIRED' || scan.state === 'DUPLICATE') && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="absolute inset-0 z-40 bg-red-600/10 flex flex-col items-center justify-center p-8 text-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 250 }}
              className="w-28 h-28 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_80px_rgba(220,38,38,0.5)]"
            >
              {scan.state === 'DUPLICATE' ? (
                <AlertTriangle className="w-14 h-14 text-white" strokeWidth={2.5} />
              ) : (
                <XCircle className="w-14 h-14 text-white" strokeWidth={2.5} />
              )}
            </motion.div>
            <div className="space-y-2">
              <p className="font-black text-3xl text-white tracking-[0.3em]">
                {scan.state === 'DUPLICATE' ? 'DUPLICATE' : scan.state === 'EXPIRED' ? 'EXPIRED' : 'DENIED'}
              </p>
              <p className="text-red-300/80 text-sm font-medium max-w-xs">
                {scan.message ?? 'This pass is not valid for entry.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom panel: scan history ────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 bg-black/70 backdrop-blur-xl border-t border-white/[0.06]">
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <Radio className={`w-3 h-3 ${scan.state === 'IDLE' ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span className="text-[10px] text-white/40 font-mono tracking-[0.15em]">
              {scan.state === 'IDLE' ? 'READY' : scan.state === 'PROCESSING' ? 'SCANNING...' : 'RESULT'}
            </span>
          </div>
          <span className="text-[10px] text-white/20 font-mono">{GATES[selectedGate].split(' — ')[0]}</span>
        </div>

        {/* History log */}
        {scanHistory.length > 0 && (
          <div className="max-h-[120px] overflow-y-auto">
            {scanHistory.map((entry, i) => (
              <motion.div
                key={`${entry.time}-${i}`}
                initial={i === 0 ? { opacity: 0, x: -10 } : false}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 px-4 py-1.5 border-b border-white/[0.03] last:border-0"
              >
                <Clock className="w-3 h-3 text-white/20 shrink-0" />
                <span className="text-[10px] font-mono text-white/25 w-14 shrink-0">{entry.time}</span>
                <span className={`text-[10px] font-medium shrink-0 w-16 ${
                  entry.state === 'VALID' ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {entry.state === 'VALID' ? '✓ CLEAR' : '✗ DENY'}
                </span>
                <span className="text-[10px] text-white/30 truncate">{entry.host}</span>
              </motion.div>
            ))}
          </div>
        )}

        {scanHistory.length === 0 && scan.state === 'IDLE' && (
          <div className="py-3 text-center">
            <p className="text-[10px] text-white/15 tracking-wider">No scans yet this session</p>
          </div>
        )}
      </div>
    </div>
  )
}
