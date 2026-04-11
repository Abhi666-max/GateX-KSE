/**
 * GateX-KSE Database TypeScript Types
 * Mirrors the public schema exactly. Keep in sync with Supabase migrations.
 */

export type UserRole = 'ADMIN' | 'SECURITY' | 'VISITOR'
export type VisitorStatus = 'PENDING' | 'APPROVED' | 'REJECTED'
export type ActionType = 'ENTRY' | 'EXIT'
export type GenderType = 'Male' | 'Female' | 'Other'
export type IdProofType = 'Aadhar' | 'PAN' | 'Driving License' | 'Passport' | 'College ID' | 'Other'

export interface DbUser {
  id: string
  email: string | null
  full_name: string | null
  role: UserRole
  created_at: string
}

export interface DbVisitor {
  id: string
  user_id: string | null
  visitor_name: string
  phone: string | null
  purpose: string | null
  host_name: string | null
  gender: GenderType
  id_proof_type: IdProofType
  id_proof_number: string
  email: string | null
  num_visitors: number
  status: VisitorStatus
  created_at: string
}

export interface DbPass {
  id: string
  visitor_id: string
  qr_code_hash: string
  valid_from: string
  valid_until: string
  is_active: boolean
  checked_in_at: string | null
  checked_out_at: string | null
  created_at: string
}

export interface DbLog {
  id: string
  pass_id: string
  scanned_by: string | null
  action: ActionType
  timestamp: string
}

/** Joined shape returned by the security scan endpoint */
export interface PassWithVisitor extends DbPass {
  visitors: DbVisitor
}
