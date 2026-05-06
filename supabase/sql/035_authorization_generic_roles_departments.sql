-- RemPres ERP — Rôles génériques, table departments, permissions et RLS cohérents.
-- Exécuter après 034_erp_sale_lifecycle_and_audit.sql.
--
-- Principes :
--  • Rôle métier générique (super_admin, manager, agent, auditor, accountant) — plus de « responsable_* » dans profiles.
--  • Département = entité normalisée (departments) ; profiles.department_id + department_key synchronisés.
--  • is_admin_role() = super_admin OU manager du département ADMINISTRATION (pilotage global type ex-DG).
--  • user_has_module_permission = union sur role_key du profil uniquement (plus de double lecture canonical ambiguë).

begin;

-- ---------------------------------------------------------------------------
-- 1) Table departments
-- ---------------------------------------------------------------------------

create table if not exists public.departments (
  id         uuid primary key default gen_random_uuid(),
  key        text not null unique,
  label      text not null,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.departments is
  'Référentiel départements — indépendant des rôles applicatifs.';

insert into public.departments (key, label)
values
  ('VENTE', 'Vente'),
  ('FINANCE', 'Finance'),
  ('RH', 'Ressources humaines'),
  ('FORMATION', 'Formation'),
  ('CONSULTATION', 'Consultation'),
  ('MARKETING', 'Marketing'),
  ('LOGISTIQUE', 'Logistique'),
  ('ADMINISTRATION', 'Administration'),
  ('AUDIT', 'Audit interne')
on conflict (key) do update
set label = excluded.label,
    active = excluded.active;

alter table public.departments enable row level security;

drop policy if exists departments_select_authenticated on public.departments;
create policy departments_select_authenticated
on public.departments
for select
to authenticated
using (true);

-- ---------------------------------------------------------------------------
-- 2) profiles.department_id + trigger synchro department_key / résolution depuis department_key texte
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists department_id uuid references public.departments(id) on delete set null;

create index if not exists idx_profiles_department_id on public.profiles (department_id);

create or replace function public.profiles_normalize_department()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  if new.role_key = 'super_admin' then
    new.department_id := null;
    new.department_key := null;
    return new;
  end if;

  if new.department_id is not null
     and (tg_op = 'INSERT' or new.department_id is distinct from old.department_id) then
    select d.key into v_key from public.departments d where d.id = new.department_id;
    new.department_key := v_key;
    return new;
  end if;

  if new.department_key is not null and trim(new.department_key) <> '' then
    select d.id, d.key into new.department_id, new.department_key
    from public.departments d
    where lower(trim(d.key)) = lower(trim(new.department_key))
      and d.active
    limit 1;
    return new;
  end if;

  new.department_id := null;
  new.department_key := null;
  return new;
end;
$$;

drop trigger if exists trg_profiles_normalize_department on public.profiles;
create trigger trg_profiles_normalize_department
before insert or update on public.profiles
for each row
execute function public.profiles_normalize_department();

-- Backfill department_id depuis department_key existant (insensible à la casse / espaces).
update public.profiles p
set department_id = d.id
from public.departments d
where p.department_id is null
  and p.department_key is not null
  and trim(p.department_key) <> ''
  and lower(trim(d.key)) = lower(trim(p.department_key));

-- Synonymes courants issus de l’UI historique.
update public.profiles p
set department_id = d.id
from public.departments d
where p.department_id is null
  and p.department_key is not null
  and lower(trim(p.department_key)) = 'direction'
  and d.key = 'ADMINISTRATION';

update public.profiles p
set department_id = d.id
from public.departments d
where p.department_id is null
  and p.department_key is not null
  and lower(trim(p.department_key)) in ('vente', 'finance', 'rh', 'formation', 'consultation', 'marketing', 'logistique')
  and lower(trim(d.key)) = lower(trim(p.department_key));

-- Départements par ancien rôle (si department_id encore absent).
update public.profiles p
set department_id = sub.did
from (
  select p2.id,
    case p2.role_key
      when 'directeur_general' then (select id from public.departments where key = 'ADMINISTRATION')
      when 'responsable_vente' then (select id from public.departments where key = 'VENTE')
      when 'responsable_rh' then (select id from public.departments where key = 'RH')
      when 'responsable_formation' then (select id from public.departments where key = 'FORMATION')
      when 'responsable_consultation' then (select id from public.departments where key = 'CONSULTATION')
      when 'responsable_marketing' then (select id from public.departments where key = 'MARKETING')
      when 'responsable_logistique' then (select id from public.departments where key = 'LOGISTIQUE')
      when 'comptable' then (select id from public.departments where key = 'FINANCE')
      when 'auditeur' then (select id from public.departments where key = 'AUDIT')
      else null
    end as did
  from public.profiles p2
) sub
where p.id = sub.id
  and sub.did is not null
  and p.department_id is null;

