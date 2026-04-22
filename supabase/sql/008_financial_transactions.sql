-- =============================================================================
-- RemPres ERP — Migration 008
-- Table financière centrale : financial_transactions
--
-- POURQUOI : Centraliser TOUS les flux d'argent de l'application en un seul
-- endroit, quelle que soit leur source (vente, formation, consultation).
-- Cela permet :
--   • Un tableau de bord financier consolidé (CA global, par module, par période)
--   • Des exports comptables unifiés
--   • Des rapports de trésorerie sans jointures complexes entre modules
--   • Une base solide pour la Phase 6 (Finance globale)
--
-- DESIGN : relation polymorphique (source_type + source_id)
--   La contrainte UNIQUE (source_type, source_id) garantit qu'une opération
--   source ne peut générer qu'UNE SEULE entrée financière → pas de doublon.
--
-- À exécuter APRÈS : 007_create_sale_transaction.sql
-- =============================================================================

-- =============================================================================
-- SECTION 1 — Table principale
-- =============================================================================

create table if not exists public.financial_transactions (
  id               uuid          primary key default gen_random_uuid(),

  -- ── Source polymorphique ──────────────────────────────────────────────────
  -- source_type identifie le module ; source_id pointe vers l'enregistrement
  -- source dans sa table native (sales.id, enrollments.id, missions.id…).
  -- On n'utilise pas de FK physique car source_id peut référencer 3 tables
  -- différentes selon source_type — c'est une relation polymorphique logique.
  source_type      text          not null
                     check (source_type in ('sale', 'training', 'consultation')),
  source_id        uuid          not null,

  -- ── Parties impliquées ───────────────────────────────────────────────────
  client_id        uuid          references public.clients(id) on delete set null,
  created_by       uuid          references auth.users(id)    on delete set null,

  -- ── Montants (toujours stockés en GNF, devise de base) ──────────────────
  -- amount_gnf : montant canonique pour tous les calculs financiers
  -- display_currency / display_amount : pour affichage dans la devise du moment
  amount_gnf       numeric(18,2) not null check (amount_gnf > 0),
  display_currency text          not null default 'GNF'
                     check (display_currency in ('GNF','XOF','USD','EUR')),
  display_amount   numeric(18,2) not null default 0,
  exchange_rate    numeric(18,6) not null default 1,

  -- ── Statut paiement ──────────────────────────────────────────────────────
  status           text          not null default 'pending'
                     check (status in ('pending','paid','partial','cancelled')),
  paid_at          timestamptz,                  -- renseigné quand status = 'paid'
  amount_paid_gnf  numeric(18,2) not null default 0,

  -- ── Métadonnées ──────────────────────────────────────────────────────────
  description      text,                         -- ex: "Vente VNT-2026-0001"
  notes            text,

  -- ── Horodatage ───────────────────────────────────────────────────────────
  created_at       timestamptz   not null default now(),
  updated_at       timestamptz   not null default now(),

  -- ── Contrainte anti-doublon ──────────────────────────────────────────────
  -- Une opération source ne peut créer qu'UNE seule entrée financière.
  -- Si create_sale_transaction est appelé deux fois avec le même sale.id
  -- (bug ou retry), le second INSERT est silencieusement ignoré (ON CONFLICT).
  constraint uq_financial_source unique (source_type, source_id)
);

comment on table  public.financial_transactions
  is 'Registre financier central. Agrège TOUS les flux monétaires (ventes, formations, consultations) en GNF.';
comment on column public.financial_transactions.source_type
  is 'Module source : sale | training | consultation';
comment on column public.financial_transactions.source_id
  is 'UUID de l''enregistrement source dans sa table native (sales.id, enrollments.id…).';
comment on column public.financial_transactions.amount_gnf
  is 'Montant en GNF — toujours utilisé pour les calculs financiers.';
comment on column public.financial_transactions.display_currency
  is 'Devise affichée au moment de la transaction.';
comment on column public.financial_transactions.display_amount
  is 'Montant converti dans display_currency — pour affichage uniquement.';

