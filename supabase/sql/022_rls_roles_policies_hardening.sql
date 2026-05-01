-- 022_rls_roles_policies_hardening.sql
-- Production hardening: canonical roles + module permission helper + RLS policies.

begin;

-- ---------------------------------------------------------------------------
-- Canonical roles (co-exist with legacy roles)
-- ---------------------------------------------------------------------------
insert into public.app_roles (key, label)
values
  ('admin', 'Admin'),
  ('manager', 'Manager'),
  ('agent', 'Agent')
on conflict (key) do update set label = excluded.label;

-- Seed canonical permissions for core ERP modules.
with role_permissions as (
  select * from (
    values
      -- role_key, module_key, can_create, can_read, can_update, can_delete
      ('admin'::text,   'clients'::text,  true, true, true, true),
      ('admin'::text,   'produits'::text, true, true, true, true),
      ('admin'::text,   'vente'::text,    true, true, true, true),
      ('admin'::text,   'finance'::text,  true, true, true, true),
      ('admin'::text,   'admin'::text,    true, true, true, true),
      ('manager'::text, 'clients'::text,  true, true, true, false),
      ('manager'::text, 'produits'::text, true, true, true, false),
      ('manager'::text, 'vente'::text,    true, true, true, false),
      ('manager'::text, 'finance'::text,  true, true, true, false),
      ('agent'::text,   'clients'::text,  true, true, false, false),
      ('agent'::text,   'produits'::text, false, true, false, false),
      ('agent'::text,   'vente'::text,    true, true, false, false)
  ) as t(role_key, module_key, can_create, can_read, can_update, can_delete)
)
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
select role_key, module_key, can_create, can_read, can_update, can_delete, null
from role_permissions
on conflict (role_key, module_key) do update
set can_create = excluded.can_create,
    can_read = excluded.can_read,
    can_update = excluded.can_update,
    can_delete = excluded.can_delete,
    deleted_at = null,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Role + permission helpers (SECURITY DEFINER)
-- ---------------------------------------------------------------------------
create or replace function public.current_user_canonical_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.role_key in ('super_admin', 'admin', 'directeur_general') then 'admin'
    when p.role_key in (
      'manager', 'responsable_vente', 'comptable',
      'responsable_formation', 'responsable_consultation',
      'responsable_rh', 'responsable_marketing', 'responsable_logistique'
    ) then 'manager'
    else 'agent'
  end
  from public.profiles p
  where p.id = auth.uid()
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_canonical_role() = 'admin', false)
      or public.is_super_admin();
$$;

create or replace function public.user_has_module_permission(module_name text, action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles pr
      join public.permissions pm
        on pm.role_key in (pr.role_key, public.current_user_canonical_role())
       and pm.module_key = module_name
       and pm.deleted_at is null
      where pr.id = auth.uid()
        and pr.deleted_at is null
        and (
          (action_name = 'read' and pm.can_read = true) or
          (action_name = 'create' and pm.can_create = true) or
          (action_name = 'update' and pm.can_update = true) or
          (action_name = 'delete' and pm.can_delete = true)
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- Clients RLS
-- ---------------------------------------------------------------------------
drop policy if exists clients_select_authenticated on public.clients;
create policy clients_select_authenticated
on public.clients
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('clients', 'read')
  and (public.is_admin_role() or created_by = auth.uid())
);

drop policy if exists clients_insert_authenticated on public.clients;
create policy clients_insert_authenticated
on public.clients
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('clients', 'create')
);

drop policy if exists clients_update_authenticated on public.clients;
create policy clients_update_authenticated
on public.clients
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('clients', 'update')
    or public.user_has_module_permission('clients', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
)
with check (
  (
    public.user_has_module_permission('clients', 'update')
    or public.user_has_module_permission('clients', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
);

-- ---------------------------------------------------------------------------
-- Sales RLS
-- ---------------------------------------------------------------------------
drop policy if exists sales_select on public.sales;
create policy sales_select
on public.sales
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('vente', 'read')
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
  )
);

drop policy if exists sales_insert on public.sales;
create policy sales_insert
on public.sales
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('vente', 'create')
);

drop policy if exists sales_update on public.sales;
create policy sales_update
on public.sales
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
  )
)
with check (
  (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
  )
);

-- ---------------------------------------------------------------------------
-- Sale items RLS
-- ---------------------------------------------------------------------------
drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'read')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

drop policy if exists sale_items_insert on public.sale_items;
create policy sale_items_insert
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'create')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

drop policy if exists sale_items_delete on public.sale_items;
create policy sale_items_delete
on public.sale_items
for delete
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
      and public.user_has_module_permission('vente', 'delete')
      and (
        public.is_admin_role()
        or s.created_by = auth.uid()
        or s.seller_id = auth.uid()
      )
  )
);

-- ---------------------------------------------------------------------------
-- Expenses RLS (finance)
-- ---------------------------------------------------------------------------
drop policy if exists expenses_select on public.expenses;
create policy expenses_select
on public.expenses
for select
to authenticated
using (
  deleted_at is null
  and public.user_has_module_permission('finance', 'read')
  and (public.is_admin_role() or created_by = auth.uid())
);

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert
on public.expenses
for insert
to authenticated
with check (
  created_by = auth.uid()
  and public.user_has_module_permission('finance', 'create')
);

drop policy if exists expenses_update on public.expenses;
create policy expenses_update
on public.expenses
for update
to authenticated
using (
  deleted_at is null
  and (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
)
with check (
  (
    public.user_has_module_permission('finance', 'update')
    or public.user_has_module_permission('finance', 'delete')
  )
  and (public.is_admin_role() or created_by = auth.uid())
);

commit;
