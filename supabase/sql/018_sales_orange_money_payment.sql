-- RemPres ERP — Mode de paiement Orange Money sur les ventes
-- À exécuter après 009_fix_sale_transaction.sql (ou équivalent déjà déployé).
--
-- 1) Étend la contrainte CHECK sur public.sales.payment_method
-- 2) Met à jour la validation dans public.create_sale_transaction

-- ---------------------------------------------------------------------------
-- 1) Contrainte sales.payment_method (nom auto possible selon version PG)
-- ---------------------------------------------------------------------------
do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_namespace nsp on nsp.oid = rel.relnamespace
  where nsp.nspname = 'public'
    and rel.relname = 'sales'
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) like '%payment_method%'
  limit 1;
  if cname is not null then
    execute format('alter table public.sales drop constraint %I', cname);
  end if;
end $$;

alter table public.sales
  add constraint sales_payment_method_check
  check (
    payment_method is null
    or payment_method in (
      'cash',
      'mobile_money',
      'orange_money',
      'bank_transfer',
      'credit',
      'mixed'
    )
  );

-- ---------------------------------------------------------------------------
-- 2) RPC create_sale_transaction — accepter orange_money
-- ---------------------------------------------------------------------------
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
begin

  if p_seller_id is null or p_created_by is null then
    raise exception using errcode='P0001', message='MISSING_SELLER',
      detail='seller_id et created_by sont obligatoires.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' then
    raise exception using errcode='P0001', message='INVALID_ITEMS_FORMAT',
      detail='p_items doit être un tableau JSON valide.';
  end if;
  if jsonb_array_length(p_items) = 0 then
    raise exception using errcode='P0001', message='EMPTY_ITEMS',
      detail='Le panier ne peut pas être vide.';
  end if;
  if p_payment_method is null or p_payment_method not in (
    'cash', 'mobile_money', 'orange_money', 'bank_transfer'
  ) then
    raise exception using errcode='P0001', message='INVALID_PAYMENT_METHOD',
      detail=format(
        'Mode de paiement invalide : "%s". Valeurs : cash, mobile_money, orange_money, bank_transfer.',
        p_payment_method
      );
  end if;
  if coalesce(p_discount_percent,0) < 0 or coalesce(p_discount_percent,0) > 100 then
    raise exception using errcode='P0001', message='INVALID_DISCOUNT',
      detail=format('La remise globale doit être entre 0 et 100 %% (reçu : %s).', p_discount_percent);
  end if;

  for v_item in
    select value from jsonb_array_elements(p_items)
    order by value->>'product_id'
  loop
    v_product_id   := (v_item->>'product_id')::uuid;
    v_product_name := coalesce(v_item->>'product_name', v_product_id::text);
    v_quantity     := coalesce((v_item->>'quantity')::integer, 0);
    if v_quantity <= 0 then
      raise exception using errcode='P0001', message='INVALID_QUANTITY',
        detail=format('La quantité de "%s" doit être supérieure à 0 (reçu : %s).', v_product_name, v_quantity);
    end if;
    v_unit_price := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    if v_unit_price <= 0 then
      raise exception using errcode='P0001', message='INVALID_UNIT_PRICE',
        detail=format('Le prix unitaire de "%s" doit être supérieur à 0 GNF (reçu : %s).', v_product_name, v_unit_price);
    end if;
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    if v_item_discount < 0 or v_item_discount > 100 then
      raise exception using errcode='P0001', message='INVALID_ITEM_DISCOUNT',
        detail=format('La remise de "%s" doit être entre 0 et 100 %% (reçu : %s).', v_product_name, v_item_discount);
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

  for v_item in select value from jsonb_array_elements(p_items) loop
    v_unit_price    := coalesce((v_item->>'unit_price_gnf')::numeric, 0);
    v_quantity      := coalesce((v_item->>'quantity')::integer, 0);
    v_item_discount := coalesce((v_item->>'discount_percent')::numeric, 0);
    v_line_total    := round(v_unit_price * v_quantity * (1 - v_item_discount / 100.0), 2);
    v_subtotal      := v_subtotal + v_line_total;
  end loop;
  v_discount_amount := round(v_subtotal * (coalesce(p_discount_percent,0) / 100.0), 2);
  v_total           := v_subtotal - v_discount_amount;

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
        detail=format('Erreur critique de stock pour "%s". Contactez l''administrateur.', v_product_name);
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

  perform public.record_financial_transaction(
    p_source_type      := 'sale',
    p_source_id        := v_sale_row.id,
    p_client_id        := p_client_id,
    p_created_by       := p_created_by,
    p_amount_gnf       := v_total,
    p_display_currency := coalesce(p_display_currency, 'GNF'),
    p_exchange_rate    := coalesce(p_exchange_rate, 1),
    p_description      := 'Vente ' || coalesce(v_sale_row.reference, v_sale_row.id::text),
    p_status           := 'pending'
  );

  return jsonb_build_object(
    'sale',  row_to_json(v_sale_row)::jsonb,
    'items', v_items_result
  );

exception
  when sqlstate 'P0001' or sqlstate 'P0002' then raise;
  when others then
    raise exception using errcode='P0003', message='TRANSACTION_FAILED',
      detail=format('Une erreur est survenue. Veuillez réessayer. (%s)', sqlerrm);
end;
$$;

revoke execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  from public, anon;
grant execute on function public.create_sale_transaction(uuid,uuid,jsonb,text,uuid,numeric,text,numeric,text)
  to authenticated;
