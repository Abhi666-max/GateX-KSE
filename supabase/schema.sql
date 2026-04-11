-- ── GATEX-KSE DATABASE SCHEMA ────────────────────────────────────────────────
-- Visitor Gate Pass Management System
-- Keystone School of Engineering, Pune
-- Built by: Abhijeet Kangane
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. CLEANUP (Run only on a fresh setup) ───────────────────────────────────
-- Uncomment these lines ONLY if you want to completely reset the schema:
-- DROP TABLE IF EXISTS public.logs CASCADE;
-- DROP TABLE IF EXISTS public.passes CASCADE;
-- DROP TABLE IF EXISTS public.visitors CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;


-- ── 2. TABLES ────────────────────────────────────────────────────────────────

-- Users table: extends Supabase Auth (auth.users)
-- Roles are UPPERCASE: 'ADMIN', 'SECURITY', 'VISITOR'
CREATE TABLE IF NOT EXISTS public.users (
  id        UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  email     TEXT UNIQUE,
  full_name TEXT,
  role      TEXT NOT NULL DEFAULT 'VISITOR'
              CHECK (role IN ('ADMIN', 'SECURITY', 'VISITOR')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Visitors table: stores visitor entry requests
CREATE TABLE IF NOT EXISTS public.visitors (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.users(id),
  visitor_name   TEXT NOT NULL,
  phone          TEXT,
  purpose        TEXT,
  host_name      TEXT,
  gender         TEXT,
  id_proof_type  TEXT,
  id_proof_number TEXT,
  num_visitors   INTEGER DEFAULT 1,
  status         TEXT NOT NULL DEFAULT 'PENDING'
                   CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Passes table: stores cryptographic QR pass records
CREATE TABLE IF NOT EXISTS public.passes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id    UUID REFERENCES public.visitors(id) ON DELETE CASCADE,
  qr_code_hash  TEXT UNIQUE NOT NULL,
  valid_from    TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until   TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active     BOOLEAN DEFAULT true,
  checked_in_at  TIMESTAMP WITH TIME ZONE,
  checked_out_at TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Logs table: audit trail of all gate scans
CREATE TABLE IF NOT EXISTS public.logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pass_id     UUID REFERENCES public.passes(id) ON DELETE CASCADE,
  scanned_by  UUID REFERENCES public.users(id),
  gate        TEXT,
  action      TEXT CHECK (action IN ('ENTRY', 'EXIT')),
  timestamp   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);


-- ── 3. ROW LEVEL SECURITY (RLS) ──────────────────────────────────────────────

ALTER TABLE public.users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs     ENABLE ROW LEVEL SECURITY;

-- ── users policies ───────────────────────────────────────────────────────────

-- Any authenticated user can read their own profile row.
-- CRITICAL: This allows the login page to fetch user.role after signIn.
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Admins can read all user profiles (for user management).
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'ADMIN'
    )
  );

-- ── visitors policies ─────────────────────────────────────────────────────────

-- Anyone (including unauthenticated / public) can submit a visitor request.
CREATE POLICY "Public can submit visitor request"
  ON public.visitors FOR INSERT
  TO anon
  WITH CHECK (true);

-- Any authenticated user (admin/security) can view all visitor records.
CREATE POLICY "Authenticated can view all visitors"
  ON public.visitors FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update visitor status (APPROVE/REJECT is done server-side).
CREATE POLICY "Admin can update visitors"
  ON public.visitors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- Only admins can delete visitor records (reset).
CREATE POLICY "Admin can delete visitors"
  ON public.visitors FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'ADMIN')
  );

-- ── passes policies ──────────────────────────────────────────────────────────

-- Public QR lookup (visitor status page uses anon key to fetch pass info).
CREATE POLICY "Public can lookup passes by QR hash"
  ON public.passes FOR SELECT
  TO anon
  USING (true);

-- Authenticated users (security/admin) can read and manage passes.
CREATE POLICY "Authenticated can manage passes"
  ON public.passes FOR ALL
  TO authenticated
  USING (true);

-- ── logs policies ────────────────────────────────────────────────────────────

-- Authenticated users can view scan logs.
CREATE POLICY "Authenticated can view logs"
  ON public.logs FOR SELECT
  TO authenticated
  USING (true);

-- Security/admin can insert scan log entries.
CREATE POLICY "Security can insert logs"
  ON public.logs FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- ── 4. TRIGGERS & FUNCTIONS ──────────────────────────────────────────────────

-- Auto-creates a row in public.users when a new Supabase Auth user signs up.
-- Role defaults to 'VISITOR'. Promote via SQL manually (see section 5).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    COALESCE(UPPER(new.raw_user_meta_data->>'role'), 'VISITOR')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;

-- Trigger: fires after every new auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 5. INITIAL SETUP: PROMOTE USERS TO ADMIN / SECURITY ─────────────────────
--
-- After creating users via Supabase Auth Dashboard or API,
-- run the appropriate UPDATE to set their role:
--
--   UPDATE public.users SET role = 'ADMIN'    WHERE email = 'your-admin@email.com';
--   UPDATE public.users SET role = 'SECURITY' WHERE email = 'your-security@email.com';
--
-- Roles MUST be uppercase: 'ADMIN', 'SECURITY', or 'VISITOR'
-- ─────────────────────────────────────────────────────────────────────────────
