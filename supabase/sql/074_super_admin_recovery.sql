-- ============================================================================
-- 074_super_admin_recovery.sql
--
-- Script de réparation DATA-ONLY (aucune modification de schéma, aucune
-- modification de code applicatif).
--
-- Objectifs :
--   1. Restaurer un compte Super Admin opérationnel pour
--      `remygoumou55@gmail.com` (ou tout autre email, à modifier ci-dessous).
--   2. Resynchroniser `department_id` ↔ `department_key` sur l'ensemble des
--      profils existants, en relançant le trigger officiel
--      `profiles_normalize_department` sur chaque ligne. Aucune donnée
--      fonctionnelle n'est altérée — seul l'alignement des deux colonnes est
--      remis en cohérence.
--   3. Afficher l'état final (Super Admin + tous les profils + drift résiduel).
--
-- ⚠️  Ce script ne touche PAS à `auth.users.encrypted_password`. La gestion
--    du mot de passe Super Admin doit passer par :
--      a) la page publique `/forgot-password` (recommandé), OU
--      b) Supabase Dashboard → Authentication → Users → "Send password
--         recovery".
--
-- Exécution : Supabase Studio → SQL Editor → coller tout le bloc → Run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0) Email du Super Admin à restaurer.
--    👉  MODIFIER ICI uniquement si tu veux cibler un autre compte.
--        Cet email est utilisé partout en bas du script.
-- ---------------------------------------------------------------------------

-- (Constante utilisée dans tout le script — référencée via la fonction
--  `__sa_email()` ci-dessous pour éviter toute duplication d'email.)
create or replace function pg_temp.__sa_email() returns text
language sql immutable as $$
  select lower(trim('remygoumou55@gmail.com'))
$$;

begin;

-- ---------------------------------------------------------------------------
-- 1) Vérification de l'existence du compte côté Supabase Auth
-- ---------------------------------------------------------------------------

do $$
declare
  v_auth_user_id uuid;
  v_email        text := pg_temp.__sa_email();
begin
  select id into v_auth_user_id
  from auth.users
  where lower(email) = v_email
  limit 1;

  if v_auth_user_id is null then
    raise notice '⛔  Aucun compte trouvé dans auth.users pour %.', v_email;
    raise notice '    Étapes manuelles requises :';
    raise notice '      - Supabase Dashboard → Authentication → Users → Add user';
    raise notice '      - Confirmer la création (et envoyer le mail de mot de passe)';
    raise notice '      - Puis relancer ce script pour synchroniser le profil';
    return;
  end if;

  raise notice '✅  auth.users OK pour % (id=%)', v_email, v_auth_user_id;
end
$$ language plpgsql;

-- ---------------------------------------------------------------------------
-- 2) Restauration du profil Super Admin (idempotent)
--    - role_key forcé à 'super_admin' (le trigger normalize annule ensuite
--      department_id / department_key, comportement attendu pour un SA).
--    - is_active = true, deleted_at = NULL.
--    - Si le profil n'existe pas du tout, on l'insère.
-- ---------------------------------------------------------------------------

with auth_row as (
  select id, lower(email) as email_lower
  from auth.users
  where lower(email) = pg_temp.__sa_email()
  limit 1
)
insert into public.profiles (
  id, email, first_name, last_name, role_key,
  department_key, department_id, is_active, deleted_at
)
select
  ar.id,
  ar.email_lower,
  coalesce(p.first_name, 'Super'),
  coalesce(p.last_name,  'Admin'),
  'super_admin',
  null,
  null,
  true,
  null
from auth_row ar
left join public.profiles p on p.id = ar.id
on conflict (id) do update set
  role_key       = 'super_admin',
  department_key = null,
  department_id  = null,
  is_active      = true,
  deleted_at     = null,
  email          = excluded.email,
  updated_at     = now();

-- ---------------------------------------------------------------------------
-- 3) Resynchronisation department_id ↔ department_key pour TOUS les profils
--    UPDATE neutre qui force le trigger normalize à recalculer chaque ligne.
--    Aucune donnée fonctionnelle n'est modifiée.
-- ---------------------------------------------------------------------------

update public.profiles
set updated_at = now()
where deleted_at is null;

commit;

-- ============================================================================
-- AUDITS (lectures seules — exécutées hors transaction)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 4) Audit — Super Admin
-- ---------------------------------------------------------------------------

select
  '=== Super Admin ===' as section,
  p.id::text            as profile_id,
  p.email               as email,
  p.role_key            as role_key,
  p.department_key      as department_key,
  p.is_active           as is_active,
  p.deleted_at          as deleted_at,
  au.email_confirmed_at as email_confirmed_at,
  au.last_sign_in_at    as last_sign_in_at
from public.profiles p
join auth.users au on au.id = p.id
where lower(p.email) = pg_temp.__sa_email();

-- ---------------------------------------------------------------------------
-- 5) Audit — tous les profils actifs avec leur département effectif.
--    À utiliser pour vérifier qu'aucun utilisateur n'est sur un département
--    qui ne correspond pas à son rôle attendu.
-- ---------------------------------------------------------------------------

select
  '=== Profils actifs ===' as section,
  p.email                   as email,
  p.role_key                as role_key,
  p.department_key          as department_key,
  d.label                   as department_label,
  p.is_active               as is_active,
  au.last_sign_in_at        as last_sign_in_at
from public.profiles p
left join public.departments d on d.id = p.department_id
join auth.users au on au.id = p.id
where p.deleted_at is null
order by
  case when p.role_key = 'super_admin' then 0 else 1 end,
  p.department_key nulls last,
  p.email;

-- ---------------------------------------------------------------------------
-- 6) Détecteur de drift résiduel — doit retourner 0 ligne après ce script.
--    Si une ligne apparaît ici, c'est qu'un `department_key` ne correspond
--    plus à aucune ligne active de `public.departments`. Dans ce cas,
--    rouvrir Paramètres → Utilisateurs et réaffecter manuellement.
-- ---------------------------------------------------------------------------

select
  '=== Drift détecté ===' as section,
  p.email,
  p.role_key,
  p.department_key,
  p.department_id
from public.profiles p
left join public.departments d on d.id = p.department_id
where p.deleted_at is null
  and p.role_key <> 'super_admin'
  and (
    (p.department_key is null and p.department_id is not null)
    or (p.department_key is not null and p.department_id is null)
    or (d.id is not null and lower(trim(d.key)) <> lower(trim(coalesce(p.department_key, ''))))
  );

-- ============================================================================
-- FIN — Étapes suivantes côté utilisateur
--
-- A) Restaurer le mot de passe Super Admin
--    Option 1 (recommandée) — Page publique :
--      • Aller sur https://rempres.com/forgot-password
--      • Saisir l'email Super Admin
--      • Cliquer sur le lien reçu par e-mail → définir un nouveau mot de passe
--      • Revenir sur /login et se connecter
--
--    Option 2 — Supabase Dashboard :
--      • Authentication → Users → ligne du Super Admin
--      • Menu "..." → "Send password recovery"
--      • Suivre le même lien e-mail
--
-- B) Vérifier la séparation par département
--    • Reconnecte-toi en Super Admin
--    • Vérifier la liste section 5 : chaque utilisateur apparaît avec son
--      rôle ET son département attendus.
--    • Si un utilisateur est sur le mauvais département : Paramètres →
--      Utilisateurs → modifier (rôle + département) → Enregistrer.
-- ============================================================================
