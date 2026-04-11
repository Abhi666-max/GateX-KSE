'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from '@/components/stitch/GlassCard'
import { NeonButton } from '@/components/stitch/NeonButton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Send, Building2, Shield, User, Phone, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const GENDERS = ['Male', 'Female', 'Other'] as const
const ID_TYPES = ['Aadhar', 'PAN', 'Driving License', 'Passport', 'College ID', 'Other'] as const

const selectClass = 'w-full h-11 text-sm rounded-md px-3 bg-white/[0.04] border border-white/[0.08] text-white focus:border-primary/40 focus:outline-none transition-colors appearance-none cursor-pointer [&>option]:bg-[#0b0f1a] [&>option]:text-white'

export default function VisitorRequest() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    visitor_name: '',
    phone: '',
    gender: 'Male' as string,
    id_proof_type: 'Aadhar' as string,
    id_proof_number: '',
    email: '',
    num_visitors: 1,
    host_name: '',
    purpose: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: name === 'num_visitors' ? Math.max(1, Math.min(10, parseInt(value) || 1)) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/visitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          const firstError = Object.values(data.details as Record<string, string[]>).flat()[0]
          toast.error('Validation Error', { description: firstError })
        } else {
          toast.error('Submission Failed', { description: data.error ?? 'Please try again.' })
        }
        return
      }

      toast.success('Request Submitted', {
        description: 'Your visitor pass request is pending host approval.',
      })
      router.push(`/visitor/status/${data.visitor.id}`)
    } catch {
      toast.error('Network Error', { description: 'Could not reach the server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden gradient-mesh">
      <div className="absolute top-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40vw] h-[40vw] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <Link href="/" className="text-white/30 hover:text-white/60 flex items-center gap-2 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs">Portal</span>
        </Link>
        <div className="flex items-center gap-2 text-white/20">
          <Shield className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-[0.15em] uppercase">Secure Form</span>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10 mt-12"
      >
        <GlassCard className="w-full" delay={0}>
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-[10px] text-primary/50 tracking-[0.15em] uppercase font-medium">Keystone School of Engineering</p>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white/90">
              Request Entry Pass
            </h1>
            <p className="text-white/35 text-sm mt-1.5">
              Submit your details. Your host will be notified for approval.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Visitor Identity ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="visitor_name" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-1">
                  <User className="w-3 h-3" /> Full Name
                </Label>
                <Input id="visitor_name" name="visitor_name" placeholder="Your full name" value={form.visitor_name} onChange={handleChange} required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">Gender</Label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange} className={selectClass}>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3" /> Phone
                </Label>
                <Input id="phone" name="phone" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
              </div>
            </div>

            {/* ── ID Proof ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="id_proof_type" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> ID Proof
                </Label>
                <select id="id_proof_type" name="id_proof_type" value={form.id_proof_type} onChange={handleChange} className={selectClass}>
                  {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="id_proof_number" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">ID Number</Label>
                <Input id="id_proof_number" name="id_proof_number" placeholder="XXXX-XXXX-XXXX" value={form.id_proof_number} onChange={handleChange} required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
              </div>
            </div>

            {/* ── Visit Details ── */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="host_name" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">Host Name</Label>
                <Input id="host_name" name="host_name" placeholder="Person you're visiting" value={form.host_name} onChange={handleChange} required
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="num_visitors" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">No. of Visitors</Label>
                <Input id="num_visitors" name="num_visitors" type="number" min={1} max={10} value={form.num_visitors} onChange={handleChange}
                  className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">Email (Optional)</Label>
              <Input id="email" name="email" type="email" placeholder="visitor@email.com" value={form.email} onChange={handleChange}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 h-11 text-sm" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="purpose" className="text-white/40 text-[10px] uppercase tracking-[0.15em] font-medium">Purpose of Visit</Label>
              <Textarea id="purpose" name="purpose" placeholder="Briefly describe the reason for your visit..." value={form.purpose} onChange={handleChange} required rows={2}
                className="bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus:border-primary/40 resize-none text-sm" />
            </div>

            <NeonButton type="submit" disabled={loading} glowColor="cyan"
              className="w-full h-11 bg-primary/[0.08] hover:bg-primary/15 text-primary border border-primary/20 mt-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-3.5 h-3.5 mr-2" />}
              {loading ? 'Processing...' : 'Submit Request'}
            </NeonButton>
          </form>
        </GlassCard>
      </motion.div>
    </div>
  )
}
