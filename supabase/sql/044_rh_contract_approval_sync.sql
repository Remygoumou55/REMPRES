-- 044_rh_contract_approval_sync.sql
-- Synchronise rh_employee_contracts lorsque approval_requests passe à approved/rejected
-- pour entity_type = 'rh_contract' (lien gouvernance sans refactor du centre d'approbation).

begin;

create or replace function public.sync_rh_contract_from_approval_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contract_id uuid;
  v_actor uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status <> 'pending' or new.status = old.status then
    return new;
  end if;
  if new.entity_type is distinct from 'rh_contract' then
    return new;
  end if;

  begin
    v_contract_id := new.entity_id::uuid;
  exception
    when invalid_text_representation then
      return new;
  end;

  v_actor := coalesce(new.approved_by, new.requested_by);

  if new.status = 'approved' then
    update public.rh_employee_contracts c
    set
      status = 'active',
      updated_by = new.approved_by,
      approval_request_id = new.id
    where c.id = v_contract_id
      and c.status = 'pending_approval';

    insert into public.rh_contract_history (contract_id, event_type, event_label, payload, created_by)
    values (
      v_contract_id,
      'approval_granted',
      'Contrat approuvé (gouvernance)',
      jsonb_build_object(
        'approval_request_id', new.id,
        'approved_by', new.approved_by
      ),
      v_actor
    );
  elsif new.status = 'rejected' then
    update public.rh_employee_contracts c
    set
      status = 'draft',
      updated_by = new.requested_by,
      approval_request_id = new.id
    where c.id = v_contract_id
      and c.status = 'pending_approval';

    insert into public.rh_contract_history (contract_id, event_type, event_label, payload, created_by)
    values (
      v_contract_id,
      'approval_rejected',
      'Contrat rejeté — retour brouillon',
      jsonb_build_object(
        'approval_request_id', new.id,
        'rejection_reason', new.rejection_reason
      ),
      v_actor
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_rh_contract_from_approval on public.approval_requests;
create trigger trg_sync_rh_contract_from_approval
after update on public.approval_requests
for each row
execute function public.sync_rh_contract_from_approval_request();

commit;
