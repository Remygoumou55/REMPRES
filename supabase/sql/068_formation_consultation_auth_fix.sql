-- Correctif RLS / permissions Formation + Consultation
-- À exécuter si 006/007 ont échoué (FK app_roles ou current_user_has_role manquant).
-- Idempotent : peut être relancé après mise à jour de 006 et 007.

DROP FUNCTION IF EXISTS public.current_user_has_role(text);

-- ─── Formation
CREATE OR REPLACE FUNCTION public.is_formation_operator()
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
      AND upper(coalesce(p.department_key, '')) = 'FORMATION'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_formation()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_super_admin()
    OR public.is_formation_operator()
    OR public.user_has_module_permission('formation', 'create')
    OR public.user_has_module_permission('formation', 'update')
    OR public.user_has_module_permission('formation', 'delete');
$$;

GRANT EXECUTE ON FUNCTION public.is_formation_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_formation() TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.trainings') IS NOT NULL THEN
    DROP POLICY IF EXISTS "formation_write" ON public.trainings;
    CREATE POLICY "formation_write" ON public.trainings
      FOR ALL USING (public.can_write_formation());
  END IF;
  IF to_regclass('public.training_sessions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "training_sessions_write" ON public.training_sessions;
    CREATE POLICY "training_sessions_write" ON public.training_sessions
      FOR ALL USING (public.can_write_formation());
  END IF;
  IF to_regclass('public.trainees') IS NOT NULL THEN
    DROP POLICY IF EXISTS "trainees_write" ON public.trainees;
    CREATE POLICY "trainees_write" ON public.trainees
      FOR ALL USING (public.can_write_formation());
  END IF;
  IF to_regclass('public.enrollments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "enrollments_write" ON public.enrollments;
    CREATE POLICY "enrollments_write" ON public.enrollments
      FOR ALL USING (public.can_write_formation());
  END IF;
  IF to_regclass('public.certificates') IS NOT NULL THEN
    DROP POLICY IF EXISTS "certificates_write" ON public.certificates;
    CREATE POLICY "certificates_write" ON public.certificates
      FOR ALL USING (public.can_write_formation());
  END IF;
  IF to_regclass('public.attendance_formation') IS NOT NULL THEN
    DROP POLICY IF EXISTS "attendance_formation_write" ON public.attendance_formation;
    CREATE POLICY "attendance_formation_write" ON public.attendance_formation
      FOR ALL USING (public.can_write_formation());
  END IF;
END $$;

INSERT INTO public.permissions (
  role_key, module_key, can_read, can_create, can_update, can_delete, deleted_at
)
VALUES
  ('super_admin', 'formation', true, true, true, true, null),
  ('manager', 'formation', true, true, true, true, null),
  ('agent', 'formation', true, false, false, false, null),
  ('accountant', 'formation', true, false, false, false, null),
  ('auditor', 'formation', true, false, false, false, null)
ON CONFLICT (role_key, module_key) DO UPDATE SET
  can_read = EXCLUDED.can_read,
  can_create = EXCLUDED.can_create,
  can_update = EXCLUDED.can_update,
  can_delete = EXCLUDED.can_delete,
  deleted_at = null,
  updated_at = NOW();

-- ─── Consultation
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

GRANT EXECUTE ON FUNCTION public.is_consultation_operator() TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_write_consultation() TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.missions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "missions_write" ON public.missions;
    CREATE POLICY "missions_write" ON public.missions
      FOR ALL USING (public.can_write_consultation());
  END IF;
  IF to_regclass('public.appointments') IS NOT NULL THEN
    DROP POLICY IF EXISTS "appointments_write" ON public.appointments;
    CREATE POLICY "appointments_write" ON public.appointments
      FOR ALL USING (public.can_write_consultation());
  END IF;
  IF to_regclass('public.deliverables') IS NOT NULL THEN
    DROP POLICY IF EXISTS "deliverables_all" ON public.deliverables;
    CREATE POLICY "deliverables_all" ON public.deliverables
      FOR ALL USING (public.can_write_consultation());
  END IF;
  IF to_regclass('public.contracts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "contracts_all" ON public.contracts;
    CREATE POLICY "contracts_all" ON public.contracts
      FOR ALL USING (public.can_write_consultation());
  END IF;
  IF to_regclass('public.mission_phases') IS NOT NULL THEN
    DROP POLICY IF EXISTS "phases_all" ON public.mission_phases;
    CREATE POLICY "phases_all" ON public.mission_phases
      FOR ALL USING (public.can_write_consultation());
  END IF;
END $$;

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
