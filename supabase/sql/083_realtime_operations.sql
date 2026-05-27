-- RemPres ERP — Realtime sur les tables Operations
-- Run in Supabase SQL Editor: supabase/sql/083_realtime_operations.sql

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime
    ADD TABLE public.erp_ops_tasks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime
    ADD TABLE public.erp_ops_projects;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Presence : canal Realtime in-memory (pas de table)
