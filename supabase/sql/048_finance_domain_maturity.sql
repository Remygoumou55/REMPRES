-- 048_finance_domain_maturity.sql
-- Bloc 3 Étape 2 : sync finance_journal_batches depuis approval_requests

begin;

create or replace function public.sync_finance_journal_from_approval_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
begin
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.status <> 'pending' or new.status = old.status then
    return new;
  end if;
  if new.entity_type is distinct from 'finance_journal_batch' then
    return new;
  end if;

  begin
    v_batch_id := new.entity_id::uuid;
  exception
    when invalid_text_representation then
      return new;
  end;

  if new.status = 'approved' then
    perform public.post_finance_journal_batch(v_batch_id);
  elsif new.status = 'rejected' then
    update public.finance_journal_batches
    set status = 'voided', updated_at = now()
    where id = v_batch_id and status = 'draft';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_sync_finance_journal_from_approval on public.approval_requests;
create trigger trg_sync_finance_journal_from_approval
after update on public.approval_requests
for each row
execute function public.sync_finance_journal_from_approval_request();

commit;
