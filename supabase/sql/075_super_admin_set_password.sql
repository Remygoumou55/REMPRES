-- ============================================================================
-- 075_super_admin_set_password.sql
--
-- Force la définition d'un nouveau mot de passe pour le Super Admin
-- DIRECTEMENT en base, sans passer par les emails Supabase (donc sans
-- déclencher le rate-limit).
--
-- ⚠️  À UTILISER UNIQUEMENT EN SITUATION DE RÉCUPÉRATION (oubli du mot de
--    passe Super Admin, rate-limit email, SMTP indisponible). Le hash bcrypt
--    généré est strictement compatible avec Supabase Auth.
--
-- Exécution : Supabase Studio → SQL Editor → coller tout le bloc → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Paramètres — MODIFIER ces deux valeurs avant d'exécuter.
--    👉  __sa_email() = email du Super Admin
--    👉  __sa_new_password() = mot de passe désiré (≥ 8 caractères, mélangez
--        lettres / chiffres / symboles pour passer la validation Supabase).
-- ---------------------------------------------------------------------------

create or replace function pg_temp.__sa_email() returns text
language sql immutable as $$
  select lower(trim('remygoumou55@gmail.com'))
$$;

create or replace function pg_temp.__sa_new_password() returns text
language sql immutable as $$
  select 'RemPres2026!Admin'
$$;

-- ---------------------------------------------------------------------------
-- 1) Vérifications préalables
-- ---------------------------------------------------------------------------

do $$
declare
  v_email    text := pg_temp.__sa_email();
  v_password text := pg_temp.__sa_new_password();
  v_uid      uuid;
begin
  -- 1.a  pgcrypto disponible ?
  if not exists (
    select 1 from pg_extension where extname = 'pgcrypto'
  ) then
    raise exception '⛔  L''extension pgcrypto n''est pas activée. '
      'Active-la via Supabase Dashboard → Database → Extensions → "pgcrypto".';
  end if;

  -- 1.b  Mot de passe assez long ?
  if length(v_password) < 8 then
    raise exception '⛔  Mot de passe trop court (% caractères, minimum 8).',
      length(v_password);
  end if;

  -- 1.c  Compte auth.users présent ?
  select id into v_uid from auth.users where lower(email) = v_email limit 1;
  if v_uid is null then
    raise exception '⛔  Aucun compte auth.users pour %.', v_email;
  end if;

  raise notice '✅  Compte cible : % (uid=%)', v_email, v_uid;
  raise notice '✅  Nouveau mot de passe : % caractères', length(v_password);
end
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 2) Mise à jour de auth.users.encrypted_password (bcrypt)
--    Supabase Auth attend un hash bcrypt — exactement ce que produit
--    crypt(password, gen_salt('bf')) avec pgcrypto.
--    On confirme aussi l'email pour éviter le blocage "email not confirmed".
-- ---------------------------------------------------------------------------

update auth.users
set
  encrypted_password = crypt(pg_temp.__sa_new_password(), gen_salt('bf')),
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  updated_at = now()
where lower(email) = pg_temp.__sa_email();

-- ---------------------------------------------------------------------------
-- 3) Re-vérifications post-update
-- ---------------------------------------------------------------------------

select
  '=== Compte Super Admin (après reset) ===' as section,
  au.id::text                                as auth_user_id,
  au.email                                   as email,
  (au.encrypted_password is not null
     and length(au.encrypted_password) > 0)  as has_password,
  au.email_confirmed_at                      as email_confirmed_at,
  au.updated_at                              as updated_at,
  p.role_key                                 as profile_role_key,
  p.is_active                                as profile_is_active,
  p.deleted_at                               as profile_deleted_at
from auth.users au
left join public.profiles p on p.id = au.id
where lower(au.email) = pg_temp.__sa_email();

-- ============================================================================
-- ÉTAPES SUIVANTES
--
-- 1) Ouvre https://rempres.com/login
-- 2) Email   : la valeur de __sa_email() (par défaut remygoumou55@gmail.com)
-- 3) Mot de passe : la valeur de __sa_new_password() (par défaut
--    RemPres2026!Admin)
-- 4) Une fois connecté, change-le immédiatement depuis ton profil pour le
--    remplacer par une valeur connue de toi seul.
--
-- Si l'application affiche "Email ou mot de passe incorrect" :
--   - Vérifier que le profil n'est pas désactivé : lance d'abord
--     supabase/sql/074_super_admin_recovery.sql.
--   - Vérifier que la session navigateur n'a pas un ancien token : ouvrir
--     /login en navigation privée.
-- ============================================================================