update public.profiles
set department_id = (select id from public.departments where key = 'ADMINISTRATION')
where role_key = 'employe'
  and department_id is null;

-- ---------------------------------------------------------------------------
-- 3) Rôles génériques dans app_roles
-- ---------------------------------------------------------------------------

insert into public.app_roles (key, label)
values
  ('manager', 'Manager'),
  ('agent', 'Agent'),
  ('auditor', 'Auditeur'),
  ('accountant', 'Comptable')
on conflict (key) do update set label = excluded.label;

-- ---------------------------------------------------------------------------
-- 4) Agrégation des permissions vers les rôles génériques (sans perdre les droits)
-- ---------------------------------------------------------------------------

insert into public.permissions (
  role_key, module_key,
  can_create, can_read, can_update, can_delete,
  can_approve, can_export, can_assign, can_manage_users, can_manage_settings,
  deleted_at
)
select
  'manager'::text,
  module_key,
  bool_or(can_create),
  bool_or(can_read),
  bool_or(can_update),
  bool_or(can_delete),
  bool_or(can_approve),
  bool_or(can_export),
  bool_or(can_assign),
  bool_or(can_manage_users),
  bool_or(can_manage_settings),
  null
from public.permissions
where deleted_at is null
  and role_key in (
    'directeur_general',
    'responsable_vente',
    'responsable_rh',
    'responsable_formation',
    'responsable_consultation',
    'responsable_marketing',
    'responsable_logistique',
    'manager',
    'admin'
  )
group by module_key
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_assign = excluded.can_assign,
  can_manage_users = excluded.can_manage_users,
  can_manage_settings = excluded.can_manage_settings,
  deleted_at = null,
  updated_at = now();

insert into public.permissions (
  role_key, module_key,
  can_create, can_read, can_update, can_delete,
  can_approve, can_export, can_assign, can_manage_users, can_manage_settings,
  deleted_at
)
select
  'accountant'::text,
  module_key,
  bool_or(can_create),
  bool_or(can_read),
  bool_or(can_update),
  bool_or(can_delete),
  bool_or(can_approve),
  bool_or(can_export),
  bool_or(can_assign),
  bool_or(can_manage_users),
  bool_or(can_manage_settings),
  null
from public.permissions
where deleted_at is null
  and role_key in ('comptable', 'accountant')
group by module_key
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_assign = excluded.can_assign,
  can_manage_users = excluded.can_manage_users,
  can_manage_settings = excluded.can_manage_settings,
  deleted_at = null,
  updated_at = now();

insert into public.permissions (
  role_key, module_key,
  can_create, can_read, can_update, can_delete,
  can_approve, can_export, can_assign, can_manage_users, can_manage_settings,
  deleted_at
)
select
  'auditor'::text,
  module_key,
  bool_or(can_create),
  bool_or(can_read),
  bool_or(can_update),
  bool_or(can_delete),
  bool_or(can_approve),
  bool_or(can_export),
  bool_or(can_assign),
  bool_or(can_manage_users),
  bool_or(can_manage_settings),
  null
from public.permissions
where deleted_at is null
  and role_key in ('auditeur', 'auditor')
group by module_key
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_assign = excluded.can_assign,
  can_manage_users = excluded.can_manage_users,
  can_manage_settings = excluded.can_manage_settings,
  deleted_at = null,
  updated_at = now();

insert into public.permissions (
  role_key, module_key,
  can_create, can_read, can_update, can_delete,
  can_approve, can_export, can_assign, can_manage_users, can_manage_settings,
  deleted_at
)
select
  'agent'::text,
  module_key,
  bool_or(can_create),
  bool_or(can_read),
  bool_or(can_update),
  bool_or(can_delete),
  bool_or(can_approve),
  bool_or(can_export),
  bool_or(can_assign),
  bool_or(can_manage_users),
  bool_or(can_manage_settings),
  null
from public.permissions
where deleted_at is null
  and role_key in ('employe', 'agent')
