-- ═══════════════════════════════════════════
-- CONSULTATION MODULE — 5 tables
-- Prérequis : 002_clients_schema, 035_authorization_generic_roles_departments
-- ═══════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.is_consultation_operator()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.deleted_at IS NULL
      AND upper(coalesce(p.department_key, '')) = 'CONSULTATION'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_consultation_operator() TO authenticated;

CREATE OR REPLACE FUNCTION public.can_write_consultation()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.is_consultation_operator()
    OR public.user_has_module_permission('consultation', 'create')
    OR public.user_has_module_permission('consultation', 'update')
    OR public.user_has_module_permission('consultation', 'delete');
$$;

GRANT EXECUTE ON FUNCTION public.can_write_consultation() TO authenticated;

CREATE SEQUENCE IF NOT EXISTS mission_seq START 1000;
CREATE SEQUENCE IF NOT EXISTS contract_seq START 1000;

CREATE TABLE IF NOT EXISTS missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference TEXT UNIQUE NOT NULL
    DEFAULT 'MSN-' || TO_CHAR(NOW(),'YYYY') || '-'
    || LPAD(NEXTVAL('mission_seq')::TEXT, 4, '0'),
  title TEXT NOT NULL,
  description TEXT,
  client_id UUID REFERENCES clients(id),
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','on_hold',
                      'completed','cancelled')),
  start_date DATE,
  end_date DATE,
  budget_gnf NUMERIC(18,2) DEFAULT 0,
  amount_invoiced_gnf NUMERIC(18,2) DEFAULT 0,
  amount_paid_gnf NUMERIC(18,2) DEFAULT 0,
  lead_consultant TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mission_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress',
                      'completed','cancelled')),
  start_date DATE,
  end_date DATE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES missions(id),
  phase_id UUID REFERENCES mission_phases(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress',
                      'submitted','approved','rejected')),
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id),
  title TEXT NOT NULL,
  description TEXT,
  appointment_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location TEXT,
  client_name TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled','completed',
                      'cancelled','rescheduled')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id),
  contract_number TEXT UNIQUE NOT NULL
    DEFAULT 'CTR-' || TO_CHAR(NOW(),'YYYY') || '-'
    || LPAD(NEXTVAL('contract_seq')::TEXT, 4, '0'),
  title TEXT NOT NULL,
  client_name TEXT,
  contract_date DATE,
  start_date DATE,
  end_date DATE,
  total_amount_gnf NUMERIC(18,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','signed','active',
                      'completed','terminated')),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

DROP TRIGGER IF EXISTS trg_missions_updated_at ON missions;
CREATE TRIGGER trg_missions_updated_at
  BEFORE UPDATE ON missions FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_mission_phases_updated_at ON mission_phases;
CREATE TRIGGER trg_mission_phases_updated_at
  BEFORE UPDATE ON mission_phases FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_deliverables_updated_at ON deliverables;
CREATE TRIGGER trg_deliverables_updated_at
  BEFORE UPDATE ON deliverables FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_appointments_updated_at ON appointments;
CREATE TRIGGER trg_appointments_updated_at
  BEFORE UPDATE ON appointments FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_missions_status
  ON missions(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_appointments_date
  ON appointments(appointment_date)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_deliverables_mission
  ON deliverables(mission_id) WHERE deleted_at IS NULL;

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mission_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliverables ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "missions_read" ON missions;
CREATE POLICY "missions_read" ON missions
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "missions_write" ON missions;
CREATE POLICY "missions_write" ON missions
  FOR ALL USING (public.can_write_consultation());

DROP POLICY IF EXISTS "appointments_read" ON appointments;
CREATE POLICY "appointments_read" ON appointments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "appointments_write" ON appointments;
CREATE POLICY "appointments_write" ON appointments
  FOR ALL USING (public.can_write_consultation());

DROP POLICY IF EXISTS "deliverables_all" ON deliverables;
CREATE POLICY "deliverables_all" ON deliverables
  FOR ALL USING (public.can_write_consultation());

DROP POLICY IF EXISTS "contracts_all" ON contracts;
CREATE POLICY "contracts_all" ON contracts
  FOR ALL USING (public.can_write_consultation());

DROP POLICY IF EXISTS "phases_all" ON mission_phases;
CREATE POLICY "phases_all" ON mission_phases
  FOR ALL USING (public.can_write_consultation());

INSERT INTO public.permissions (
  role_key, module_key, can_read, can_create, can_update, can_delete, deleted_at
)
VALUES
  ('super_admin', 'consultation', true, true, true, true, null),
  ('manager', 'consultation', true, true, true, true, null),
  ('agent', 'consultation', true, false, false, false, null),
  ('accountant', 'consultation', true, false, false, false, null),
  ('auditor', 'consultation', true, false, false, false, null)
ON CONFLICT (role_key, module_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  deleted_at = null,
  updated_at = NOW();
