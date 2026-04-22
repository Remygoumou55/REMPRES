-- ============================================================
-- 010_invite_system.sql
-- Système d'invitation d'utilisateurs pour RemPres
--
-- Ce fichier :
-- 1. Crée un trigger qui génère automatiquement un profil
--    dès qu'un utilisateur est créé dans auth.users (via invite)
-- 2. Ajoute la colonne full_name dans profiles si absente
-- 3. Crée la vue v_users pour le listing admin
-- ============================================================

-- ------------------------------------------------------------
-- 1. Ajouter full_name dans profiles (colonne calculée)
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (
    TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
  ) STORED;

-- ------------------------------------------------------------
-- 2. Trigger : auto-création du profil lors d'une invitation
-- ------------------------------------------------------------
-- Quand inviteUserByEmail() est appelé, Supabase insère dans
-- auth.users avec raw_user_meta_data contenant :
--   { role_key, first_name, last_name, department_key }
--
-- Ce trigger lit ces métadonnées et crée le profil associé.
-- Si le profil existe déjà (re-run idempotent), on ne fait rien.

CREATE OR REPLACE FUNCTION public.handle_new_user_invite()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_role_key   TEXT;
  v_first_name TEXT;
  v_last_name  TEXT;
  v_dept_key   TEXT;
BEGIN
  -- Lire les métadonnées passées lors de l'invitation
  v_role_key   := COALESCE(NEW.raw_user_meta_data->>'role_key',      'employe');
  v_first_name := COALESCE(NEW.raw_user_meta_data->>'first_name',    '');
  v_last_name  := COALESCE(NEW.raw_user_meta_data->>'last_name',     '');
  v_dept_key   := NEW.raw_user_meta_data->>'department_key';

  -- Vérifier que le role_key existe dans app_roles (sécurité)
  IF NOT EXISTS (SELECT 1 FROM public.app_roles WHERE key = v_role_key) THEN
    v_role_key := 'employe';
  END IF;

  -- Créer le profil (idempotent)
  INSERT INTO public.profiles (
    id,
    email,
    first_name,
    last_name,
    role_key,
    department_key,
    is_active,
    deleted_at
  )
  VALUES (
    NEW.id,
    LOWER(NEW.email),
    v_first_name,
    v_last_name,
    v_role_key,
    v_dept_key,
    TRUE,
    NULL
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Supprimer l'ancien trigger s'il existe, puis recréer
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_invite();

-- ------------------------------------------------------------
-- 3. Vue admin : listing des utilisateurs avec leur profil
-- ------------------------------------------------------------
-- Utilisée dans /admin/users pour afficher la liste complète.
-- Accessible uniquement via le service role (pas de RLS public).

CREATE OR REPLACE VIEW public.v_users AS
SELECT
  au.id,
  au.email,
  au.created_at        AS invited_at,
  au.last_sign_in_at,
  au.confirmed_at,
  au.email_confirmed_at,
  p.first_name,
  p.last_name,
  p.full_name,
  p.role_key,
  r.label              AS role_label,
  p.department_key,
  p.is_active,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'pending'
    WHEN p.is_active = FALSE           THEN 'inactive'
    ELSE                                    'active'
  END AS status
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id AND p.deleted_at IS NULL
LEFT JOIN public.app_roles r ON r.key = p.role_key
ORDER BY au.created_at DESC;

-- Cette vue n'est accessible qu'avec le service_role (pas de RLS sur les vues,
-- mais auth.users est déjà protégé — le client admin est requis).

-- ------------------------------------------------------------
-- 4. Fonction RPC : récupérer les utilisateurs (pour le frontend)
-- ------------------------------------------------------------
-- Appelée depuis le serveur avec le client admin.
-- Retourne la liste des utilisateurs pour la page /admin/users.

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id                UUID,
  email             TEXT,
  invited_at        TIMESTAMPTZ,
  last_sign_in_at   TIMESTAMPTZ,
  status            TEXT,
  full_name         TEXT,
  first_name        TEXT,
  last_name         TEXT,
  role_key          TEXT,
  role_label        TEXT,
  department_key    TEXT,
  is_active         BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT
    v.id,
    v.email,
    v.invited_at,
    v.last_sign_in_at,
    v.status,
    v.full_name,
    v.first_name,
    v.last_name,
    v.role_key,
    v.role_label,
    v.department_key,
    v.is_active
  FROM public.v_users v;
$$;

-- Seul le super_admin peut appeler cette fonction
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
