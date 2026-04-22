-- =============================================================================
-- RemPres ERP — Migration 007
-- Fonction transactionnelle de création de vente
--
-- POURQUOI : Les 4 étapes (sales → sale_items → products → stock_movements)
-- doivent être ATOMIQUES : soit tout réussit, soit tout est annulé.
-- Sans cela, une panne réseau entre deux étapes laisse la base incohérente.
--
-- COMMENT : Une fonction plpgsql SECURITY DEFINER contient toute la logique.
-- PostgreSQL garantit l'atomicité d'une fonction (une seule transaction).
-- SELECT … FOR UPDATE verrouille les lignes de produits dès la validation du
-- stock, empêchant deux ventes simultanées de sur-vendre le même produit.
--
-- À exécuter APRÈS : 005_vente_schema.sql
-- =============================================================================

-- =============================================================================
-- SECTION 1 — Séquence dédiée pour les références de vente
-- =============================================================================
-- Remplace le COUNT(*) dans generate_sale_reference() qui est non-atomique
-- sous forte concurrence.  La séquence est reset chaque année via un job cron
-- (ou manuellement).  Le trigger existant est conservé mais redirigé ici.

create sequence if not exists public.sales_reference_seq
  start 1
  increment 1
  no maxvalue
  no cycle;

-- Nouvelle implémentation du trigger de référence (atomique via séquence)
create or replace function public.generate_sale_reference()
returns trigger
language plpgsql
as $$
declare
  v_seq bigint;
begin
  -- nextval() est transactionnel et garanti unique même en parallèle
  v_seq := nextval('public.sales_reference_seq');
  new.reference := 'VNT-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0');
  return new;
end;
$$;

comment on function public.generate_sale_reference()
  is 'Génère VNT-YYYY-NNNN via séquence (atomique, sans doublon de référence).';

-- =============================================================================
-- SECTION 2 — Fonction principale : create_sale_transaction
-- =============================================================================

create or replace function public.create_sale_transaction(
  p_seller_id        uuid,
  p_created_by       uuid,
  p_items            jsonb,           -- [{product_id, product_name, product_sku, quantity, unit_price_gnf, discount_percent}]
  p_payment_method   text,
  p_client_id        uuid         default null,
  p_discount_percent numeric(5,2) default 0,
  p_display_currency text         default 'GNF',
  p_exchange_rate    numeric(18,6) default 1,
  p_notes            text         default null
)
returns jsonb
language plpgsql
security definer                     -- s'exécute en tant que owner → contourne RLS de façon contrôlée
set search_path = public, auth       -- évite le search_path injection
as $$
declare
  -- ── Variables de boucle ──────────────────────────────────────────────────
  v_item           jsonb;

  -- ── Données produit par item ─────────────────────────────────────────────
  v_product_id     uuid;
  v_product_name   text;
  v_product_sku    text;
  v_quantity       integer;
  v_unit_price     numeric(18,2);
  v_item_discount  numeric(5,2);
  v_line_total     numeric(18,2);
  v_prev_stock     integer;
  v_new_stock      integer;

  -- ── Totaux de la vente ───────────────────────────────────────────────────
  v_subtotal        numeric(18,2) := 0;
  v_discount_amount numeric(18,2);
  v_total           numeric(18,2);

  -- ── Résultats ────────────────────────────────────────────────────────────
  v_sale_row       public.sales%rowtype;
  v_item_row       public.sale_items%rowtype;
  v_items_result   jsonb := '[]'::jsonb;
