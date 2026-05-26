-- 078 — Payslips (bulletins de paie)
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.payslips (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id      UUID NOT NULL
                     REFERENCES public.employees(id)
                     ON DELETE CASCADE,
  month            INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year             INTEGER NOT NULL CHECK (year >= 2020),
  salary_gnf       NUMERIC(18,2) NOT NULL DEFAULT 0,
  bonus_gnf        NUMERIC(18,2) NOT NULL DEFAULT 0,
  deductions_gnf   NUMERIC(18,2) NOT NULL DEFAULT 0,
  net_salary_gnf   NUMERIC(18,2)
                     GENERATED ALWAYS AS (salary_gnf + bonus_gnf - deductions_gnf) STORED,
  days_worked      INTEGER DEFAULT 0,
  days_absent      INTEGER DEFAULT 0,
  leave_days       INTEGER DEFAULT 0,
  notes            TEXT,
  generated_by     UUID REFERENCES auth.users(id),
  generated_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (employee_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_payslips_employee ON public.payslips (employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_period   ON public.payslips (year, month);

ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payslips_read" ON public.payslips;
CREATE POLICY "payslips_read"
  ON public.payslips FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "payslips_write" ON public.payslips;
CREATE POLICY "payslips_write"
  ON public.payslips FOR ALL
  USING (
    public.is_super_admin() OR
    public.user_has_module_permission('rh', 'create')
  )
  WITH CHECK (
    public.is_super_admin() OR
    public.user_has_module_permission('rh', 'create')
  );

-- ► Safe to re-run: table/indexes use IF NOT EXISTS; policies are dropped then recreated.
