-- 070_logistique_records_schema.sql
-- Logistique operational records: stock_items, stock_movements_logistique
-- and simple_purchase_orders. Independent of the enterprise products catalog
-- so the supply team can manage SKUs that aren't tied to the sales catalog.

begin;

-- ═══════════════════════════════════════════
-- STOCK ITEMS (HR-style record-keeping)
-- ═══════════════════════════════════════════
create table if not exists public.stock_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text,
  category text,
  unit text not null default 'piece',
  quantity numeric(18, 3) not null default 0,
  min_quantity numeric(18, 3) not null default 0,
  unit_price_gnf numeric(18, 2) not null default 0,
  warehouse_id uuid references public.logistics_warehouses(id) on delete set null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index if not exists uq_stock_items_sku
  on public.stock_items (sku)
  where deleted_at is null and sku is not null;
create index if not exists idx_stock_items_category
  on public.stock_items(category) where deleted_at is null;
create index if not exists idx_stock_items_low
  on public.stock_items(quantity, min_quantity) where deleted_at is null;

-- ═══════════════════════════════════════════
-- STOCK MOVEMENTS LOGISTIQUE
-- ═══════════════════════════════════════════
create table if not exists public.stock_movements_logistique (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.stock_items(id) on delete cascade,
  type text not null
    check (type in ('in', 'out', 'adjust', 'transfer')),
  quantity numeric(18, 3) not null check (quantity > 0),
  reason text,
  reference text,
  warehouse_from uuid references public.logistics_warehouses(id) on delete set null,
  warehouse_to uuid references public.logistics_warehouses(id) on delete set null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_mov_log_item
  on public.stock_movements_logistique(item_id, created_at desc);
create index if not exists idx_stock_mov_log_type
  on public.stock_movements_logistique(type, created_at desc);
create index if not exists idx_stock_mov_log_created
  on public.stock_movements_logistique(created_at desc);

-- ═══════════════════════════════════════════
-- SIMPLE PURCHASE ORDERS (free-text line items)
-- ═══════════════════════════════════════════
create sequence if not exists simple_po_seq start 1000;

create table if not exists public.simple_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default 'PO-' || to_char(now(), 'YYYY') || '-'
    || lpad(nextval('simple_po_seq')::text, 4, '0'),
  supplier_id uuid not null references public.logistics_suppliers(id) on delete restrict,
  status text not null default 'draft'
    check (status in ('draft', 'submitted', 'approved', 'received', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  total_amount_gnf numeric(18, 2) not null default 0,
  expected_date date,
  notes text,
  approval_request_id uuid references public.approval_requests(id) on delete set null,
  approved_at timestamptz,
  received_at timestamptz,
  cancelled_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_simple_po_status
  on public.simple_purchase_orders(status, created_at desc);
create index if not exists idx_simple_po_supplier
  on public.simple_purchase_orders(supplier_id, created_at desc);

-- ═══════════════════════════════════════════
-- TRIGGERS — updated_at
-- ═══════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_proc where proname = 'set_updated_at'
  ) then
    create function public.set_updated_at()
    returns trigger language plpgsql as $body$
    begin
      new.updated_at = now();
      return new;
    end;
    $body$;
  end if;
end$$;

drop trigger if exists trg_stock_items_updated_at on public.stock_items;
create trigger trg_stock_items_updated_at
  before update on public.stock_items
  for each row execute function public.set_updated_at();

drop trigger if exists trg_simple_po_updated_at on public.simple_purchase_orders;
create trigger trg_simple_po_updated_at
  before update on public.simple_purchase_orders
  for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════
-- TRIGGER — stock movements apply to stock_items.quantity
-- ═══════════════════════════════════════════
create or replace function public.trg_stock_mov_log_apply()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'in' then
    update public.stock_items
    set quantity = quantity + new.quantity
    where id = new.item_id and deleted_at is null;
  elsif new.type = 'out' then
    update public.stock_items
    set quantity = greatest(0, quantity - new.quantity)
    where id = new.item_id and deleted_at is null;
  elsif new.type = 'adjust' then
    update public.stock_items
    set quantity = new.quantity
    where id = new.item_id and deleted_at is null;
  elsif new.type = 'transfer' then
    -- transfer doesn't change global quantity; warehouses tracked via columns
    null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_stock_mov_log_apply on public.stock_movements_logistique;
create trigger trg_stock_mov_log_apply
  after insert on public.stock_movements_logistique
  for each row execute function public.trg_stock_mov_log_apply();

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════
alter table public.stock_items enable row level security;
alter table public.stock_movements_logistique enable row level security;
alter table public.simple_purchase_orders enable row level security;

-- ─── stock_items ───────────────────────────
drop policy if exists stock_items_read on public.stock_items;
create policy stock_items_read
on public.stock_items for select to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'read')
);

drop policy if exists stock_items_insert on public.stock_items;
create policy stock_items_insert
on public.stock_items for insert to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'create')
);

drop policy if exists stock_items_update on public.stock_items;
create policy stock_items_update
on public.stock_items for update to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'update')
);

drop policy if exists stock_items_delete on public.stock_items;
create policy stock_items_delete
on public.stock_items for delete to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'delete')
);

-- ─── stock_movements_logistique ────────────
drop policy if exists stock_mov_log_read on public.stock_movements_logistique;
create policy stock_mov_log_read
on public.stock_movements_logistique for select to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'read')
);

drop policy if exists stock_mov_log_insert on public.stock_movements_logistique;
create policy stock_mov_log_insert
on public.stock_movements_logistique for insert to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'create')
);

-- ─── simple_purchase_orders ────────────────
drop policy if exists simple_po_read on public.simple_purchase_orders;
create policy simple_po_read
on public.simple_purchase_orders for select to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'read')
);

drop policy if exists simple_po_insert on public.simple_purchase_orders;
create policy simple_po_insert
on public.simple_purchase_orders for insert to authenticated
with check (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'create')
);

drop policy if exists simple_po_update on public.simple_purchase_orders;
create policy simple_po_update
on public.simple_purchase_orders for update to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'update')
)
with check (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'update')
);

drop policy if exists simple_po_delete on public.simple_purchase_orders;
create policy simple_po_delete
on public.simple_purchase_orders for delete to authenticated
using (
  public.is_admin_role()
  or public.user_has_module_permission('logistics', 'delete')
);

commit;
