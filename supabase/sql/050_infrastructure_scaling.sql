-- 050_infrastructure_scaling.sql
-- Infrastructure scaling enterprise : file d’attente jobs orchestrables (analytics, exports, dispatch métier),
-- sans refactor auth/query/realtime — traitement via route interne + service role.

begin;

-- ─── File d’attente globale (unifiée pour tous les domaines ERP)
create table if not exists public.erp_infrastructure_jobs (
  id uuid primary key default gen_random_uuid(),
  queue_key text not null,
  domain_key text not null,
  job_type text not null,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text null,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  priority int not null default 0,
  run_after timestamptz not null default now(),
  attempts int not null default 0 check (attempts >= 0),
  max_attempts int not null default 5 check (max_attempts >= 1),
  last_error text null,
  locked_at timestamptz null,
  locked_by text null,
  completed_at timestamptz null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint erp_infra_jobs_queue_chk check (length(trim(queue_key)) > 0),
  constraint erp_infra_jobs_domain_chk check (length(trim(domain_key)) > 0),
  constraint erp_infra_jobs_type_chk check (length(trim(job_type)) > 0)
);

drop trigger if exists trg_erp_infrastructure_jobs_updated_at on public.erp_infrastructure_jobs;
create trigger trg_erp_infrastructure_jobs_updated_at
before update on public.erp_infrastructure_jobs
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_erp_infrastructure_jobs_idempotency
  on public.erp_infrastructure_jobs (idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_erp_infra_jobs_pending_dispatch
  on public.erp_infrastructure_jobs (status, run_after, priority desc, created_at asc);

create index if not exists idx_erp_infra_jobs_domain_created
  on public.erp_infrastructure_jobs (domain_key, created_at desc);

comment on table public.erp_infrastructure_jobs is
  'File d’attente orchestration ERP (analytics, exports, syncs) — traitement via worker interne service_role.';

-- ─── Claim atomique (SKIP LOCKED) — réservé au service_role côté API interne
create or replace function public.claim_infrastructure_jobs(p_batch_limit int default 10)
returns setof public.erp_infrastructure_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit int := greatest(1, least(coalesce(p_batch_limit, 10), 50));
begin
  return query
  with picked as (
    select id
    from public.erp_infrastructure_jobs
    where status = 'pending'
      and run_after <= now()
      and attempts < max_attempts
    order by priority desc, created_at asc
    limit v_limit
    for update skip locked
  )
  update public.erp_infrastructure_jobs j
  set
    status = 'processing',
    locked_at = now(),
    locked_by = 'internal_worker_v1',
    attempts = j.attempts + 1,
    updated_at = now()
  from picked p
  where j.id = p.id
  returning j.*;
end;
$$;

revoke all on function public.claim_infrastructure_jobs(int) from public;
grant execute on function public.claim_infrastructure_jobs(int) to service_role;

-- ─── RLS : enqueue utilisateur authentifié ; lecture propres lignes ; worker hors RLS (service_role)
alter table public.erp_infrastructure_jobs enable row level security;

drop policy if exists erp_infra_jobs_select_own on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_select_own on public.erp_infrastructure_jobs for select to authenticated
using (
  created_by = auth.uid()
  or public.is_super_admin()
);

drop policy if exists erp_infra_jobs_insert_self on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_insert_self on public.erp_infrastructure_jobs for insert to authenticated
with check (
  created_by = auth.uid()
);

drop policy if exists erp_infra_jobs_no_direct_mutate on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_no_direct_mutate on public.erp_infrastructure_jobs for update to authenticated
using (false);

drop policy if exists erp_infra_jobs_no_delete on public.erp_infrastructure_jobs;
create policy erp_infra_jobs_no_delete on public.erp_infrastructure_jobs for delete to authenticated
using (false);

commit;
