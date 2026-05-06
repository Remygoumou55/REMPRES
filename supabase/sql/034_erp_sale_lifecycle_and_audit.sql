-- RemPres ERP — cycle de vie ventes (validated / cancelled / archived), audit, suppression définitive désactivée.
-- Exécuter après 027_rls_step5_full_security_hardening.sql et 033_admin_permanent_delete_archives.sql.
--
-- Résumé métier :
--  • Les ventes ne sont plus retirées de l'historique via deleted_at : archivage = lifecycle_status archived.
--  • Annulation : payment_status cancelled + lifecycle cancelled + FT vente en cancelled (trigger).
--  • archive_and_soft_delete_sale : snapshot sales_archive + lifecycle archived (deleted_at laissé NULL).
--  • Suppression physique clients/produits archivés : désactivée (conformité audit).

begin;

-- ---------------------------------------------------------------------------
-- 1) Colonne lifecycle sur sales
-- ---------------------------------------------------------------------------

alter table public.sales
  drop constraint if exists sales_lifecycle_status_check;

alter table public.sales
  add column if not exists lifecycle_status text;

update public.sales
set lifecycle_status = case
  when payment_status = 'cancelled'::varchar then 'cancelled'
  when deleted_at is not null then 'archived'
  else 'validated'
end
where lifecycle_status is null;

alter table public.sales
  alter column lifecycle_status set default 'validated';

alter table public.sales
  alter column lifecycle_status set not null;

alter table public.sales
  add constraint sales_lifecycle_status_check
  check (lifecycle_status in ('validated', 'cancelled', 'archived'));

comment on column public.sales.lifecycle_status is
  'Cycle de vie métier : validated (opérationnel), cancelled (annulée, trace conservée), archived (hors vues opérationnelles, toujours en historique).';

comment on column public.sales.deleted_at is
  'Obsolète pour les ventes : ne plus renseigner. Conservé pour compatibilité schéma ; l''historique repose sur lifecycle_status.';

create index if not exists idx_sales_lifecycle_status on public.sales (lifecycle_status);

-- Réactiver la visibilité des ventes précédemment « soft delete » (audit / historique).
update public.sales
set deleted_at = null
where deleted_at is not null;

-- Aligner les transactions financières ventes déjà annulées avant les triggers.
update public.financial_transactions ft
set
  status = 'cancelled',
  updated_at = now()
from public.sales s
where ft.source_type = 'sale'
  and ft.source_id = s.id
  and s.payment_status = 'cancelled'::varchar
  and ft.status is distinct from 'cancelled';

-- ---------------------------------------------------------------------------
-- 2) Cohérence annulation vente ↔ lifecycle ↔ FT
-- ---------------------------------------------------------------------------

create or replace function public.enforce_sale_cancel_consistency()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.payment_status = 'cancelled'::varchar then
    new.lifecycle_status := 'cancelled';
  end if;
  if new.lifecycle_status = 'cancelled' and new.payment_status <> 'cancelled'::varchar then
    new.payment_status := 'cancelled';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sales_enforce_cancel_consistency on public.sales;
create trigger trg_sales_enforce_cancel_consistency
before insert or update on public.sales
for each row
execute function public.enforce_sale_cancel_consistency();

create or replace function public.sync_sale_financial_transaction_cancel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.payment_status = 'cancelled'::varchar then
    update public.financial_transactions
    set
      status = 'cancelled',
      updated_at = now()
    where source_type = 'sale'
      and source_id = new.id
      and status is distinct from 'cancelled';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sales_ft_cancel on public.sales;
create trigger trg_sales_ft_cancel
after insert or update of payment_status on public.sales
for each row
when (new.payment_status = 'cancelled'::varchar)
execute function public.sync_sale_financial_transaction_cancel();

-- ---------------------------------------------------------------------------
-- 3) RPC archivage vente : plus de deleted_at
-- ---------------------------------------------------------------------------

create or replace function public.archive_and_soft_delete_sale(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  r     public.sales%rowtype;
  v_items jsonb;
begin
  if v_uid is null then
    raise exception 'Non authentifié';
  end if;

  if p_sale_id is null then
    raise exception 'Vente invalide';
  end if;

  select * into r
  from public.sales
  where id = p_sale_id
    and deleted_at is null;

  if not found then
    raise exception 'Vente introuvable ou déjà supprimée';
  end if;

  if r.lifecycle_status = 'archived' then
    raise exception 'Vente déjà archivée';
  end if;

  if not (
    public.is_super_admin()
    or public.user_can_delete_vente_rls()
    or r.created_by = v_uid
  ) then
    raise exception 'Accès refusé';
  end if;

  select coalesce(jsonb_agg(to_jsonb(si.*)), '[]'::jsonb)
  into v_items
  from public.sale_items si
  where si.sale_id = p_sale_id;

  insert into public.sales_archive (
    original_sale_id,
    archived_by,
    client_id,
    total_amount_gnf,
    payment_status,
    created_at,
    raw_data
  )
  values (
    r.id,
    v_uid,
    r.client_id,
    r.total_amount_gnf,
    r.payment_status::text,
    r.created_at,
    jsonb_build_object('sale', to_jsonb(r), 'sale_items', v_items)
  )
  on conflict (original_sale_id) do update
  set
    archived_by      = excluded.archived_by,
    client_id          = excluded.client_id,
    total_amount_gnf   = excluded.total_amount_gnf,
    payment_status     = excluded.payment_status,
    raw_data           = excluded.raw_data,
    archived_at        = now();

  update public.sales
  set
    lifecycle_status = 'archived',
    deleted_at       = null,
    updated_at       = now()
  where id = p_sale_id;

  if not found then
    raise exception 'Erreur lors de l''archivage de la vente';
  end if;
end;
$$;

comment on function public.archive_and_soft_delete_sale(uuid) is
  'Archive figée dans sales_archive puis passe la vente en lifecycle archived (pas de suppression physique ni deleted_at).';

-- ---------------------------------------------------------------------------
-- 4) RLS ventes : mises à jour réservées aux ventes encore opérationnelles (validated)
-- ---------------------------------------------------------------------------

drop policy if exists sales_update on public.sales;

create policy sales_update
on public.sales
for update
to authenticated
using (
  deleted_at is null
  and lifecycle_status = 'validated'
  and (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
    or public.user_can_delete_vente_rls()
  )
)
with check (
  deleted_at is null
  and (
    public.user_has_module_permission('vente', 'update')
    or public.user_has_module_permission('vente', 'delete')
  )
  and (
    public.is_admin_role()
    or created_by = auth.uid()
    or seller_id = auth.uid()
    or public.user_can_delete_vente_rls()
  )
);

-- ---------------------------------------------------------------------------
-- 5) Suppression définitive archives clients/produits : désactivée
-- ---------------------------------------------------------------------------

create or replace function public.admin_permanently_delete_archived_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'SUPPRESSION_DEFINITIVE_INTERDITE'
    using hint = 'Les données clients archivées sont conservées pour la traçabilité financière et l''audit.';
end;
$$;

create or replace function public.admin_permanently_delete_archived_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  raise exception 'SUPPRESSION_DEFINITIVE_INTERDITE'
    using hint = 'Les données produits archivées sont conservées pour la traçabilité financière et l''audit.';
end;
$$;

commit;
