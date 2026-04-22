-- RemPres ERP - Seed profiles + permissions (Sprint 1)
-- Run after:
--   001_core_schema.sql
--   002_clients_schema.sql
--
-- Purpose:
-- - seed role-based permissions for module "clients" (and "vente" fallback)
-- - assign existing auth users to roles in public.profiles using their emails
-- - stay idempotent (safe to re-run)

begin;

-- -----------------------------------------------------------------------------
-- 1) Permissions matrix by role
-- -----------------------------------------------------------------------------
-- Notes:
-- - We seed module keys used by the app for Phase 1/2.
--   checks those two keys for now.
-- - You can tighten/extend this matrix later per module.

with role_permissions as (
  select *
  from (
    values
      -- role_key,                   can_create, can_read, can_update, can_delete, can_approve, can_export, can_assign, can_manage_users, can_manage_settings
      ('super_admin'::text,          true,       true,     true,       true,       true,        true,       true,       true,             true),
      ('directeur_general'::text,    false,      true,     false,      false,      true,        true,       false,      false,            false),
      ('responsable_vente'::text,    true,       true,     true,       true,       false,       true,       true,       false,            false),
      ('responsable_formation'::text,false,      false,    false,      false,      false,       false,      false,      false,            false),
      ('responsable_consultation'::text,false,   false,    false,      false,      false,       false,      false,      false,            false),
      ('responsable_rh'::text,       false,      false,    false,      false,      false,       false,      false,      false,            false),
      ('responsable_marketing'::text,false,      false,    false,      false,      false,       false,      false,      false,            false),
      ('responsable_logistique'::text,false,     false,    false,      false,      false,       false,      false,      false,            false),
      ('comptable'::text,            false,      true,     false,      false,      false,       true,       false,      false,            false),
      ('employe'::text,              false,      true,     false,      false,      false,       false,      false,      false,            false),
      ('auditeur'::text,             false,      true,     false,      false,      false,       true,       false,      false,            false)
  ) as t(
    role_key,
    can_create,
    can_read,
    can_update,
    can_delete,
    can_approve,
    can_export,
    can_assign,
    can_manage_users,
    can_manage_settings
  )
),
target_modules as (
  select unnest(array['clients'::text, 'produits'::text, 'vente'::text]) as module_key
)
insert into public.permissions (
  role_key,
  module_key,
  can_create,
  can_read,
  can_update,
  can_delete,
  can_approve,
  can_export,
  can_assign,
  can_manage_users,
  can_manage_settings,
  deleted_at
)
select
  rp.role_key,
  tm.module_key,
  rp.can_create,
  rp.can_read,
  rp.can_update,
  rp.can_delete,
  rp.can_approve,
  rp.can_export,
  rp.can_assign,
  rp.can_manage_users,
  rp.can_manage_settings,
  null
from role_permissions rp
cross join target_modules tm
on conflict (role_key, module_key) do update
set can_create = excluded.can_create,
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

-- -----------------------------------------------------------------------------
-- 2) Profiles assignment by email
-- -----------------------------------------------------------------------------
-- Update these emails to match real users in auth.users.
-- Only existing auth users are inserted/updated.

with user_role_map as (
  select *
  from (
    values
      ('remygoumou55@gmail.com'::text, 'super_admin'::text),
      -- Examples (replace/remove as needed):
      ('vente@rempres.local'::text, 'responsable_vente'::text),
      ('audit@rempres.local'::text, 'auditeur'::text),
      ('compta@rempres.local'::text, 'comptable'::text)
  ) as t(email, role_key)
),
existing_users as (
  select
    u.id,
    lower(u.email) as email
  from auth.users u
  where u.email is not null
),
target_users as (
  select
    eu.id,
    urm.email,
    urm.role_key
  from user_role_map urm
  join existing_users eu
    on eu.email = lower(urm.email)
)
insert into public.profiles (
  id,
  email,
  role_key,
  is_active,
  deleted_at
)
select
  tu.id,
  tu.email,
  tu.role_key,
  true,
  null
from target_users tu
on conflict (id) do update
set email = excluded.email,
    role_key = excluded.role_key,
    is_active = true,
    deleted_at = null,
    updated_at = now();

commit;