group by module_key
on conflict (role_key, module_key) do update
set
  can_create = excluded.can_create,
  can_read = excluded.can_read,
  can_update = excluded.can_update,
  can_delete = excluded.can_delete,
  can_approve = excluded.can_approve,
  can_export = excluded.can_export,
  can_assign = excluded.can_assign,
  can_manage_users = excluded.can_manage_users,
  can_manage_settings = excluded.can_manage_settings,
  deleted_at = null,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5) Migration des profils (role_key générique)
-- ---------------------------------------------------------------------------

update public.profiles
set role_key = 'manager'
where role_key in (
  'directeur_general',
  'responsable_vente',
  'responsable_rh',
  'responsable_formation',
  'responsable_consultation',
  'responsable_marketing',
  'responsable_logistique'
);

update public.profiles set role_key = 'accountant' where role_key = 'comptable';
update public.profiles set role_key = 'auditor' where role_key = 'auditeur';
update public.profiles set role_key = 'agent' where role_key = 'employe';

-- ---------------------------------------------------------------------------
-- 6) Nettoyage anciennes lignes permissions / rôles legacy
-- ---------------------------------------------------------------------------

delete from public.permissions
where role_key in (
  'admin',
  'directeur_general',
  'responsable_vente',
  'responsable_rh',
  'responsable_formation',
  'responsable_consultation',
  'responsable_marketing',
  'responsable_logistique',
  'comptable',
  'auditeur',
  'employe'
);

delete from public.app_roles
where key in (
  'admin',
  'directeur_general',
  'responsable_vente',
  'responsable_rh',
  'responsable_formation',
  'responsable_consultation',
  'responsable_marketing',
  'responsable_logistique',
  'comptable',
  'auditeur',
  'employe'
);

-- ---------------------------------------------------------------------------
-- 7) Fonctions RLS : permissions et administration console
-- ---------------------------------------------------------------------------

create or replace function public.current_user_canonical_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.role_key = 'super_admin' then 'admin'
    when p.role_key = 'manager'
      and exists (
        select 1
        from public.departments d
        where d.id = p.department_id
          and d.key = 'ADMINISTRATION'
      )
    then 'admin'
    when p.role_key in ('manager', 'accountant', 'auditor') then 'manager'
    else 'agent'
  end
  from public.profiles p
  where p.id = auth.uid()
    and p.deleted_at is null
  limit 1;
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles p
      join public.departments d on d.id = p.department_id
      where p.id = auth.uid()
        and p.deleted_at is null
        and p.role_key = 'manager'
        and d.key = 'ADMINISTRATION'
    );
$$;

create or replace function public.user_has_module_permission(module_name text, action_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
    or exists (
      select 1
      from public.profiles pr
      inner join public.permissions pm
        on pm.role_key = pr.role_key
       and pm.module_key = module_name
       and pm.deleted_at is null
      where pr.id = auth.uid()
        and pr.deleted_at is null
        and (
          (action_name = 'read' and pm.can_read = true)
          or (action_name = 'create' and pm.can_create = true)
          or (action_name = 'update' and pm.can_update = true)
          or (action_name = 'delete' and pm.can_delete = true)
        )
    );
$$;

-- ---------------------------------------------------------------------------
-- 8) Invitation : trigger auth.users — rôle générique + département résolu
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user_invite()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_role_key   text;
  v_first_name text;
  v_last_name  text;
  v_dept_key   text;
  v_dept_id    uuid;
begin
  v_role_key := coalesce(nullif(trim(new.raw_user_meta_data->>'role_key'), ''), 'agent');
  v_first_name := coalesce(new.raw_user_meta_data->>'first_name', '');
  v_last_name := coalesce(new.raw_user_meta_data->>'last_name', '');
  v_dept_key := nullif(trim(new.raw_user_meta_data->>'department_key'), '');

  if not exists (select 1 from public.app_roles where key = v_role_key) then
    v_role_key := 'agent';
  end if;

  v_dept_id := null;
  if v_dept_key is not null then
    select d.id into v_dept_id
    from public.departments d
    where lower(trim(d.key)) = lower(trim(v_dept_key))
      and d.active
    limit 1;
  end if;

  insert into public.profiles (
    id,
    email,
    first_name,
    last_name,
    role_key,
    department_key,
    department_id,
    is_active,
    deleted_at
  )
  values (
    new.id,
    lower(new.email),
    v_first_name,
    v_last_name,
    v_role_key,
    v_dept_key,
    v_dept_id,
    true,
    null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

commit;