-- =============================================================================
-- SECTION 2 — Trigger updated_at
-- =============================================================================

drop trigger if exists trg_financial_transactions_updated_at on public.financial_transactions;
create trigger trg_financial_transactions_updated_at
before update on public.financial_transactions
for each row
execute procedure public.set_updated_at();

-- =============================================================================
-- SECTION 3 — Indexes
-- =============================================================================

-- Filtres fréquents : par module, par enregistrement source, par client
create index if not exists idx_ft_source_type  on public.financial_transactions(source_type);
create index if not exists idx_ft_source_id    on public.financial_transactions(source_id);
create index if not exists idx_ft_client       on public.financial_transactions(client_id);

-- Tableaux de bord financiers : tri et agrégation par date
create index if not exists idx_ft_created_desc on public.financial_transactions(created_at desc);
create index if not exists idx_ft_status       on public.financial_transactions(status);

-- Accès par créateur (mon CA personnel)
create index if not exists idx_ft_created_by   on public.financial_transactions(created_by);

-- =============================================================================
-- SECTION 4 — Row Level Security
-- =============================================================================

alter table public.financial_transactions enable row level security;

-- Lecture : tout utilisateur authentifié peut lire les transactions financières
drop policy if exists ft_select on public.financial_transactions;
create policy ft_select
on public.financial_transactions for select
to authenticated
using (true);

-- Insertion : uniquement via SECURITY DEFINER (RPC) ou super_admin
-- Les fonctions RPC s'exécutent en tant que owner → elles contournent cette policy.
-- En pratique, un utilisateur normal ne peut PAS insérer directement.
drop policy if exists ft_insert on public.financial_transactions;
create policy ft_insert
on public.financial_transactions for insert
to authenticated
with check (public.is_super_admin());

-- Mise à jour statut : super_admin uniquement (ou via RPC dédiée future)
drop policy if exists ft_update on public.financial_transactions;
create policy ft_update
on public.financial_transactions for update
to authenticated
using  (true)
with check (public.is_super_admin());

-- =============================================================================
-- SECTION 5 — Vue agrégée pour le dashboard financier
-- =============================================================================

create or replace view public.v_financial_summary as
select
  source_type,
  status,
  count(*)                              as transaction_count,
  sum(amount_gnf)                       as total_amount_gnf,
  sum(amount_paid_gnf)                  as total_paid_gnf,
  sum(amount_gnf - amount_paid_gnf)     as total_outstanding_gnf,
  date_trunc('month', created_at)       as month
from public.financial_transactions
group by source_type, status, date_trunc('month', created_at);

comment on view public.v_financial_summary
  is 'Agrégats financiers par module, statut et mois. Utilisée par le dashboard Finance.';

-- =============================================================================
-- SECTION 6 — Mise à jour de create_sale_transaction
--
-- On recrée la fonction en ajoutant l'INSERT dans financial_transactions
-- à la fin de l'ÉTAPE 4, juste avant le RETURN.
-- =============================================================================

