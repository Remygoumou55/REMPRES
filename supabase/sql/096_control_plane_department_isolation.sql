-- RemPres ERP — Phase 4 : isolation control plane / department_key
-- Prérequis : 093_system_authority.sql
-- Corrige les profils plateforme qui auraient encore un department_key métier résiduel.

update public.profiles
set department_key = null
where department_key is not null
  and (
    upper(trim(coalesce(system_authority, ''))) in ('ROOT', 'SUPER_ADMIN')
    or lower(trim(coalesce(role_key, ''))) = 'super_admin'
  );
