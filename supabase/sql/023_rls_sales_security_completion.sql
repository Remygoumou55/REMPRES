-- 023_rls_sales_security_completion.sql
-- Final security wave: complete RLS hardening for sales-related tables
-- with canonical roles (admin/manager/agent) and module permissions.

begin;

-- Ensure RLS is enabled on all targeted tables.
alter table if exists public.products enable row level security;
alter table if exists public.stock_movements enable row level security;
alter table if exists public.sales_archive enable row level security;
alter table if exists public.financial_transactions enable row level security;
alter table if exists public.expense_categories enable row level security;

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
drop policy if exists products_select_authenticated on public.products;
create policy products_select_authenticated
on public.products
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('produits', 'read')
  and (public.is_admin_role() or created_by = auth.uid())
);

drop policy if exists products_insert_authenticated on public.products;
create policy products_insert_authenticated
on public.products
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('produits', 'create')
);

drop policy if exists products_update_authenticated on public.products;
create policy products_update_authenticated
on public.products
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('produits', 'update')
    or public.user_has_module_permission('produits', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
)
with check (
  (
    public.user_has_module_permission('produits', 'update')
    or public.user_has_module_permission('produits', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
);

-- ---------------------------------------------------------------------------
-- STOCK MOVEMENTS
-- ---------------------------------------------------------------------------
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select
on public.stock_movements
for select
to authenticated
using (
  public.user_has_module_permission('vente', 'read')
  and (
    public.is_admin_role()
    or created_by = auth.uid()
  )
);

drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert
on public.stock_movements
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('vente', 'create')
);

-- ---------------------------------------------------------------------------
-- SALES ARCHIVE
-- ---------------------------------------------------------------------------
drop policy if exists sales_archive_select_authenticated on public.sales_archive;
create policy sales_archive_select_authenticated
on public.sales_archive
for select
to authenticated
using (
  public.user_has_module_permission('vente', 'read')
  and (
    public.is_admin_role()
    or archived_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- FINANCIAL TRANSACTIONS
-- ---------------------------------------------------------------------------
drop policy if exists ft_select on public.financial_transactions;
create policy ft_select
on public.financial_transactions
for select
to authenticated
using (
  public.user_has_module_permission('finance', 'read')
  and (
    public.is_admin_role()
    or created_by = auth.uid()
  )
);

drop policy if exists ft_insert on public.financial_transactions;
create policy ft_insert
on public.financial_transactions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('finance', 'create')
);

drop policy if exists ft_update on public.financial_transactions;
create policy ft_update
on public.financial_transactions
for update
to authenticated
using (
  (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
  )
)
with check (
  (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- EXPENSE CATEGORIES (reference data)
-- ---------------------------------------------------------------------------
drop policy if exists expense_categories_select on public.expense_categories;
create policy expense_categories_select
on public.expense_categories
for select
to authenticated
using (
  public.user_has_module_permission('finance', 'read')
);

commit;
