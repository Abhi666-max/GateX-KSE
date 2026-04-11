/**
 * POST /api/security/scan
 *
 * Security-only endpoint protected by middleware.
 * Validates a scanned QR code and logs an entry or exit event.
 *
 * Security guarantees:
 * - Pass must exist in DB (not guessable — SHA-256 hash)
 * - Pass must be active (is_active = true)
 * - Pass must not be expired (valid_until > now)
 * - Duplicate consecutive ENTRY or EXIT scans are blocked
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-server'
import type { ActionType } from '@/types/database'

// ─── Validation Schema ────────────────────────────────────────────────────────
const ScanSchema = z.object({
  qr_hash: z
    .string()
    .trim()
    .length(64, 'Invalid QR code format.') // SHA-256 hex = 64 chars
    .regex(/^[a-f0-9]+$/, 'Invalid QR code characters.'),
  action: z.enum(['ENTRY', 'EXIT'] as const, {
    message: 'action must be ENTRY or EXIT.',
  }),
})

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Parse + validate body
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    const parsed = ScanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { qr_hash, action } = parsed.data

    // 1. Look up the pass — must match exact SHA-256 hash
    const { data: pass, error: passErr } = await supabaseAdmin
      .from('passes')
      .select('id, visitor_id, is_active, valid_from, valid_until, visitors(id, host_name, phone, purpose, status)')
      .eq('qr_code_hash', qr_hash)
      .single()

    if (passErr || !pass) {
      // Generic error — don't reveal why it failed to the scanner
      return NextResponse.json(
        { valid: false, reason: 'INVALID_PASS', message: 'QR code not recognized.' },
        { status: 404 }
      )
    }

    // 2. Check pass is active
    if (!pass.is_active) {
      return NextResponse.json(
        { valid: false, reason: 'PASS_DEACTIVATED', message: 'This pass has been deactivated.' },
        { status: 403 }
      )
    }

    // 3. Check pass is not expired
    const now = new Date()
    if (new Date(pass.valid_until) < now) {
      // Auto-deactivate expired pass
      await supabaseAdmin.from('passes').update({ is_active: false }).eq('id', pass.id)
      return NextResponse.json(
        { valid: false, reason: 'PASS_EXPIRED', message: 'This pass has expired.' },
        { status: 403 }
      )
    }

    // 4. Check for duplicate consecutive action (prevent double ENTRY / EXIT scans)
    const { data: lastLog } = await supabaseAdmin
      .from('logs')
      .select('action')
      .eq('pass_id', pass.id)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()

    if (lastLog && lastLog.action === action) {
      return NextResponse.json(
        {
          valid: false,
          reason: 'DUPLICATE_SCAN',
          message: `${action} already recorded for this pass. Scan not logged.`,
        },
        { status: 409 }
      )
    }

    // 5. Write immutable log entry
    const { error: logErr } = await supabaseAdmin.from('logs').insert([
      {
        pass_id: pass.id,
        action: action as ActionType,
        // scanned_by: can be set from session if security is authenticated
      },
    ])

    if (logErr) {
      console.error('[POST /api/security/scan] Log insert error:', logErr.message)
      return NextResponse.json({ error: 'Failed to record scan.' }, { status: 500 })
    }

    // 6. If this is an EXIT scan and no more active entries expected, deactivate pass
    // (Optional strict mode: deactivate pass after first EXIT)
    // Uncomment to enable one-time exit pass enforcement:
    // if (action === 'EXIT') {
    //   await supabaseAdmin.from('passes').update({ is_active: false }).eq('id', pass.id)
    // }

    return NextResponse.json(
      {
        valid: true,
        action,
        pass: {
          id: pass.id,
          valid_until: pass.valid_until,
        },
        visitor: pass.visitors,
        message: `${action} recorded successfully.`,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[POST /api/security/scan] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 })
}
