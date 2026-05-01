-- 024_rls_audit_verification.sql
-- Read-only RLS audit script for ERP security validation.
-- Safe to run in production (no data mutation).

-- ============================================================================
-- A) TARGET TABLES + RLS STATUS
-- ============================================================================
with target_tables as (
  select unnest(array[
    'clients',
    'products',
    'sales',
    'sale_items',
    'stock_movements',
    'expenses',
    'sales_archive',
    'financial_transactions',
    'currency_rates',
    'expense_categories'
  ]) as table_name
)
select
  tt.table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as rls_forced
from target_tables tt
left join pg_class c
  on c.relname = tt.table_name
left join pg_namespace n
  on n.oid = c.relnamespace
where n.nspname = 'public'
order by tt.table_name;

-- ============================================================================
-- B) POLICY INVENTORY (what exists, by table)
-- ============================================================================
with target_tables as (
  select unnest(array[
    'clients',
    'products',
    'sales',
    'sale_items',
    'stock_movements',
    'expenses',
    'sales_archive',
    'financial_transactions',
    'currency_rates',
    'expense_categories'
  ]) as table_name
)
select
  p.schemaname,
  p.tablename,
  p.policyname,
  p.permissive,
  p.roles,
  p.cmd,
  p.qual,
  p.with_check
from pg_policies p
join target_tables tt
  on tt.table_name = p.tablename
where p.schemaname = 'public'
order by p.tablename, p.cmd, p.policyname;

-- ============================================================================
-- C) REQUIRED SECURITY HELPERS (existence + properties)
-- ============================================================================
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as args,
  p.prosecdef as security_definer,
  p.provolatile as volatility -- i=immutable, s=stable, v=volatile
from pg_proc p
join pg_namespace n
  on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_super_admin',
    'current_user_canonical_role',
    'is_admin_role',
    'user_has_module_permission'
  )
order by p.proname;

-- ============================================================================
-- D) ROLE/PERMISSION MATRIX (admin/manager/agent)
-- ============================================================================
select
  role_key,
  module_key,
  can_create,
  can_read,
  can_update,
  can_delete,
  deleted_at
from public.permissions
where role_key in ('admin', 'manager', 'agent')
  and module_key in ('clients', 'produits', 'vente', 'finance', 'admin')
order by role_key, module_key;

-- ============================================================================
-- E) QUICK CONSISTENCY CHECKS
-- ============================================================================

-- E1) Policies referencing module permission helper.
select
  p.tablename,
  p.policyname,
  p.cmd
from pg_policies p
where p.schemaname = 'public'
  and (
    coalesce(p.qual, '') ilike '%user_has_module_permission%'
    or coalesce(p.with_check, '') ilike '%user_has_module_permission%'
  )
order by p.tablename, p.cmd, p.policyname;

-- E2) Policies referencing auth.uid ownership checks.
select
  p.tablename,
  p.policyname,
  p.cmd
from pg_policies p
where p.schemaname = 'public'
  and (
    coalesce(p.qual, '') ilike '%auth.uid()%'
    or coalesce(p.with_check, '') ilike '%auth.uid()%'
  )
order by p.tablename, p.cmd, p.policyname;

-- E3) Duplicated policy names on same table/command (should be reviewed).
select
  schemaname,
  tablename,
  cmd,
  policyname,
  count(*) as duplicates
from pg_policies
where schemaname = 'public'
group by schemaname, tablename, cmd, policyname
having count(*) > 1
order by duplicates desc, tablename, cmd, policyname;
