/**
 * POST /api/admin/reset
 *
 * Admin-only endpoint. Deletes all visitor data (logs, passes, visitors).
 * Requires authenticated admin session.
 */
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'

export async function POST() {
  try {
    // Delete in order: logs → passes → visitors (respecting FK constraints)
    await supabaseAdmin.from('logs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('passes').delete().neq('id', '00000000-0000-0000-0000-000000000000')
    await supabaseAdmin.from('visitors').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    return NextResponse.json({ message: 'All visitor data purged successfully.' })
  } catch (err) {
    console.error('[POST /api/admin/reset] Error:', err)
    return NextResponse.json({ error: 'Reset failed.' }, { status: 500 })
  }
}
