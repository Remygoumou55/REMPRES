# HOTFIX — Paramètres legacy lock (verrouillage routes)

**Date** : 2026-05-22  
**Objectif** : une fonction = une route officielle sous `/settings/*` ; élimination des accès legacy administration/configuration.

---

## 1. Routes legacy identifiées

| Legacy | Officielle |
|--------|------------|
| `/config` | `/settings/permissions` |
| `/admin` | `/settings` |
| `/admin/users` | `/settings/users` |
| `/admin/currency` | `/settings/rates` |
| `/admin/ai`, `/admin/cloud`, `/admin/multitenant`, … | **Bloquées** → `/settings` (middleware 308) |

---

## 2. Routes supprimées / neutralisées

- Contenu hub hybride `/admin` (déjà retiré en 1.5) — redirection permanente.
- Pages alias : `config/page.tsx`, `admin/users/page.tsx`, `admin/currency/page.tsx` → `permanentRedirect` uniquement.
- `config/layout.tsx` supprimé (bandeau Paramètres via `/settings/*` uniquement).

**Non supprimé physiquement** : ~140 pages sous `app/(app)/admin/*` (IA, cloud, …) — **inaccessibles** via middleware + `canAccessPathForProfile` super_admin.

---

## 3. Routes redirigées

- Middleware : `resolveSettingsGovernanceRedirect` (308, query effacée).
- Next.js `redirects()` dans `next.config.mjs` (alias Paramètres).
- Pages RSC `permanentRedirect` sur alias.

---

## 4. Dual routing

| Fonction | Avant | Après |
|----------|-------|-------|
| Permissions | `/config` + `/settings/permissions` (absent) | **`/settings/permissions` seul** |
| Utilisateurs | `/admin/users` | **`/settings/users` seul** |
| Taux | `/admin/currency` | **`/settings/rates` seul** |
| Devise | `/settings/currency` | inchangé (officiel) |

---

## 5. Routes officielles (source `SETTINGS_OFFICIAL_ROUTES`)

- `/settings`
- `/settings/users`
- `/settings/permissions`
- `/settings/security`
- `/settings/currency`
- `/settings/rates`
- `/settings/notifications`
- `/settings/system`
- `/settings/language`

---

## 6–8. Navigation / middleware / permissions

- `SETTINGS_GOVERNANCE_NAV` → URLs officielles uniquement.
- `GovernanceChrome` : bandeau Paramètres si `isSettingsGovernancePath` (officiel uniquement).
- `super-admin-nav` : plus de préfixes `/config`, `/admin/users`, `/admin/currency`.
- `isSuperAdminGovernancePath` : **plus de wildcard `/admin`** ; allowlist Actions + Archives + settings.
- `ADMIN_CONSOLE_ALLOWED_PREFIXES` : liste explicite (plus `/admin` global).

---

## 9–11. Responsive / mobile

Inchangé (bandeau scroll horizontal). Pas de campagne device dans ce hotfix.

---

## 12. Tests

- `tests/unit/settings-legacy-route-lock.test.ts` (alias, blocage IA, Actions conservées).
- `auth-matrix.test.ts` : `/admin/ai` refusé pour `super_admin`.

---

## 13. Problèmes résolus

1. Accès direct `/admin/ai` et consoles legacy pour super_admin.  
2. Dual routing config / admin/users / admin/currency.  
3. Segment header « Actions » sur URLs Paramètres legacy.  
4. Wildcard `/admin` dans politique super_admin.

---

## 14. Risques restants

1. **Fichiers pages legacy** encore présents sur disque (non routables en pratique pour super_admin).  
2. **API** `/api/admin/users` — chemin API conservé (hors périmètre URL App Router).  
3. **Liens sortants** depuis `/settings/system` vers `/admin/compliance` et `/admin/platform-dashboard` (modules Actions / conformité, pas Paramètres).  
4. **Manager administration** : accès console via préfixes explicites — pas le même verrouillage strict que super_admin sur `/admin/ai`.

---

## 15. Confirmation (honnête)

Paramètres est **normalisé et verrouillé** pour le parcours super_admin et les alias documentés.  
**Pas** « sans aucune route `/admin` dans le repo » ni « suppression physique de toutes les pages legacy ».

**Phase 1.5 + hotfix** : gouvernance navigation et accès **alignés** ; dette = fichiers morts sous `app/(app)/admin/*` à purger dans une passe ultérieure si souhaité.
