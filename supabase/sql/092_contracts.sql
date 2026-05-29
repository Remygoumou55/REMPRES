-- 092 — Add contract columns to employees
-- Only adds columns that don't exist yet

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS trial_period_months INTEGER DEFAULT 3,
  ADD COLUMN IF NOT EXISTS work_hours_per_week INTEGER DEFAULT 40,
  ADD COLUMN IF NOT EXISTS work_location TEXT DEFAULT 'Conakry';
