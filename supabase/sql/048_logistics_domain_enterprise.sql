-- 048_logistics_domain_enterprise.sql
-- Domaine Logistique Enterprise : entrepôts, stocks multi-sites, fournisseurs, achats, réceptions,
-- mouvements, livraisons — RLS module `logistics`, lien governance (`approval_requests`).

begin;

-- ─── Permissions module logistics (FK → app_roles : pas de clé legacy « admin », cf. 035_authorization_generic_roles_departments.sql)
insert into public.permissions (
  role_key, module_key, can_create, can_read, can_update, can_delete, deleted_at
)
values
  ('super_admin', 'logistics', true, true, true, true, null),
  ('manager', 'logistics', true, true, true, false, null),
  ('agent', 'logistics', false, true, false, false, null),
  ('accountant', 'logistics', false, true, false, false, null),
  ('auditor', 'logistics', false, true, false, false, null)
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  deleted_at = null,
  updated_at = now();

-- ─── Opérateur logistique : équipe LOGISTIQUE ou admin
create or replace function public.is_logistics_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_role()
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.deleted_at is null
        and upper(coalesce(p.department_key, '')) = 'LOGISTIQUE'
    );
$$;

grant execute on function public.is_logistics_operator() to authenticated;

-- ─── Entrepôts
create table if not exists public.logistics_warehouses (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  label text not null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_logistics_warehouses_code unique (code)
);

drop trigger if exists trg_logistics_warehouses_updated_at on public.logistics_warehouses;
create trigger trg_logistics_warehouses_updated_at
before update on public.logistics_warehouses
for each row execute procedure public.set_updated_at();

create unique index if not exists uq_logistics_wh_single_default
  on public.logistics_warehouses ((1))
  where is_default = true;

-- ─── Fournisseurs
create table if not exists public.logistics_suppliers (
  id uuid primary key default gen_random_uuid(),
  supplier_code text not null,
  company_name text not null,
  contact_email text null,
  phone text null,
  address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_logistics_suppliers_code unique (supplier_code)
);

drop trigger if exists trg_logistics_suppliers_updated_at on public.logistics_suppliers;
create trigger trg_logistics_suppliers_updated_at
before update on public.logistics_suppliers
for each row execute procedure public.set_updated_at();

-- ─── Commandes d’achat
create table if not exists public.logistics_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null,
  supplier_id uuid not null references public.logistics_suppliers(id) on delete restrict,
  warehouse_id uuid not null references public.logistics_warehouses(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'partially_received', 'closed', 'cancelled')),
  currency text not null default 'GNF'
    check (currency in ('GNF', 'XOF', 'USD', 'EUR')),
  total_estimated_gnf numeric(18, 2) not null default 0 check (total_estimated_gnf >= 0),
  notes text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  expected_delivery_date date null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_logistics_po_number unique (po_number)
);

drop trigger if exists trg_logistics_po_updated_at on public.logistics_purchase_orders;
create trigger trg_logistics_po_updated_at
before update on public.logistics_purchase_orders
for each row execute procedure public.set_updated_at();

create index if not exists idx_logistics_po_supplier on public.logistics_purchase_orders(supplier_id);
create index if not exists idx_logistics_po_wh on public.logistics_purchase_orders(warehouse_id);

create table if not exists public.logistics_purchase_order_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.logistics_purchase_orders(id) on delete cascade,
  line_order int not null default 0,
  product_id uuid not null references public.products(id) on delete restrict,
  qty_ordered integer not null check (qty_ordered > 0),
  qty_received integer not null default 0 check (qty_received >= 0),
  unit_cost_gnf numeric(18, 2) null,
  created_at timestamptz not null default now(),
  constraint chk_logistics_po_line_received_le_ordered check (qty_received <= qty_ordered)
);

create index if not exists idx_logistics_po_lines_po on public.logistics_purchase_order_lines(purchase_order_id);

-- ─── Réceptions (ACHEMINEMENT vers stock)
create table if not exists public.logistics_goods_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_ref text not null,
  warehouse_id uuid not null references public.logistics_warehouses(id) on delete restrict,
  purchase_order_id uuid null references public.logistics_purchase_orders(id) on delete set null,
  received_at timestamptz not null default now(),
  notes text null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint uq_logistics_receipt_ref unique (receipt_ref)
);

create index if not exists idx_logistics_receipts_wh on public.logistics_goods_receipts(warehouse_id);

