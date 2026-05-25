-- ═══════════════════════════════════════════
-- FORMATION MODULE — 6 tables
-- Run manually in Supabase SQL Editor after core schema (001).
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.current_user_has_role(p_role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.current_user_role() = p_role;
$$;

CREATE TABLE IF NOT EXISTS trainings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_hours NUMERIC(6,1) DEFAULT 0,
  price_gnf NUMERIC(18,2) DEFAULT 0,
  max_participants INTEGER DEFAULT 20,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','completed','cancelled')),
  instructor_name TEXT,
  location TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','ongoing','completed','cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS trainees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  function TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id),
  trainee_id UUID NOT NULL REFERENCES trainees(id),
  session_id UUID REFERENCES training_sessions(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','completed',
                      'cancelled','no_show')),
  amount_paid_gnf NUMERIC(18,2) DEFAULT 0,
  payment_method TEXT
    CHECK (payment_method IN ('especes','orange_money',
                              'virement','gratuit')),
  paid_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(training_id, trainee_id)
);

CREATE TABLE IF NOT EXISTS attendance_formation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL
    REFERENCES training_sessions(id),
  trainee_id UUID NOT NULL REFERENCES trainees(id),
  status TEXT NOT NULL DEFAULT 'present'
    CHECK (status IN ('present','absent','late','excused')),
  arrival_time TIME,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, trainee_id)
);

CREATE SEQUENCE IF NOT EXISTS cert_seq START 1000;

CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id UUID NOT NULL REFERENCES trainings(id),
  trainee_id UUID NOT NULL REFERENCES trainees(id),
  enrollment_id UUID REFERENCES enrollments(id),
  certificate_number TEXT UNIQUE NOT NULL
    DEFAULT 'CERT-' || TO_CHAR(NOW(),'YYYY') || '-'
    || LPAD(NEXTVAL('cert_seq')::TEXT, 4, '0'),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  valid_until DATE,
  score NUMERIC(5,2),
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_trainings_updated_at ON trainings;
CREATE TRIGGER trg_trainings_updated_at
  BEFORE UPDATE ON trainings FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_training_sessions_updated_at ON training_sessions;
CREATE TRIGGER trg_training_sessions_updated_at
  BEFORE UPDATE ON training_sessions FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_trainees_updated_at ON trainees;
CREATE TRIGGER trg_trainees_updated_at
  BEFORE UPDATE ON trainees FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_enrollments_updated_at ON enrollments;
CREATE TRIGGER trg_enrollments_updated_at
  BEFORE UPDATE ON enrollments FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_trainings_status
  ON trainings(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_training
  ON enrollments(training_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enrollments_trainee
  ON enrollments(trainee_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_certificates_trainee
  ON certificates(trainee_id);

ALTER TABLE trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_formation ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "formation_read" ON trainings;
CREATE POLICY "formation_read" ON trainings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "formation_write" ON trainings;
CREATE POLICY "formation_write" ON trainings
  FOR ALL USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

DROP POLICY IF EXISTS "training_sessions_read" ON training_sessions;
CREATE POLICY "training_sessions_read" ON training_sessions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "training_sessions_write" ON training_sessions;
CREATE POLICY "training_sessions_write" ON training_sessions
  FOR ALL USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

DROP POLICY IF EXISTS "trainees_read" ON trainees;
CREATE POLICY "trainees_read" ON trainees
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "trainees_write" ON trainees;
CREATE POLICY "trainees_write" ON trainees
  FOR ALL USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

DROP POLICY IF EXISTS "enrollments_read" ON enrollments;
CREATE POLICY "enrollments_read" ON enrollments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "enrollments_write" ON enrollments;
CREATE POLICY "enrollments_write" ON enrollments
  FOR ALL USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

DROP POLICY IF EXISTS "certificates_read" ON certificates;
CREATE POLICY "certificates_read" ON certificates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "certificates_write" ON certificates;
CREATE POLICY "certificates_write" ON certificates
  FOR ALL USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

DROP POLICY IF EXISTS "attendance_formation_read" ON attendance_formation;
CREATE POLICY "attendance_formation_read"
  ON attendance_formation FOR SELECT USING (true);

DROP POLICY IF EXISTS "attendance_formation_write" ON attendance_formation;
CREATE POLICY "attendance_formation_write"
  ON attendance_formation FOR ALL
  USING (is_super_admin() OR
    current_user_has_role('responsable_formation'));

-- Permissions applicatives (module formation)
INSERT INTO public.permissions (role_key, module_key, can_read, can_create, can_update, can_delete)
VALUES ('responsable_formation', 'formation', true, true, true, true)
ON CONFLICT (role_key, module_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  updated_at = NOW();

INSERT INTO public.permissions (role_key, module_key, can_read, can_create, can_update, can_delete)
VALUES ('directeur_general', 'formation', true, true, true, true)
ON CONFLICT (role_key, module_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  updated_at = NOW();
