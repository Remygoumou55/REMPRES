-- RemPres ERP — suppression définitive des fiches déjà archivées (administration globale).
-- Les DELETE directs sont bloqués par la RLS ; ces fonctions SECURITY DEFINER appliquent les règles métier.

begin;

create or replace function public.admin_permanently_delete_archived_client(p_client_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if not public.is_admin_role() then
    raise exception 'Accès refusé';
  end if;
  if p_client_id is null then
    raise exception 'Client invalide';
  end if;
  if not exists (
    select 1
    from public.clients c
    where c.id = p_client_id
      and c.deleted_at is not null
  ) then
    raise exception 'Client introuvable ou non archivé';
  end if;

  delete from public.clients
  where id = p_client_id
    and deleted_at is not null;

  if not found then
    raise exception 'Suppression impossible';
  end if;
end;
$$;

comment on function public.admin_permanently_delete_archived_client(uuid) is
  'Supprime définitivement un client en suppression logique (rôles admin).';

create or replace function public.admin_permanently_delete_archived_product(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Non authentifié';
  end if;
  if not public.is_admin_role() then
    raise exception 'Accès refusé';
  end if;
  if p_product_id is null then
    raise exception 'Produit invalide';
  end if;
  if not exists (
    select 1
    from public.products p
    where p.id = p_product_id
      and p.deleted_at is not null
  ) then
    raise exception 'Produit introuvable ou non archivé';
  end if;

  delete from public.stock_movements
  where product_id = p_product_id;

  delete from public.products
  where id = p_product_id
    and deleted_at is not null;

  if not found then
    raise exception 'Suppression impossible';
  end if;
end;
$$;

comment on function public.admin_permanently_delete_archived_product(uuid) is
  'Supprime définitivement un produit archivé et ses mouvements de stock associés.';

revoke all on function public.admin_permanently_delete_archived_client(uuid) from public;
revoke all on function public.admin_permanently_delete_archived_product(uuid) from public;
grant execute on function public.admin_permanently_delete_archived_client(uuid) to authenticated;
grant execute on function public.admin_permanently_delete_archived_product(uuid) to authenticated;

commit;