create table if not exists public.logistics_goods_receipt_lines (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references public.logistics_goods_receipts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty_received integer not null check (qty_received > 0),
  purchase_order_line_id uuid null references public.logistics_purchase_order_lines(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_logistics_receipt_lines_r on public.logistics_goods_receipt_lines(receipt_id);

-- ─── Stocks par entrepôt (SKU = products.id)
create table if not exists public.logistics_inventory_balances (
  warehouse_id uuid not null references public.logistics_warehouses(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  qty_on_hand integer not null default 0 check (qty_on_hand >= 0),
  updated_at timestamptz not null default now(),
  primary key (warehouse_id, product_id)
);

create index if not exists idx_logistics_inv_product on public.logistics_inventory_balances(product_id);

-- ─── Mouvements (journal supply-chain)
create table if not exists public.logistics_stock_movements (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.logistics_warehouses(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type text not null
    check (movement_type in (
      'purchase_receipt',
      'sale_shipment',
      'adjustment',
      'transfer_in',
      'transfer_out',
      'cycle_count',
      'delivery_issue'
    )),
  qty_signed integer not null check (qty_signed <> 0),
  reference_type text not null,
  reference_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index if not exists idx_logistics_mov_wh_created on public.logistics_stock_movements(warehouse_id, created_at desc);
create index if not exists idx_logistics_mov_product on public.logistics_stock_movements(product_id, created_at desc);

-- ─── Livraisons sortantes (option lien vente)
create table if not exists public.logistics_delivery_orders (
  id uuid primary key default gen_random_uuid(),
  delivery_ref text not null,
  warehouse_id uuid not null references public.logistics_warehouses(id) on delete restrict,
  sale_id uuid null references public.sales(id) on delete set null,
  status text not null default 'planned'
    check (status in ('planned', 'picking', 'shipped', 'delivered', 'cancelled')),
  ship_to jsonb not null default '{}'::jsonb,
  tracking_ref text null,
  shipped_at timestamptz null,
  notes text null,
  approval_request_id uuid null references public.approval_requests(id) on delete set null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_logistics_delivery_ref unique (delivery_ref)
);

drop trigger if exists trg_logistics_delivery_orders_updated_at on public.logistics_delivery_orders;
create trigger trg_logistics_delivery_orders_updated_at
before update on public.logistics_delivery_orders
for each row execute procedure public.set_updated_at();

create table if not exists public.logistics_delivery_lines (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid not null references public.logistics_delivery_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  qty_shipped integer not null check (qty_shipped > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_logistics_delivery_lines_d on public.logistics_delivery_lines(delivery_id);

-- ─── Application mouvement → stock entrepôt
create or replace function public.trg_logistics_movements_apply_balance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_new_qty integer;
begin
  insert into public.logistics_inventory_balances as b (warehouse_id, product_id, qty_on_hand)
  values (new.warehouse_id, new.product_id, new.qty_signed)
  on conflict (warehouse_id, product_id)
  do update set
    qty_on_hand = b.qty_on_hand + excluded.qty_on_hand,
    updated_at = now();

  select qty_on_hand into v_new_qty
  from public.logistics_inventory_balances
  where warehouse_id = new.warehouse_id
    and product_id = new.product_id;

  if v_new_qty is null or v_new_qty < 0 then
    raise exception 'logistics: stock negatif ou balance introuvable pour mouvement %', new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_logistics_mov_balance on public.logistics_stock_movements;
create trigger trg_logistics_mov_balance
after insert on public.logistics_stock_movements
for each row execute procedure public.trg_logistics_movements_apply_balance();

-- ─── Réception : mouvement + cumul ligne commande
create or replace function public.trg_logistics_receipt_line_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wh uuid;
begin
  select warehouse_id into v_wh from public.logistics_goods_receipts where id = new.receipt_id;

  insert into public.logistics_stock_movements (
    warehouse_id,
    product_id,
    movement_type,
    qty_signed,
    reference_type,
    reference_id,
    created_by
  ) values (
    v_wh,
    new.product_id,
    'purchase_receipt',
    new.qty_received,
    'goods_receipt_line',
    new.id::text,
    auth.uid()
  );

  if new.purchase_order_line_id is not null then
    update public.logistics_purchase_order_lines
    set qty_received = qty_received + new.qty_received
    where id = new.purchase_order_line_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_logistics_receipt_line_post on public.logistics_goods_receipt_lines;
create trigger trg_logistics_receipt_line_post
after insert on public.logistics_goods_receipt_lines
for each row execute procedure public.trg_logistics_receipt_line_post();

-- ─── Livraison : contrôle stock puis mouvement sortant
create or replace function public.trg_logistics_delivery_line_validate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wh uuid;
  v_bal integer;
begin
  select d.warehouse_id into v_wh
  from public.logistics_delivery_orders d
  where d.id = new.delivery_id;

  select coalesce(qty_on_hand, 0) into v_bal
  from public.logistics_inventory_balances
  where warehouse_id = v_wh
    and product_id = new.product_id;

  if v_bal < new.qty_shipped then
    raise exception 'logistics: stock insuffisant pour produit % sur entrepôt %', new.product_id, v_wh;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_logistics_delivery_line_validate on public.logistics_delivery_lines;
create trigger trg_logistics_delivery_line_validate
before insert on public.logistics_delivery_lines
for each row execute procedure public.trg_logistics_delivery_line_validate();

create or replace function public.trg_logistics_delivery_line_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_wh uuid;
begin
  select d.warehouse_id into v_wh
  from public.logistics_delivery_orders d
  where d.id = new.delivery_id;

  insert into public.logistics_stock_movements (
    warehouse_id,
    product_id,
    movement_type,
    qty_signed,
    reference_type,
    reference_id,
    created_by
  ) values (
    v_wh,
    new.product_id,
    'delivery_issue',
    - new.qty_shipped,
    'delivery_line',
    new.id::text,
    auth.uid()
  );

  return new;
end;
$$;

drop trigger if exists trg_logistics_delivery_line_post on public.logistics_delivery_lines;
create trigger trg_logistics_delivery_line_post
after insert on public.logistics_delivery_lines
for each row execute procedure public.trg_logistics_delivery_line_post();

-- ─── Vue alertes (seuil catalogue produit)
create or replace view public.v_logistics_stock_alerts as
select
  b.warehouse_id,
  w.code as warehouse_code,
  b.product_id,
  p.sku,
  p.name as product_name,
  b.qty_on_hand,
  p.stock_threshold
from public.logistics_inventory_balances b
join public.logistics_warehouses w on w.id = b.warehouse_id and w.is_active
join public.products p on p.id = b.product_id and p.deleted_at is null
where b.qty_on_hand <= p.stock_threshold;

comment on view public.v_logistics_stock_alerts is 'Positions sous ou au seuil stock_threshold du catalogue produit.';

-- ─── Seed entrepôt principal + alignement stock catalogue (initialisation non destructive)
insert into public.logistics_warehouses (code, label, is_active, is_default)
values ('MAIN', 'Entrepôt principal', true, true)
on conflict (code) do nothing;

insert into public.logistics_inventory_balances (warehouse_id, product_id, qty_on_hand)
select w.id, p.id, p.stock_quantity
from public.products p
cross join lateral (
  select id from public.logistics_warehouses where code = 'MAIN' limit 1
) w
where p.deleted_at is null
on conflict (warehouse_id, product_id) do nothing;

-- ─── RLS (pattern module logistics)
alter table public.logistics_warehouses enable row level security;
alter table public.logistics_suppliers enable row level security;
alter table public.logistics_purchase_orders enable row level security;
alter table public.logistics_purchase_order_lines enable row level security;
alter table public.logistics_goods_receipts enable row level security;
alter table public.logistics_goods_receipt_lines enable row level security;
alter table public.logistics_inventory_balances enable row level security;
alter table public.logistics_stock_movements enable row level security;
alter table public.logistics_delivery_orders enable row level security;
alter table public.logistics_delivery_lines enable row level security;

-- Warehouses
drop policy if exists logistics_wh_select on public.logistics_warehouses;
create policy logistics_wh_select on public.logistics_warehouses for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_wh_mutate on public.logistics_warehouses;
create policy logistics_wh_mutate on public.logistics_warehouses for insert to authenticated
with check (
  public.user_has_module_permission('logistics', 'create')
  and public.is_logistics_operator()
);

drop policy if exists logistics_wh_update on public.logistics_warehouses;
create policy logistics_wh_update on public.logistics_warehouses for update to authenticated
using (public.user_has_module_permission('logistics', 'update') and public.is_logistics_operator())
with check (public.user_has_module_permission('logistics', 'update') and public.is_logistics_operator());

-- Suppliers
drop policy if exists logistics_sup_select on public.logistics_suppliers;
create policy logistics_sup_select on public.logistics_suppliers for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_sup_insert on public.logistics_suppliers;
create policy logistics_sup_insert on public.logistics_suppliers for insert to authenticated
with check (public.user_has_module_permission('logistics', 'create'));

drop policy if exists logistics_sup_update on public.logistics_suppliers;
create policy logistics_sup_update on public.logistics_suppliers for update to authenticated
using (public.user_has_module_permission('logistics', 'update'))
with check (public.user_has_module_permission('logistics', 'update'));

-- Purchase orders
drop policy if exists logistics_po_select on public.logistics_purchase_orders;
create policy logistics_po_select on public.logistics_purchase_orders for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_po_insert on public.logistics_purchase_orders;
create policy logistics_po_insert on public.logistics_purchase_orders for insert to authenticated
with check (
  public.user_has_module_permission('logistics', 'create')
  and created_by = auth.uid()
);

drop policy if exists logistics_po_update on public.logistics_purchase_orders;
create policy logistics_po_update on public.logistics_purchase_orders for update to authenticated
using (public.user_has_module_permission('logistics', 'update'))
with check (public.user_has_module_permission('logistics', 'update'));

drop policy if exists logistics_po_lines_select on public.logistics_purchase_order_lines;
create policy logistics_po_lines_select on public.logistics_purchase_order_lines for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_po_lines_insert on public.logistics_purchase_order_lines;
create policy logistics_po_lines_insert on public.logistics_purchase_order_lines for insert to authenticated
with check (public.user_has_module_permission('logistics', 'create'));

drop policy if exists logistics_po_lines_update on public.logistics_purchase_order_lines;
create policy logistics_po_lines_update on public.logistics_purchase_order_lines for update to authenticated
using (public.user_has_module_permission('logistics', 'update'))
with check (public.user_has_module_permission('logistics', 'update'));

drop policy if exists logistics_po_lines_delete on public.logistics_purchase_order_lines;
create policy logistics_po_lines_delete on public.logistics_purchase_order_lines for delete to authenticated
using (public.user_has_module_permission('logistics', 'update'));

-- Receipts
drop policy if exists logistics_gr_select on public.logistics_goods_receipts;
create policy logistics_gr_select on public.logistics_goods_receipts for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_gr_insert on public.logistics_goods_receipts;
create policy logistics_gr_insert on public.logistics_goods_receipts for insert to authenticated
with check (
  public.user_has_module_permission('logistics', 'create')
  and created_by = auth.uid()
);

drop policy if exists logistics_gr_lines_select on public.logistics_goods_receipt_lines;
create policy logistics_gr_lines_select on public.logistics_goods_receipt_lines for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_gr_lines_insert on public.logistics_goods_receipt_lines;
create policy logistics_gr_lines_insert on public.logistics_goods_receipt_lines for insert to authenticated
with check (public.user_has_module_permission('logistics', 'create'));

-- Balances read-only direct mutation discouraged (via mouvements)
drop policy if exists logistics_bal_select on public.logistics_inventory_balances;
create policy logistics_bal_select on public.logistics_inventory_balances for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_bal_service on public.logistics_inventory_balances;
create policy logistics_bal_service on public.logistics_inventory_balances for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Movements
drop policy if exists logistics_mov_select on public.logistics_stock_movements;
create policy logistics_mov_select on public.logistics_stock_movements for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_mov_insert on public.logistics_stock_movements;
create policy logistics_mov_insert on public.logistics_stock_movements for insert to authenticated
with check (
  public.user_has_module_permission('logistics', 'create')
  and created_by = auth.uid()
);

-- Deliveries
drop policy if exists logistics_do_select on public.logistics_delivery_orders;
create policy logistics_do_select on public.logistics_delivery_orders for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_do_insert on public.logistics_delivery_orders;
create policy logistics_do_insert on public.logistics_delivery_orders for insert to authenticated
with check (
  public.user_has_module_permission('logistics', 'create')
  and created_by = auth.uid()
);

drop policy if exists logistics_do_update on public.logistics_delivery_orders;
create policy logistics_do_update on public.logistics_delivery_orders for update to authenticated
using (public.user_has_module_permission('logistics', 'update'))
with check (public.user_has_module_permission('logistics', 'update'));

drop policy if exists logistics_dl_select on public.logistics_delivery_lines;
create policy logistics_dl_select on public.logistics_delivery_lines for select to authenticated
using (public.user_has_module_permission('logistics', 'read'));

drop policy if exists logistics_dl_insert on public.logistics_delivery_lines;
create policy logistics_dl_insert on public.logistics_delivery_lines for insert to authenticated
with check (public.user_has_module_permission('logistics', 'create'));

commit;
