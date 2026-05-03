-- =============================================================================
-- STEP 12 — Restaurer delete_expense_transaction (RPC Supabase / PostgREST)
-- =============================================================================
-- Si cette fonction n’existe pas en base, l’app renvoie :
--   "Could not find the function public.delete_expense_transaction(p_expense_id, p_user_id) in the schema cache"
-- Cette migration recrée la RPC attendue par lib/server/expenses.ts (soft delete).

create or replace function public.delete_expense_transaction(
  p_expense_id uuid,
  p_user_id    uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_row  public.expenses%rowtype;
  v_sum  text;
  v_ok   boolean;
  v_cat  text;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'Opération non autorisée';
  end if;

  select * into v_row
  from public.expenses
  where id = p_expense_id and deleted_at is null;

  if v_row.id is null then
    raise exception 'Dépense introuvable';
  end if;

  v_ok := p_user_id = v_row.created_by or public.is_super_admin();
  if not v_ok then
    raise exception 'Suppression interdite';
  end if;

  select c.name into v_cat from public.expense_categories c where c.id = v_row.category_id;

  update public.expenses
  set deleted_at = now(), updated_at = now()
  where id = p_expense_id;

  update public.financial_transactions
  set
    status = 'cancelled',
    updated_at = now()
  where source_type = 'expense' and source_id = p_expense_id;

  v_sum := 'Dépense supprimée : ' || (round(v_row.amount_gnf, 0))::bigint::text || ' GNF';

  insert into public.activity_logs (
    actor_user_id, module_key, action_key, target_table, target_id, metadata
  ) values (
    p_user_id, 'depenses', 'delete', 'expenses', p_expense_id::text,
    jsonb_build_object(
      'summary',     v_sum,
      'amount_gnf',  v_row.amount_gnf,
      'category_name', coalesce(v_cat, '—')
    )
  );

  return jsonb_build_object('id', p_expense_id, 'summary', v_sum);
end;
$$;

grant execute on function public.delete_expense_transaction(uuid, uuid) to authenticated;
