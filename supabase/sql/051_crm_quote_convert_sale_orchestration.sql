-- 051_crm_quote_convert_sale_orchestration.sql
-- B2.2 : conversion devis accepté → vente atomique (create_sale_transaction + liaisons FK).

begin;

create or replace function public.convert_crm_quote_to_sale(
  p_quote_id        uuid,
  p_seller_id       uuid,
  p_created_by      uuid,
  p_payment_method  text default 'cash',
  p_notes           text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_quote           public.crm_quotes%rowtype;
  v_line            record;
  v_items           jsonb := '[]'::jsonb;
  v_qty             integer;
  v_result          jsonb;
  v_sale_id         uuid;
  v_product_name    text;
  v_product_sku     text;
begin
  if p_quote_id is null then
    raise exception using errcode='P0001', message='INVALID_QUOTE',
      detail='Devis invalide.';
  end if;
  if p_seller_id is null or p_created_by is null then
    raise exception using errcode='P0001', message='MISSING_ACTOR',
      detail='Vendeur et créateur obligatoires.';
  end if;

  select * into v_quote
  from public.crm_quotes
  where id = p_quote_id
    and deleted_at is null
  for update;

  if not found then
    raise exception using errcode='P0001', message='QUOTE_NOT_FOUND',
      detail='Devis introuvable.';
  end if;

  if v_quote.status is distinct from 'accepted' then
    raise exception using errcode='P0001', message='QUOTE_NOT_ACCEPTED',
      detail=format('Le devis doit être au statut accepted (actuel : %s).', v_quote.status);
  end if;

  if v_quote.sale_id is not null then
    raise exception using errcode='P0001', message='QUOTE_ALREADY_CONVERTED',
      detail='Ce devis est déjà lié à une vente.';
  end if;

  for v_line in
    select
      l.product_id,
      l.description,
      l.quantity,
      l.unit_price_gnf,
      p.name as product_name,
      p.sku as product_sku
    from public.crm_quote_lines l
    left join public.products p on p.id = l.product_id
    where l.quote_id = p_quote_id
    order by l.line_order, l.created_at
  loop
    if v_line.product_id is null then
      raise exception using errcode='P0001', message='QUOTE_LINE_NO_PRODUCT',
        detail='Chaque ligne du devis doit référencer un produit pour la conversion (stock).';
    end if;

    v_qty := greatest(1, round(v_line.quantity)::integer);
    v_product_name := coalesce(nullif(trim(v_line.description), ''), v_line.product_name, v_line.product_id::text);
    v_product_sku := v_line.product_sku;

    v_items := v_items || jsonb_build_array(
      jsonb_build_object(
        'product_id', v_line.product_id,
        'product_name', v_product_name,
        'product_sku', v_product_sku,
        'quantity', v_qty,
        'unit_price_gnf', v_line.unit_price_gnf,
        'discount_percent', 0
      )
    );
  end loop;

  if jsonb_array_length(v_items) = 0 then
    raise exception using errcode='P0001', message='QUOTE_EMPTY',
      detail='Le devis ne contient aucune ligne.';
  end if;

  v_result := public.create_sale_transaction(
    p_seller_id,
    p_created_by,
    v_items,
    coalesce(nullif(trim(p_payment_method), ''), 'cash'),
    v_quote.client_id,
    0,
    coalesce(v_quote.currency, 'GNF'),
    1,
    coalesce(nullif(trim(p_notes), ''), v_quote.notes)
  );

  v_sale_id := (v_result->'sale'->>'id')::uuid;

  if v_sale_id is null then
    raise exception using errcode='P0003', message='SALE_CREATE_FAILED',
      detail='Création de vente impossible lors de la conversion.';
  end if;

  update public.sales
  set
    crm_quote_id = p_quote_id,
    crm_opportunity_id = coalesce(crm_opportunity_id, v_quote.opportunity_id),
    updated_at = now()
  where id = v_sale_id;

  update public.crm_quotes
  set
    sale_id = v_sale_id,
    status = 'converted',
    updated_at = now()
  where id = p_quote_id;

  return jsonb_build_object(
    'quote_id', p_quote_id,
    'sale_id', v_sale_id,
    'sale', v_result->'sale',
    'items', v_result->'items'
  );
exception
  when sqlstate 'P0001' or sqlstate 'P0002' then raise;
  when others then
    raise exception using errcode='P0003', message='QUOTE_CONVERT_FAILED',
      detail=format('Conversion devis→vente échouée. (%s)', sqlerrm);
end;
$$;

comment on function public.convert_crm_quote_to_sale(uuid, uuid, uuid, text, text) is
  'B2.2 — Orchestre accepted → sale (RPC vente) + crm_quotes.sale_id + sales.crm_quote_id + status converted.';

revoke execute on function public.convert_crm_quote_to_sale(uuid, uuid, uuid, text, text) from public, anon;
grant execute on function public.convert_crm_quote_to_sale(uuid, uuid, uuid, text, text) to authenticated;

commit;
