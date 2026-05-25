-- 047_rh_domain_completion.sql
-- Bloc 3 Étape 1 : types congés ERP + sync approval → rh_leave_requests

begin;

-- Types congés : annual | sick | special | unpaid (migration paid/exceptional)
alter table public.rh_leave_requests drop constraint if exists rh_leave_requests_leave_type_check;

update public.rh_leave_requests
set leave_type = case leave_type
  when 'paid' then 'annual'
  when 'exceptional' then 'special'
  else leave_type
end
where leave_type in ('paid', 'exceptional');

alter table public.rh_leave_requests
  add constraint rh_leave_requests_leave_type_check
  check (leave_type in ('annual', 'sick', 'special', 'unpaid'));

create or replace function public.sync_rh_leave_from_approval_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_leave_id uuid;
  v_actor uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status <> 'pending' or new.status = old.status then
    return new;
  end if;
  if new.entity_type is distinct from 'leave_request' then
    return new;
  end if;

  begin
    v_leave_id := new.entity_id::uuid;
  exception
    when invalid_text_representation then
      return new;
  end;

  v_actor := coalesce(new.approved_by, new.requested_by);

  if new.status = 'approved' then
    update public.rh_leave_requests l
    set
      status = 'approved',
      approval_request_id = new.id
    where l.id = v_leave_id
      and l.status = 'pending';
  elsif new.status = 'rejected' then
    update public.rh_leave_requests l
    set
      status = 'rejected',
      approval_request_id = new.id
    where l.id = v_leave_id
      and l.status = 'pending';
  elsif new.status = 'expired' then
    update public.rh_leave_requests l
    set status = 'cancelled'
    where l.id = v_leave_id
      and l.status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_rh_leave_from_approval on public.approval_requests;
create trigger trg_sync_rh_leave_from_approval
after update on public.approval_requests
for each row
execute function public.sync_rh_leave_from_approval_request();

commit;
