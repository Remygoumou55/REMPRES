-- RemPres ERP — Phase 0 : autorité système indépendante + protection root immuable
-- Exécuter dans Supabase SQL Editor (production) après sauvegarde.

-- ─── 1. Colonne autorité système ─────────────────────────────────────────────

alter table public.profiles
  add column if not exists system_authority text not null default 'NONE';

alter table public.profiles
  drop constraint if exists profiles_system_authority_check;

alter table public.profiles
  add constraint profiles_system_authority_check
  check (system_authority in ('ROOT', 'SUPER_ADMIN', 'SYSTEM', 'NONE'));

comment on column public.profiles.system_authority is
  'Autorité plateforme indépendante des départements métiers (ROOT > SUPER_ADMIN > SYSTEM > NONE).';

-- ─── 2. Rétro-remplissage ───────────────────────────────────────────────────

update public.profiles
set system_authority = 'SUPER_ADMIN'
where deleted_at is null
  and is_active = true
  and role_key = 'super_admin'
  and system_authority = 'NONE';

-- Promouvoir le premier super_admin historique en ROOT (ajuster l’email si besoin)
update public.profiles
set system_authority = 'ROOT'
where id = (
  select id
  from public.profiles
  where deleted_at is null
    and is_active = true
    and role_key = 'super_admin'
  order by created_at asc
  limit 1
);

-- ─── 3. Fonctions autorité ──────────────────────────────────────────────────

create or replace function public.profile_has_root_authority(
  p_role_key text,
  p_system_authority text
)
returns boolean
language sql
immutable
as $$
  select coalesce(
    upper(trim(coalesce(p_system_authority, ''))) in ('ROOT', 'SUPER_ADMIN')
    or lower(trim(coalesce(p_role_key, ''))) = 'super_admin'
    or replace(lower(trim(coalesce(p_role_key, ''))), '-', '') = 'superadmin',
    false
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select public.profile_has_root_authority(p.role_key, p.system_authority)
      from public.profiles p
      where p.id = auth.uid()
        and p.deleted_at is null
        and p.is_active = true
      limit 1
    ),
    false
  );
$$;

create or replace function public.count_active_root_profiles()
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
    and public.profile_has_root_authority(p.role_key, p.system_authority);
$$;

-- ─── 4. Trigger protection root ─────────────────────────────────────────────

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

  return new;
end;
$$;

drop trigger if exists trg_profiles_root_protection on public.profiles;
create trigger trg_profiles_root_protection
before insert or update on public.profiles
for each row
execute function public.profiles_enforce_root_protection();

-- ─── 5. Restauration d’urgence (service role / SQL Editor uniquement) ───────

create or replace function public.restore_profile_root_authority(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    raise exception 'restore_profile_root_authority: user_id requis';
  end if;

  update public.profiles
  set
    role_key = 'super_admin',
    department_key = null,
    system_authority = 'ROOT',
    is_active = true,
    deleted_at = null,
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'restore_profile_root_authority: profil introuvable %', p_user_id;
  end if;
end;
$$;

revoke all on function public.restore_profile_root_authority(uuid) from public;
grant execute on function public.restore_profile_root_authority(uuid) to service_role;

-- ─── 6. RÉCUPÉRATION MANUELLE (remplacer l’email) ───────────────────────────
-- select id, email, role_key, department_key, system_authority from public.profiles where email ilike '%VOTRE_EMAIL%';
-- select public.restore_profile_root_authority(id) from public.profiles where email ilike '%VOTRE_EMAIL%' limit 1;
