-- RemPres ERP - Vente module schema (Phase 2)
-- Run this file in Supabase SQL Editor after:
--   001_core_schema.sql
--   002_clients_schema.sql
--   003_seed_profiles_permissions.sql
--   004_products_schema.sql

create extension if not exists pgcrypto;

-- =============================================================================
-- TABLE : stock_movements
-- =============================================================================

create table if not exists public.stock_movements (
  id             uuid          primary key default gen_random_uuid(),
  product_id     uuid          not null references public.products(id) on delete restrict,
  movement_type  varchar(20)   not null
                   check (movement_type in ('entry', 'exit', 'adjustment', 'return', 'loss')),
  quantity       integer       not null,
  previous_stock integer       not null,
  new_stock      integer       not null,
  reason         text,
  reference_id   uuid,
  created_by     uuid          references auth.users(id) on delete set null,
  created_at     timestamptz   not null default now()
);

comment on table  public.stock_movements is 'Historique de tous les mouvements de stock.';
comment on column public.stock_movements.movement_type is 'Valeurs : entry, exit, adjustment, return, loss.';
comment on column public.stock_movements.reference_id   is 'ID optionnel du document source (vente, bon de commande…).';

create index if not exists idx_stock_movements_product    on public.stock_movements(product_id, created_at desc);
create index if not exists idx_stock_movements_reference  on public.stock_movements(reference_id);

-- =============================================================================
-- TABLE : sales
-- =============================================================================

