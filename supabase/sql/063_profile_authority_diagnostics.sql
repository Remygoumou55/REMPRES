-- ROLE SOURCE LOCK — diagnostic profils (lecture seule, pas de migration)
-- Exécuter en SQL Editor Supabase pour identifier drift P0.

-- 1) department_key NULL sur rôles métier génériques
SELECT id, email, role_key, department_key, department_id, created_at
FROM profiles
WHERE deleted_at IS NULL
  AND role_key IN ('manager', 'agent')
  AND (department_key IS NULL OR trim(department_key) = '');

-- 2) role_key legacy sans department_key (résolution alias uniquement)
SELECT id, email, role_key, department_key
FROM profiles
WHERE deleted_at IS NULL
  AND role_key IN (
    'responsable_vente', 'employe', 'comptable', 'accountant',
    'responsable_rh', 'responsable_formation', 'responsable_consultation',
    'responsable_marketing', 'responsable_logistique'
  )
  AND (department_key IS NULL OR trim(department_key) = '');

-- 3) role_key incohérent (super_admin / directeur_general sur comptes métier attendus)
SELECT id, email, role_key, department_key
FROM profiles
WHERE deleted_at IS NULL
  AND role_key IN ('super_admin', 'directeur_general')
  AND email NOT ILIKE '%admin%'
ORDER BY role_key, email;
