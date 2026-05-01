-- 030_performance_indexes_and_logs.sql
-- Final step: performance + observability preparation (idempotent, non-breaking).

begin;

-- ---------------------------------------------------------------------------
-- 1) Optional logs table for persisted observability (server logger sink)
-- ---------------------------------------------------------------------------
create table if not exists public.logs (
  id         uuid primary key default gen_random_uuid(),
  level      text not null check (level in ('info', 'warn', 'error')),
  module     text not null,
  message    text not null,
  metadata   jsonb not null default '{}'::jsonb,
  user_id    uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_logs_created_at_desc on public.logs(created_at desc);
create index if not exists idx_logs_level_created_at on public.logs(level, created_at desc);
create index if not exists idx_logs_module_created_at on public.logs(module, created_at desc);
create index if not exists idx_logs_user_id on public.logs(user_id);

alter table public.logs enable row level security;

drop policy if exists logs_insert_server_only on public.logs;
create policy logs_insert_server_only
on public.logs
for insert
to authenticated
with check (false);

drop policy if exists logs_select_admin_only on public.logs;
create policy logs_select_admin_only
on public.logs
for select
to authenticated
using (public.is_admin_role());

-- ---------------------------------------------------------------------------
-- 2) Performance indexes on hot paths (safe if already present)
-- ---------------------------------------------------------------------------
create index if not exists idx_sales_created_at_desc on public.sales(created_at desc);
create index if not exists idx_sales_created_by_created_at on public.sales(created_by, created_at desc);
create index if not exists idx_products_created_by on public.products(created_by);

-- Currency pair lookups (normalized in queries with upper/trim)
create index if not exists idx_currency_rates_pair_lookup
  on public.currency_rates(base_currency, quote_currency);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'currency_rates'
      and column_name = 'currency_code'
  ) then
    execute 'create index if not exists idx_currency_rates_currency_code_lookup on public.currency_rates(currency_code)';
  end if;
end $$;

commit;