create table if not exists public.sales (
  id               uuid          primary key default gen_random_uuid(),
  reference        varchar(20)   unique,
  client_id        uuid          references public.clients(id) on delete set null,
  seller_id        uuid          references auth.users(id) on delete set null,
  subtotal         numeric(18,2) not null default 0,
  discount_percent numeric(5,2)  not null default 0,
  discount_amount  numeric(18,2) not null default 0,
  total_amount_gnf numeric(18,2) not null,
  display_currency varchar(3)    not null default 'GNF',
  exchange_rate    numeric(18,6) not null default 1,
  payment_method   varchar(30)
                     check (payment_method in ('cash', 'mobile_money', 'bank_transfer', 'credit', 'mixed')),
  payment_status   varchar(20)   not null default 'pending'
                     check (payment_status in ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  amount_paid_gnf  numeric(18,2) not null default 0,
  notes            text,
  created_by       uuid          references auth.users(id) on delete set null,
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now(),
  deleted_at       timestamptz
);

comment on table  public.sales is 'En-têtes de vente. Montants toujours stockés en GNF.';
comment on column public.sales.reference        is 'Référence auto-générée format VNT-YYYY-NNNN.';
comment on column public.sales.display_currency is 'Devise choisie par le vendeur à l''affichage (GNF, XOF, USD, EUR).';
comment on column public.sales.exchange_rate    is 'Taux GNF→display_currency au moment de la vente.';
comment on column public.sales.deleted_at       is 'Soft delete.';

drop trigger if exists trg_sales_updated_at on public.sales;
create trigger trg_sales_updated_at
before update on public.sales
for each row
execute procedure public.set_updated_at();

create index if not exists idx_sales_client       on public.sales(client_id);
create index if not exists idx_sales_seller       on public.sales(seller_id);
create index if not exists idx_sales_status       on public.sales(payment_status);
create index if not exists idx_sales_created_desc on public.sales(created_at desc);
create index if not exists idx_sales_deleted_at   on public.sales(deleted_at);

-- Génération automatique de la référence VNT-YYYY-NNNN
create or replace function public.generate_sale_reference()
returns trigger
language plpgsql
as $$
declare
  v_count integer;
begin
  select count(*) + 1
  into   v_count
  from   public.sales
  where  extract(year from created_at) = extract(year from now());

  new.reference := 'VNT-' || to_char(now(), 'YYYY') || '-' || lpad(v_count::text, 4, '0');
  return new;
end;
$$;

drop trigger if exists trg_sales_reference on public.sales;
create trigger trg_sales_reference
before insert on public.sales
for each row
when (new.reference is null or trim(new.reference) = '')
execute function public.generate_sale_reference();

-- =============================================================================
-- TABLE : sale_items
-- =============================================================================

create table if not exists public.sale_items (
  id               uuid          primary key default gen_random_uuid(),
  sale_id          uuid          not null references public.sales(id) on delete cascade,
  product_id       uuid          references public.products(id) on delete set null,
  product_name     varchar(200)  not null,
  product_sku      varchar(50),
  quantity         integer       not null check (quantity > 0),
  unit_price_gnf   numeric(18,2) not null,
  discount_percent numeric(5,2)  not null default 0,
  total_price_gnf  numeric(18,2) not null
);

comment on table  public.sale_items is 'Lignes de vente. product_name/sku sont dénormalisés pour l''historique.';
comment on column public.sale_items.product_id   is 'Peut être null si le produit a été supprimé.';
comment on column public.sale_items.product_name is 'Nom au moment de la vente (dénormalisé).';

create index if not exists idx_sale_items_sale    on public.sale_items(sale_id);
create index if not exists idx_sale_items_product on public.sale_items(product_id);

-- =============================================================================
-- TABLE : expenses
-- =============================================================================

create table if not exists public.expenses (
  id             uuid          primary key default gen_random_uuid(),
  category       varchar(50)   not null,
  description    text          not null,
  amount_gnf     numeric(18,2) not null,
  supplier       varchar(150),
  payment_method varchar(30),
  expense_date   date          not null,
  receipt_url    text,
  created_by     uuid          references auth.users(id) on delete set null,
  created_at     timestamptz   not null default now(),
  updated_at     timestamptz   not null default now(),
  deleted_at     timestamptz
);

comment on table  public.expenses is 'Dépenses opérationnelles. Soft delete via deleted_at.';
comment on column public.expenses.amount_gnf is 'Montant en GNF (devise de base).';
comment on column public.expenses.deleted_at is 'Soft delete.';

drop trigger if exists trg_expenses_updated_at on public.expenses;
create trigger trg_expenses_updated_at
before update on public.expenses
for each row
execute procedure public.set_updated_at();

create index if not exists idx_expenses_category     on public.expenses(category);
create index if not exists idx_expenses_date         on public.expenses(expense_date desc);
create index if not exists idx_expenses_created_desc on public.expenses(created_at desc);
create index if not exists idx_expenses_deleted_at   on public.expenses(deleted_at);

-- =============================================================================
-- RLS
-- =============================================================================

alter table public.stock_movements enable row level security;
alter table public.sales            enable row level security;
alter table public.sale_items       enable row level security;
alter table public.expenses         enable row level security;

-- stock_movements : lecture/écriture pour les authentifiés (super_admin peut tout)
drop policy if exists stock_movements_select on public.stock_movements;
create policy stock_movements_select
on public.stock_movements for select
to authenticated
using (true);

drop policy if exists stock_movements_insert on public.stock_movements;
create policy stock_movements_insert
on public.stock_movements for insert
to authenticated
with check (created_by = auth.uid() or public.is_super_admin());

-- sales : lecture des non-supprimées, écriture par le créateur ou super_admin
drop policy if exists sales_select on public.sales;
create policy sales_select
on public.sales for select
to authenticated
using (deleted_at is null);

drop policy if exists sales_insert on public.sales;
create policy sales_insert
on public.sales for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists sales_update on public.sales;
create policy sales_update
on public.sales for update
to authenticated
using  (deleted_at is null)
with check (created_by = auth.uid() or public.is_super_admin());

-- sale_items : héritage de la vente parente
drop policy if exists sale_items_select on public.sale_items;
create policy sale_items_select
on public.sale_items for select
to authenticated
using (
  exists (
    select 1 from public.sales s
    where s.id = sale_id
      and s.deleted_at is null
  )
);

drop policy if exists sale_items_insert on public.sale_items;
create policy sale_items_insert
on public.sale_items for insert
to authenticated
with check (
  exists (
    select 1 from public.sales s
    where s.id = sale_id
      and s.created_by = auth.uid()
  )
  or public.is_super_admin()
);

drop policy if exists sale_items_delete on public.sale_items;
create policy sale_items_delete
on public.sale_items for delete
to authenticated
using (
  exists (
    select 1 from public.sales s
    where s.id = sale_id
      and (s.created_by = auth.uid() or public.is_super_admin())
  )
);

-- expenses : lecture des non-supprimées, écriture par le créateur ou super_admin
drop policy if exists expenses_select on public.expenses;
create policy expenses_select
on public.expenses for select
to authenticated
using (deleted_at is null);

drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert
on public.expenses for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists expenses_update on public.expenses;
create policy expenses_update
on public.expenses for update
to authenticated
using  (deleted_at is null)
with check (created_by = auth.uid() or public.is_super_admin());
