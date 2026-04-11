/**
 * POST /api/visitors
 *
 * Public endpoint — no auth required.
 * Creates a new visitor request with Zod validation.
 * Uses service-role Supabase client for reliable inserts.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Validation Schema ────────────────────────────────────────────────────────
const CreateVisitorSchema = z.object({
  visitor_name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long'),
  phone: z
    .string()
    .trim()
    .min(7, 'Phone number too short')
    .max(20, 'Phone number too long')
    .regex(/^[+\d\s\-()]+$/, 'Invalid phone number format'),
  gender: z.enum(['Male', 'Female', 'Other']),
  id_proof_type: z.enum(['Aadhar', 'PAN', 'Driving License', 'Passport', 'College ID', 'Other']),
  id_proof_number: z
    .string()
    .trim()
    .min(3, 'ID number too short')
    .max(30, 'ID number too long'),
  email: z
    .string()
    .email('Invalid email address')
    .or(z.literal(''))
    .optional()
    .default(''),
  num_visitors: z
    .number()
    .int()
    .min(1, 'At least 1 visitor')
    .max(10, 'Max 10 visitors per pass')
    .default(1),
  purpose: z
    .string()
    .trim()
    .min(5, 'Purpose must be at least 5 characters')
    .max(500, 'Purpose too long'),
  host_name: z
    .string()
    .trim()
    .min(2, 'Host name too short')
    .max(100, 'Host name too long'),
})

// ─── Rate Limiting (simple in-memory store) ───────────────────────────────────
const REQUEST_LOG = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 1000 }

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = REQUEST_LOG.get(ip)

  if (!entry || now > entry.resetAt) {
    REQUEST_LOG.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs })
    return false
  }

  if (entry.count >= RATE_LIMIT.maxRequests) return true
  entry.count++
  return false
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute and try again.' },
        { status: 429 }
      )
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = CreateVisitorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 422 }
      )
    }

    const { visitor_name, phone, gender, id_proof_type, id_proof_number, email, num_visitors, purpose, host_name } = parsed.data

    const { data: visitor, error } = await supabaseAdmin
      .from('visitors')
      .insert([{
        visitor_name,
        phone,
        gender,
        id_proof_type,
        id_proof_number,
        email: email || null,
        num_visitors,
        purpose,
        host_name,
        status: 'PENDING',
      }])
      .select('id, status, created_at')
      .single()

    if (error) {
      console.error('[POST /api/visitors] DB error:', error.message)
      return NextResponse.json(
        { error: 'Failed to create visitor request.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Visitor request submitted successfully.', visitor },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/visitors] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