begin

  -- ══════════════════════════════════════════════════════════════════════════
  -- GARDE-FOUS : validation des paramètres d'entrée
  -- ══════════════════════════════════════════════════════════════════════════

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception using
      errcode = 'P0001',
      message = 'EMPTY_ITEMS',
      detail  = 'La vente doit contenir au moins un article.';
  end if;

  if p_seller_id is null or p_created_by is null then
    raise exception using
      errcode = 'P0001',
      message = 'MISSING_SELLER',
      detail  = 'seller_id et created_by sont obligatoires.';
  end if;

  if p_payment_method not in ('cash','mobile_money','bank_transfer') then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_PAYMENT_METHOD',
      detail  = format(
        'Mode de paiement invalide : "%s". Valeurs acceptées : cash, mobile_money, bank_transfer.',
        p_payment_method
      );
  end if;

  if coalesce(p_discount_percent, 0) < 0 or coalesce(p_discount_percent, 0) > 100 then
    raise exception using
      errcode = 'P0001',
      message = 'INVALID_DISCOUNT',
      detail  = format('La remise doit être comprise entre 0 et 100 (reçu : %s).', p_discount_percent);
  end if;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 1 — Verrouillage des lignes produit + validation du stock
  --
  -- Les lignes sont verrouillées en ordre croissant d'UUID afin d'éviter
  -- tout deadlock si deux transactions parallèles verrouillent les mêmes
  -- produits dans des ordres différents.
  --
  -- SELECT … FOR UPDATE acquiert un verrou exclusif sur chaque ligne.
  -- Ce verrou est conservé jusqu'à la fin de la transaction (COMMIT/ROLLBACK).
  -- Toute autre transaction qui tente de modifier ces lignes sera mise en
  -- attente jusqu'à la libération du verrou.
  -- ══════════════════════════════════════════════════════════════════════════

  for v_item in
    select value
    from   jsonb_array_elements(p_items)
    order  by value->>'product_id'   -- tri déterministe → prévention des deadlocks
  loop
    v_product_id   := (v_item->>'product_id')::uuid;
    v_product_name := coalesce(v_item->>'product_name', v_product_id::text);
    v_quantity     := coalesce((v_item->>'quantity')::integer, 0);

    -- Validation quantité
    if v_quantity <= 0 then
      raise exception using
        errcode = 'P0001',
        message = 'INVALID_QUANTITY',
        detail  = format(
          'Quantité invalide pour le produit "%s" : doit être > 0 (reçu : %s).',
          v_product_name, v_quantity
        );
    end if;

    -- Validation prix unitaire
    v_unit_price := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    if v_unit_price <= 0 then
      raise exception using
        errcode = 'P0001',
        message = 'INVALID_UNIT_PRICE',
        detail  = format(
          'Prix unitaire invalide pour le produit "%s" : doit être > 0 GNF (reçu : %s).',
          v_product_name, v_unit_price
        );
    end if;

    -- Validation remise ligne
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    if v_item_discount < 0 or v_item_discount > 100 then
      raise exception using
        errcode = 'P0001',
        message = 'INVALID_ITEM_DISCOUNT',
        detail  = format(
          'Remise invalide pour le produit "%s" : doit être entre 0 et 100 (reçu : %s).',
          v_product_name, v_item_discount
        );
    end if;

    -- Verrouillage + lecture du stock courant
    -- STRICT → lève une exception immédiate si le produit n'existe pas ou est supprimé
    select stock_quantity
    into   strict v_prev_stock
    from   public.products
    where  id         = v_product_id
      and  deleted_at is null
    for update;                      -- ← verrou exclusif sur cette ligne

    -- Validation du stock disponible
    if v_prev_stock < v_quantity then
      raise exception using
        errcode = 'P0002',
        message = 'INSUFFICIENT_STOCK',
        detail  = format(
          'Stock insuffisant pour "%s" : demandé %s, disponible %s.',
          v_product_name, v_quantity, v_prev_stock
        );
    end if;

  end loop;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 2 — Calcul des totaux
  -- ══════════════════════════════════════════════════════════════════════════

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_unit_price    := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    v_quantity      := coalesce((v_item->>'quantity')::integer, 0);
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);

    -- Ligne = prix × qté × (1 − remise_ligne%)
    v_line_total := round(v_unit_price * v_quantity * (1 - v_item_discount / 100.0), 2);
    v_subtotal   := v_subtotal + v_line_total;
  end loop;

  v_discount_amount := round(v_subtotal * (coalesce(p_discount_percent, 0) / 100.0), 2);
  v_total           := v_subtotal - v_discount_amount;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 3 — Insertion de l'en-tête de vente (sales)
  --
  -- Le trigger trg_sales_reference se déclenche ici (BEFORE INSERT)
  -- et renseigne automatiquement la colonne reference = 'VNT-YYYY-NNNN'.
  -- RETURNING * récupère la ligne complète APRÈS le trigger → reference incluse.
  -- ══════════════════════════════════════════════════════════════════════════

  insert into public.sales (
    client_id,        seller_id,
    created_by,
    subtotal,         discount_percent,                    discount_amount,
    total_amount_gnf, display_currency,                    exchange_rate,
    payment_method,   payment_status,                      amount_paid_gnf,
    notes
  ) values (
    p_client_id,      p_seller_id,
    p_created_by,
    v_subtotal,       coalesce(p_discount_percent, 0),     v_discount_amount,
    v_total,          coalesce(p_display_currency, 'GNF'), coalesce(p_exchange_rate, 1),
    p_payment_method, 'pending',                           0,
    p_notes
  )
  returning * into v_sale_row;     -- référence déjà renseignée par le trigger

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 4 — Boucle sur les articles :
  --           a) Insertion dans sale_items
  --           b) Déduction du stock (ligne déjà verrouillée depuis l'étape 1)
  --           c) Enregistrement du mouvement de stock
  -- ══════════════════════════════════════════════════════════════════════════

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_product_id    := (v_item->>'product_id')::uuid;
    v_product_name  := coalesce(v_item->>'product_name', '');
    v_product_sku   := v_item->>'product_sku';
    v_quantity      := coalesce((v_item->>'quantity')::integer, 0);
    v_unit_price    := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    v_line_total    := round(v_unit_price * v_quantity * (1 - v_item_discount / 100.0), 2);

    -- 4a. Insertion de la ligne de vente
    insert into public.sale_items (
      sale_id,        product_id,      product_name,
      product_sku,    quantity,
      unit_price_gnf, discount_percent, total_price_gnf
    ) values (
      v_sale_row.id,  v_product_id,    v_product_name,
      v_product_sku,  v_quantity,
      v_unit_price,   v_item_discount,  v_line_total
    )
    returning * into v_item_row;      -- récupère l'id auto-généré + toutes les colonnes

    -- 4b. Lecture du stock actuel (verrou déjà acquis à l'étape 1 → lecture non bloquante)
    select stock_quantity
    into   v_prev_stock
    from   public.products
    where  id = v_product_id;

    v_new_stock := v_prev_stock - v_quantity;

    -- Garde de sécurité : ne devrait jamais se déclencher (verrou + validation faits)
    -- Protège contre un bug de logique futur dans cette fonction
    if v_new_stock < 0 then
      raise exception using
        errcode = 'P0002',
        message = 'NEGATIVE_STOCK_GUARD',
        detail  = format(
          'Stock négatif détecté pour "%s" — bug de logique dans create_sale_transaction.',
          v_product_name
        );
    end if;

    -- 4c. Déduction du stock
    update public.products
    set    stock_quantity = v_new_stock
    where  id = v_product_id;

    -- 4d. Enregistrement du mouvement de stock
    insert into public.stock_movements (
      product_id,   movement_type, quantity,
      previous_stock, new_stock,
      reason,       reference_id,  created_by
    ) values (
      v_product_id, 'exit',        v_quantity,
      v_prev_stock, v_new_stock,
      'Vente ' || coalesce(v_sale_row.reference, v_sale_row.id::text),
      v_sale_row.id,
      p_created_by
    );

    -- Accumulation du résultat items
    v_items_result := v_items_result || jsonb_build_array(
      row_to_json(v_item_row)::jsonb
    );
  end loop;

  -- ══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 5 — Retour du résultat complet
  -- ══════════════════════════════════════════════════════════════════════════

  return jsonb_build_object(
    'sale',  row_to_json(v_sale_row)::jsonb,
    'items', v_items_result
  );

exception
  -- Retransmet les erreurs métier (P0001, P0002) telles quelles
  when sqlstate 'P0001' or sqlstate 'P0002' then
    raise;
  -- Encapsule toutes les autres erreurs (contraintes, clés étrangères, etc.)
  when others then
    raise exception using
      errcode = 'P0003',
      message = 'TRANSACTION_FAILED',
      detail  = format('Erreur inattendue : %s (SQLSTATE %s)', sqlerrm, sqlstate);

end;
$$;

comment on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  is 'Crée une vente de façon atomique : sales + sale_items + stock products + stock_movements en une seule transaction.';

-- =============================================================================
-- SECTION 3 — Permissions
-- =============================================================================

-- Restreindre : seul le rôle `authenticated` peut appeler cette fonction
-- (les utilisateurs anonymes ne peuvent pas créer de ventes)
revoke execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  from public, anon;

grant execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  to authenticated;

-- =============================================================================
-- EXEMPLE D'APPEL DIRECT (SQL Editor Supabase pour test)
-- =============================================================================
/*
select public.create_sale_transaction(
  p_seller_id        := auth.uid(),
  p_created_by       := auth.uid(),
  p_payment_method   := 'cash',
  p_client_id        := null,           -- Client de passage
  p_discount_percent := 10,
  p_display_currency := 'GNF',
  p_exchange_rate    := 1,
  p_notes            := 'Test transaction',
  p_items            := '[
    {
      "product_id"      : "11111111-1111-1111-1111-111111111111",
      "product_name"    : "Cahier A4",
      "product_sku"     : "CAH-A4-001",
      "quantity"        : 3,
      "unit_price_gnf"  : 5000,
      "discount_percent": 0
    },
    {
      "product_id"      : "22222222-2222-2222-2222-222222222222",
      "product_name"    : "Stylo Bic",
      "product_sku"     : "STY-BIC-01",
      "quantity"        : 10,
      "unit_price_gnf"  : 500,
      "discount_percent": 5
    }
  ]'::jsonb
);

-- Résultat attendu :
-- {
--   "sale": {
--     "id": "...",
--     "reference": "VNT-2026-0001",
--     "total_amount_gnf": 18225.00,
--     "payment_status": "pending",
--     ...
--   },
--   "items": [
--     { "id": "...", "product_name": "Cahier A4", "quantity": 3, ... },
--     { "id": "...", "product_name": "Stylo Bic", "quantity": 10, ... }
--   ]
-- }
*/
