-- 021_sales_performance_indexes.sql
-- Purpose: Add idempotent indexes for ERP sales/currency/client workloads.

create index if not exists idx_currency_rates_pair_created_at
  on public.currency_rates (base_currency, quote_currency, created_at desc);

create index if not exists idx_sales_created_at_client_id
  on public.sales (created_at desc, client_id);

create index if not exists idx_sales_client_id_created_at
  on public.sales (client_id, created_at desc);

create index if not exists idx_clients_email_active
  on public.clients (email)
  where deleted_at is null;

create index if not exists idx_clients_phone_active
  on public.clients (phone)
  where deleted_at is null;
