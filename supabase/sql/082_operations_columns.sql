-- 082 — Colonnes complémentaires Operations (idempotent)
-- Run in Supabase SQL Editor.

-- Soft delete + champs projet (schéma 064 — colonnes absentes uniquement)
ALTER TABLE public.erp_ops_tasks
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE public.erp_ops_projects
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS budget_gnf NUMERIC(18, 2);

CREATE INDEX IF NOT EXISTS idx_ops_tasks_deleted
  ON public.erp_ops_tasks(deleted_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ops_tasks_priority
  ON public.erp_ops_tasks(priority)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ops_projects_deleted
  ON public.erp_ops_projects(deleted_at)
  WHERE deleted_at IS NULL;
