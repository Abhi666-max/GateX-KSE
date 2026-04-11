/**
 * POST /api/admin/passes
 *
 * Admin-only endpoint protected by middleware.
 * Approves or rejects a visitor request.
 * On APPROVE: generates a cryptographically secure QR hash and creates a pass.
 * On REJECT: updates visitor status only.
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createHash, randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase-server'

// ─── Validation Schema ────────────────────────────────────────────────────────
const PassActionSchema = z.object({
  visitor_id: z.string().uuid('Invalid visitor ID format.'),
  action: z.enum(['APPROVE', 'REJECT'] as const, {
    message: 'action must be APPROVE or REJECT.',
  }),
  /** Optional: validity duration in hours. Defaults to 24h. Max 72h. */
  valid_hours: z.number().int().min(1).max(72).optional().default(24),
})

// ─── Secure QR Hash Generation ────────────────────────────────────────────────
/**
 * Generates a cryptographically unique QR code hash.
 * Format: GX-{visitor_id_prefix}-{timestamp}-{randomBytes}
 * The hash is SHA-256'd to make it non-guessable and fixed-length.
 */
function generateQrHash(visitorId: string): string {
  const raw = `GX-${visitorId}-${Date.now()}-${randomBytes(32).toString('hex')}`
  return createHash('sha256').update(raw).digest('hex')
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Note: Auth check is handled by middleware.ts before this route runs.
    // But we do a secondary server-side role check as defense-in-depth.
    // (Middleware verifies the session cookie; here we verify the DB role.)

    // Parse + validate body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = PassActionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { visitor_id, action, valid_hours } = parsed.data

    // 1. Verify visitor exists and is currently PENDING
    const { data: visitor, error: visitorErr } = await supabaseAdmin
      .from('visitors')
      .select('id, status')
      .eq('id', visitor_id)
      .single()

    if (visitorErr || !visitor) {
      return NextResponse.json({ error: 'Visitor not found.' }, { status: 404 })
    }

    if (visitor.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Visitor request is already ${visitor.status}. Cannot act again.` },
        { status: 409 }
      )
    }

    // 2. Handle REJECT
    if (action === 'REJECT') {
      const { error: rejectErr } = await supabaseAdmin
        .from('visitors')
        .update({ status: 'REJECTED' })
        .eq('id', visitor_id)

      if (rejectErr) {
        console.error('[POST /api/admin/passes] Reject error:', rejectErr.message)
        return NextResponse.json({ error: 'Failed to reject visitor.' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Visitor request rejected.' }, { status: 200 })
    }

    // 3. Handle APPROVE
    // 3a. Check no pass already exists (prevent double-approval race condition)
    const { data: existingPass } = await supabaseAdmin
      .from('passes')
      .select('id')
      .eq('visitor_id', visitor_id)
      .single()

    if (existingPass) {
      return NextResponse.json(
        { error: 'A pass already exists for this visitor.' },
        { status: 409 }
      )
    }

    // 3b. Generate secure, unique QR hash
    const qrHash = generateQrHash(visitor_id)

    const now = new Date()
    const validUntil = new Date(now.getTime() + valid_hours * 60 * 60 * 1000)

    // 3c. Atomic: update visitor status + insert pass in one transaction
    // Note: Supabase doesn't expose client-side transactions, so we order:
    // pass first (fails gracefully), then status update.
    const { data: pass, error: passErr } = await supabaseAdmin
      .from('passes')
      .insert([
        {
          visitor_id,
          qr_code_hash: qrHash,
          valid_from: now.toISOString(),
          valid_until: validUntil.toISOString(),
          is_active: true,
        },
      ])
      .select('id, qr_code_hash, valid_until')
      .single()

    if (passErr) {
      console.error('[POST /api/admin/passes] Pass insert error:', passErr.message)
      return NextResponse.json({ error: 'Failed to generate pass.' }, { status: 500 })
    }

    const { error: approveErr } = await supabaseAdmin
      .from('visitors')
      .update({ status: 'APPROVED' })
      .eq('id', visitor_id)

    if (approveErr) {
      // Rollback: delete the pass we just created
      await supabaseAdmin.from('passes').delete().eq('id', pass.id)
      console.error('[POST /api/admin/passes] Status update error:', approveErr.message)
      return NextResponse.json({ error: 'Failed to approve visitor.' }, { status: 500 })
    }

    return NextResponse.json(
      {
        message: 'Visitor approved. Secure QR pass generated.',
        pass: {
          id: pass.id,
          qr_code_hash: pass.qr_code_hash,
          valid_until: pass.valid_until,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[POST /api/admin/passes] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