create or replace function public.create_sale_transaction(
  p_seller_id        uuid,
  p_created_by       uuid,
  p_items            jsonb,
  p_payment_method   text,
  p_client_id        uuid         default null,
  p_discount_percent numeric(5,2) default 0,
  p_display_currency text         default 'GNF',
  p_exchange_rate    numeric(18,6) default 1,
  p_notes            text         default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_item           jsonb;
  v_product_id     uuid;
  v_product_name   text;
  v_product_sku    text;
  v_quantity       integer;
  v_unit_price     numeric(18,2);
  v_item_discount  numeric(5,2);
  v_line_total     numeric(18,2);
  v_prev_stock     integer;
  v_new_stock      integer;
  v_subtotal        numeric(18,2) := 0;
  v_discount_amount numeric(18,2);
  v_total           numeric(18,2);
  v_sale_row       public.sales%rowtype;
  v_item_row       public.sale_items%rowtype;
  v_items_result   jsonb := '[]'::jsonb;
  v_display_amount numeric(18,2);
begin

  -- ══════════════════════════════════════════════════════════════════════════
  -- VALIDATION 1 : NULL CHECKS
  -- ══════════════════════════════════════════════════════════════════════════
  if p_seller_id is null or p_created_by is null then
    raise exception using errcode='P0001', message='MISSING_SELLER',
      detail='seller_id et created_by sont obligatoires.';
  end if;

  -- ══════════════════════════════════════════════════════════════════════════
  -- VALIDATION 2 : ITEMS ARRAY
  -- ══════════════════════════════════════════════════════════════════════════
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode='P0001', message='INVALID_ITEMS_FORMAT',
      detail='p_items doit être un tableau JSON valide.';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception using errcode='P0001', message='EMPTY_ITEMS',
      detail='Items cannot be empty : la vente doit contenir au moins un article.';
  end if;

  -- ══════════════════════════════════════════════════════════════════════════
  -- VALIDATION 3 : PAYMENT METHOD
  -- ══════════════════════════════════════════════════════════════════════════
  if p_payment_method is null or p_payment_method not in ('cash','mobile_money','bank_transfer') then
    raise exception using errcode='P0001', message='INVALID_PAYMENT_METHOD',
      detail=format(
        'Invalid payment method : "%s". Valeurs acceptées : cash, mobile_money, bank_transfer.',
        p_payment_method
      );
  end if;

  -- ══════════════════════════════════════════════════════════════════════════
  -- VALIDATION 4 : GLOBAL DISCOUNT (0–100)
  -- ══════════════════════════════════════════════════════════════════════════
  if coalesce(p_discount_percent, 0) < 0 or coalesce(p_discount_percent, 0) > 100 then
    raise exception using errcode='P0001', message='INVALID_DISCOUNT',
      detail=format('La remise globale doit être entre 0 et 100 (reçu : %s).', p_discount_percent);
  end if;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 1 : Verrouillage + validation par article (FOR UPDATE)
  -- ══════════════════════════════════════════════════════════════════════════
  for v_item in
    select value from jsonb_array_elements(p_items)
    order by value->>'product_id'
  loop
    v_product_id    := (v_item->>'product_id')::uuid;
    v_product_name  := coalesce(v_item->>'product_name', v_product_id::text);

    v_quantity := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity <= 0 then
      raise exception using errcode='P0001', message='INVALID_QUANTITY',
        detail=format('Invalid quantity for product "%s" : doit être > 0 (reçu : %s).', v_product_name, v_quantity);
    end if;

    v_unit_price := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    if v_unit_price <= 0 then
      raise exception using errcode='P0001', message='INVALID_UNIT_PRICE',
        detail=format('Invalid unit price for product "%s" : doit être > 0 GNF (reçu : %s).', v_product_name, v_unit_price);
    end if;

    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    if v_item_discount < 0 or v_item_discount > 100 then
      raise exception using errcode='P0001', message='INVALID_ITEM_DISCOUNT',
        detail=format('Invalid discount for product "%s" : doit être entre 0 et 100 (reçu : %s).', v_product_name, v_item_discount);
    end if;

    select stock_quantity into strict v_prev_stock
    from public.products
    where id = v_product_id and deleted_at is null
    for update;

    if v_prev_stock < v_quantity then
      raise exception using errcode='P0002', message='INSUFFICIENT_STOCK',
        detail=format('Stock insuffisant pour "%s" : demandé %s, disponible %s.', v_product_name, v_quantity, v_prev_stock);
    end if;
  end loop;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 2 : Calcul des totaux
  -- ══════════════════════════════════════════════════════════════════════════
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_unit_price    := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    v_quantity      := coalesce((v_item->>'quantity')::integer, 0);
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    v_line_total    := round(v_unit_price * v_quantity * (1 - v_item_discount / 100.0), 2);
    v_subtotal      := v_subtotal + v_line_total;
  end loop;
  v_discount_amount := round(v_subtotal * (coalesce(p_discount_percent,0) / 100.0), 2);
  v_total           := v_subtotal - v_discount_amount;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 3 : INSERT sales (trigger → référence VNT-YYYY-NNNN)
  -- ══════════════════════════════════════════════════════════════════════════
  insert into public.sales (
    client_id, seller_id, created_by,
    subtotal, discount_percent, discount_amount,
    total_amount_gnf, display_currency, exchange_rate,
    payment_method, payment_status, amount_paid_gnf, notes
  ) values (
    p_client_id, p_seller_id, p_created_by,
    v_subtotal, coalesce(p_discount_percent,0), v_discount_amount,
    v_total, coalesce(p_display_currency,'GNF'), coalesce(p_exchange_rate,1),
    p_payment_method, 'pending', 0, p_notes
  )
  returning * into v_sale_row;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 4 : Boucle articles → sale_items + stock + stock_movements
  -- ══════════════════════════════════════════════════════════════════════════
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id    := (v_item->>'product_id')::uuid;
    v_product_name  := coalesce(v_item->>'product_name', '');
    v_product_sku   := v_item->>'product_sku';
    v_quantity      := coalesce((v_item->>'quantity')::integer, 0);
    v_unit_price    := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    v_line_total    := round(v_unit_price * v_quantity * (1 - v_item_discount / 100.0), 2);

    insert into public.sale_items (
      sale_id, product_id, product_name, product_sku,
      quantity, unit_price_gnf, discount_percent, total_price_gnf
    ) values (
      v_sale_row.id, v_product_id, v_product_name, v_product_sku,
      v_quantity, v_unit_price, v_item_discount, v_line_total
    )
    returning * into v_item_row;

    select stock_quantity into v_prev_stock
    from public.products where id = v_product_id;
    v_new_stock := v_prev_stock - v_quantity;

    if v_new_stock < 0 then
      raise exception using errcode='P0002', message='NEGATIVE_STOCK_GUARD',
        detail=format('Stock négatif détecté pour "%s".', v_product_name);
    end if;

    update public.products set stock_quantity = v_new_stock where id = v_product_id;

    insert into public.stock_movements (
      product_id, movement_type, quantity,
      previous_stock, new_stock, reason, reference_id, created_by
    ) values (
      v_product_id, 'exit', v_quantity,
      v_prev_stock, v_new_stock,
      'Vente ' || coalesce(v_sale_row.reference, v_sale_row.id::text),
      v_sale_row.id, p_created_by
    );

    v_items_result := v_items_result || jsonb_build_array(row_to_json(v_item_row)::jsonb);
  end loop;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 5 : Enregistrement dans financial_transactions (NOUVEAU)
  --
  -- Calcul du display_amount = montant total converti dans la devise choisie.
  -- display_amount = total_gnf * exchange_rate  (si GNF→XOF, rate < 1)
  -- ou              = total_gnf / exchange_rate  selon convention.
  --
  -- Notre convention : rate = 1 unité devise / X GNF
  --   display_amount = total_gnf * rate   (ex: 10000 GNF * 0.046 = 460 XOF)
  --
  -- ON CONFLICT DO NOTHING : si la vente existe déjà (retry réseau),
  -- on n'insère pas de doublon — la contrainte UNIQUE est notre filet.
  -- ══════════════════════════════════════════════════════════════════════════
  v_display_amount := round(v_total * coalesce(p_exchange_rate, 1), 2);

  insert into public.financial_transactions (
    source_type,
    source_id,
    client_id,
    created_by,
    amount_gnf,
    display_currency,
    display_amount,
    exchange_rate,
    status,
    amount_paid_gnf,
    description
  ) values (
    'sale',
    v_sale_row.id,
    p_client_id,
    p_created_by,
    v_total,
    coalesce(p_display_currency, 'GNF'),
    v_display_amount,
    coalesce(p_exchange_rate, 1),
    'pending',
    0,
    'Vente ' || coalesce(v_sale_row.reference, v_sale_row.id::text)
  )
  on conflict (source_type, source_id) do nothing;  -- anti-doublon garanti

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 6 : Retour du résultat complet
  -- ══════════════════════════════════════════════════════════════════════════
  return jsonb_build_object(
    'sale',  row_to_json(v_sale_row)::jsonb,
    'items', v_items_result
  );

exception
  when sqlstate 'P0001' or sqlstate 'P0002' then raise;
  when others then
    raise exception using errcode='P0003', message='TRANSACTION_FAILED',
      detail=format('Erreur inattendue : %s (SQLSTATE %s)', sqlerrm, sqlstate);
end;
$$;

comment on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  is 'Crée une vente atomique et enregistre automatiquement dans financial_transactions.';

-- Permissions inchangées
revoke execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  from public, anon;
grant execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  to authenticated;

-- =============================================================================
-- SECTION 7 — Fonctions utilitaires pour les futurs modules
-- =============================================================================

-- record_financial_transaction() : fonction générique appelable par les futurs
-- RPC (formation, consultation) pour enregistrer une transaction financière
-- sans dupliquer la logique d'insertion.

create or replace function public.record_financial_transaction(
  p_source_type      text,
  p_source_id        uuid,
  p_client_id        uuid,
  p_created_by       uuid,
  p_amount_gnf       numeric(18,2),
  p_display_currency text         default 'GNF',
  p_exchange_rate    numeric(18,6) default 1,
  p_description      text         default null,
  p_status           text         default 'pending'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_ft_id        uuid;
  v_display_amt  numeric(18,2);
begin
  -- Validation source_type
  if p_source_type not in ('sale','training','consultation') then
    raise exception using errcode='P0001', message='INVALID_SOURCE_TYPE',
      detail=format('source_type invalide : "%s". Valeurs : sale, training, consultation.', p_source_type);
  end if;

  if p_amount_gnf <= 0 then
    raise exception using errcode='P0001', message='INVALID_AMOUNT',
      detail=format('Le montant doit être > 0 GNF (reçu : %s).', p_amount_gnf);
  end if;

  v_display_amt := round(p_amount_gnf * coalesce(p_exchange_rate, 1), 2);

  insert into public.financial_transactions (
    source_type, source_id, client_id, created_by,
    amount_gnf, display_currency, display_amount, exchange_rate,
    status, description
  ) values (
    p_source_type, p_source_id, p_client_id, p_created_by,
    p_amount_gnf, coalesce(p_display_currency,'GNF'), v_display_amt, coalesce(p_exchange_rate,1),
    coalesce(p_status,'pending'), p_description
  )
  on conflict (source_type, source_id) do nothing
  returning id into v_ft_id;

  return v_ft_id;  -- null si conflit (doublon ignoré)
end;
$$;

comment on function public.record_financial_transaction(text,uuid,uuid,uuid,numeric,text,numeric,text,text)
  is 'Fonction utilitaire générique : enregistre une transaction financière depuis n''importe quel module RPC.';

revoke execute on function public.record_financial_transaction(text,uuid,uuid,uuid,numeric,text,numeric,text,text)
  from public, anon;
grant execute on function public.record_financial_transaction(text,uuid,uuid,uuid,numeric,text,numeric,text,text)
  to authenticated;

-- =============================================================================
-- EXEMPLE D'UTILISATION depuis un futur RPC de formation :
-- =============================================================================
/*
  -- Dans create_enrollment_transaction() :
  perform public.record_financial_transaction(
    p_source_type  := 'training',
    p_source_id    := v_enrollment_id,
    p_client_id    := p_student_id,
    p_created_by   := p_created_by,
    p_amount_gnf   := v_session_price,
    p_description  := 'Inscription formation ' || v_session_name
  );

  -- Dans create_consultation_invoice() :
  perform public.record_financial_transaction(
    p_source_type  := 'consultation',
    p_source_id    := v_mission_id,
    p_client_id    := p_client_id,
    p_created_by   := p_created_by,
    p_amount_gnf   := v_invoice_total,
    p_description  := 'Mission consultation ' || v_mission_reference
  );
*/
