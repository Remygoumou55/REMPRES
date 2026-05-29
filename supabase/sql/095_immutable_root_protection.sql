-- RemPres ERP — Phase 3 : protection root immuable (DB)
-- Prérequis : 093_system_authority.sql

-- ─── Compteur autorité ROOT stricte ──────────────────────────────────────────

create or replace function public.count_active_strict_root_profiles()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.profiles p
  where p.deleted_at is null
    and p.is_active = true
    and upper(trim(coalesce(p.system_authority, ''))) = 'ROOT';
$$;

-- ─── Trigger renforcé ────────────────────────────────────────────────────────

create or replace function public.profiles_enforce_root_protection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_was_root boolean;
  v_is_root boolean;
  v_active_roots integer;
  v_strict_roots integer;
  v_old_strict boolean;
  v_new_strict boolean;
begin
  if tg_op = 'INSERT' then
    if public.profile_has_root_authority(new.role_key, new.system_authority) then
      new.role_key := 'super_admin';
      new.department_key := null;
      if coalesce(new.system_authority, 'NONE') = 'NONE' then
        new.system_authority := 'SUPER_ADMIN';
      end if;
    end if;
    return new;
  end if;

  v_was_root := public.profile_has_root_authority(old.role_key, old.system_authority);
  v_is_root := public.profile_has_root_authority(new.role_key, new.system_authority);
  v_old_strict := upper(trim(coalesce(old.system_authority, ''))) = 'ROOT';
  v_new_strict := upper(trim(coalesce(new.system_authority, ''))) = 'ROOT';

  if public.profile_has_root_authority(new.role_key, new.system_authority) then
    new.role_key := 'super_admin';
    new.department_key := null;
    if coalesce(new.system_authority, 'NONE') = 'NONE' then
      new.system_authority := coalesce(old.system_authority, 'SUPER_ADMIN');
    end if;
  end if;

  if v_was_root and not v_is_root then
    select public.count_active_root_profiles() into v_active_roots;
    if v_active_roots <= 1 then
      raise exception 'ROOT_PROTECTION: impossible de retirer le dernier compte root actif';
    end if;
  end if;

  if v_was_root and v_is_root and (new.is_active = false or new.deleted_at is not null) then
    select public.count_active_root_profiles() into v_active_roots;
    if v_active_roots <= 1 then
      raise exception 'ROOT_PROTECTION: impossible de désactiver ou supprimer le dernier compte root actif';
    end if;
  end if;

  if v_old_strict and not v_new_strict then
    select public.count_active_strict_root_profiles() into v_strict_roots;
    if v_strict_roots <= 1 then
      raise exception 'ROOT_PROTECTION: impossible de retirer l''autorité ROOT du dernier détenteur actif';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_root_protection on public.profiles;
create trigger trg_profiles_root_protection
before insert or update on public.profiles
for each row
execute function public.profiles_enforce_root_protection();

create index if not exists idx_profiles_system_authority_active
  on public.profiles (system_authority)
  where deleted_at is null and is_active = true;

comment on function public.count_active_strict_root_profiles() is
  'Phase 3 — nombre de profils actifs avec system_authority = ROOT.';
