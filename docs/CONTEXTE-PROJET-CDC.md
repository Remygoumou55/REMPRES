# Contexte projet — RemPres ERP (suite du cahier des charges)

Document à réutiliser en ouverture d’une nouvelle conversation pour aligner l’assistant sur le dépôt, sans rejouer tout l’historique. **Racine npm / build : `rempres-erp/`** (Root Directory Vercel : `rempres-erp`).

---

## Identité produit

- **Nom** : RemPres — plateforme de gestion d’entreprise multi-départements.
- **Contexte géographique / devise** : Guinée ; montants stockés et référence UI en **GNF** (`lib/config.ts` : `appConfig.currency`).
- **Objectif** : ERP web (vente, finance/dépenses, modules métiers en construction : RH, formation, consultation, marketing, logistique selon la navigation).
- **Workspace local** : le repo peut être cloné sous `REMPRES/` ; l’application exploitable est **`rempres-erp/`**.

---

## Stack technique

| Couche | Choix |
|--------|--------|
| Framework | Next.js **14**, App Router, TypeScript |
| UI | React **18**, Tailwind CSS, **lucide-react**, composants/style type **shadcn** (`rempres-erp/package.json`) |
| Données / auth | **Supabase** (PostgreSQL, Auth, RLS) |
| Validation | **Zod** |
| État client | **Zustand**, **TanStack Query** (selon modules) |
| PDF | `@react-pdf/renderer` |
| Tests | **Vitest** (`npm run test`, `npm run test:watch`) |
| Hébergement cible | **Vercel** (variables d’environnement à configurer en prod) |

---

## Configuration applicative (`lib/config.ts`)

- **`appConfig.baseUrl`** : `NEXT_PUBLIC_APP_URL`, sinon `https://${VERCEL_URL}`, sinon `http://localhost:3000`.
- **Marque** : nom RemPres, version, devise GNF, coordonnées par défaut (PDF / UI), préfixes de références ventes (`VNT-…`) / factures futures (`FAC-…`).
- **`appConfig.marketingUrl`** : `NEXT_PUBLIC_MARKETING_URL` ou défaut `https://rempres.com`.

---

## Supabase : deux usages strictement séparés

### Client « session utilisateur » (clé anon)

- **`getSupabaseServerClient()`** dans `lib/supabaseServer.ts` — `cookies()` + `@supabase/auth-helpers-nextjs` / `createServerClient`.
- Pour pages serveur, actions et routes qui doivent lire le JWT de l’utilisateur connecté.

### Client admin (service_role) — uniquement serveur

- **`getSupabaseAdmin()`** / **`getSupabaseAdminClient()`** dans `lib/supabaseAdmin.ts` (alias de la même instance).
- Singleton ; `persistSession` / `autoRefreshToken` désactivés.
- **`getSupabaseAdminConfigErrorMessage()`** si variables manquantes (message explicite pour l’ops).
- Usage typique : `lib/server/users.ts` (liste Auth, invitations, profils avec privilèges élevés). **Jamais** exposer la clé au navigateur.

---

## Variables d’environnement

**Minimum** (`.env.local` racine **`rempres-erp/`**, et Vercel) :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (serveur uniquement ; requise pour admin utilisateurs / invitations)

**Souvent utilisées en complément** :

- `NEXT_PUBLIC_APP_URL` — URL canonique de l’app (redirections, emails, invitations).
- `NEXT_PUBLIC_MARKETING_URL` — site vitrine.
- `NEXT_PUBLIC_SUPPORT_EMAIL` — optionnel ; utilisée sur `/auth/error` (lien mailto).

---

## Schéma base et migrations (`supabase/sql/`)

Ordre documenté dans le **README** (cœur → clients → seeds → produits → vente → devises) :

| Fichier | Contenu |
|---------|---------|
| `001_core_schema.sql` | Schéma cœur (profiles, permissions, roles) |
| `002_clients_schema.sql` | Module clients |
| `003_seed_profiles_permissions.sql` | Données initiales roles / permissions |
| `004_products_schema.sql` | Produits |
| `005_vente_schema.sql` | Vente (sales, lignes, stock, expenses, etc.) |
| `006_currency_rates.sql` | Taux de change |

Fichiers complémentaires **présents dans le dépôt** (à appliquer dans l’ordre numérique après les précédents) :

| Fichier | Rôle (résumé) |
|---------|----------------|
| `007_create_sale_transaction.sql` | Transaction création vente |
| `008_financial_transactions.sql` | Transactions financières |
| `009_fix_sale_transaction.sql` | Correctif transaction vente |
| `010_invite_system.sql` | Invitations Auth (ex. trigger `handle_new_user_invite` sur `auth.users` → ligne `profiles`) |
| `011_expense_categories_and_phase3.sql` | Catégories dépenses / évolutions |
| `012_expenses_enterprise_enhancements.sql` | Renforcements dépenses |
| `013_products_rls_hardening.sql` | Durcissement RLS produits |

Toujours exécuter dans l’éditeur SQL Supabase dans l’ordre cohérent avec les dépendances.

---

## Modèle métier utilisateurs / RBAC

- **`profiles`** : `role_key` métier (FK vers rôles applicatifs), `department`, `is_active`, suppression logique éventuelle (`deleted_at` selon schéma).
- **Rôle `super_admin`** : accès **`/admin/users`** (exclusif dans le middleware) ; autres pages `/admin/*` (ex. journal d’activité) selon **permissions** / RLS, pas le même garde-fou que pour la gestion des comptes.
- **Permissions** : matrice permissions par `role_key` + clés de modules (clients, vente, finance, etc.) selon seeds.

---

## Parcours invitation (État stabilisé côté app)

- **`inviteUser`** (`lib/server/users.ts`) : réservé admin (`isSuperAdmin`), validation email/rôle contre `app_roles`, contrôle doublons `profiles` + scan paginé Auth, `inviteUserByEmail` avec `redirectTo` = `appConfig.baseUrl` + `/auth/callback?type=invite`, synchro profil idempotente si le trigger a déjà créé la ligne.
- **`GET /auth/callback`** (`app/auth/callback/route.ts`) : `createServerClient` + cookies (pas un client sans cookies), `exchangeCodeForSession`, redirections `type=invite` → `/auth/set-password`, récupération → set-password avec `mode=recovery`, sinon souvent `/dashboard` ; erreurs mappées vers messages courts (**Invitation expirée**, **Invitation déjà utilisée**, **Lien invalide**, **Erreur serveur**, etc.) vers `/auth/error?message=...` ; logs via `logError` avec étapes / messages utilisateur.
- **Admin** : `app/admin/users` — données via liste utilisateurs paginée, rafraîchissement JSON possible via API admin, invitations / renvoi / désactivation (actions serveur dédiées).
- **`/admin/activity-logs`** : journal d’activité, exports CSV/JSON signés ; visibilité et actions soumises aux **permissions** (ex. navigation via `canReadActivityLogs`), pas réservées à `super_admin` comme `/admin/users`.

---

## Middleware (`middleware.ts`)

- Routes **protégées** par préfixes : `/dashboard`, `/vente`, `/admin`, `/auth/set-password`, `/rh`, `/finance`, `/formation`, `/consultation`, `/marketing`, `/logistique` → utilisateur connecté requis.
- **`/admin/users`** réservé au rôle **`super_admin`** ; sinon redirection vers **`/access-denied`**.
- Chemins **publics** étendus : notamment **`/auth/error`**, login, forgot/reset-password, `/auth/callback`, etc.

---

## Logs

- `lib/logger.ts` : `logError`, `logInfo`, `logWarning` — discrets hors dev ; évolution prévue vers Sentry / Datadog (commentaire dans le fichier).

---

## Conventions pour les lots « cahier des charges »

- Préserver les contrats UI/API existants sauf rupture explicitement demandée.
- Logique sensible et **`service_role`** : **serveur uniquement** (`lib/server/*`, Route Handlers, Server Actions `"use server"`).
- Préférer des erreurs utilisateur lisibles et des réponses structurées `{ success, error? }` là où le pattern existe.
- Nouvelles briques : documenter routes, migrations SQL, permissions RBAC, et **libellés / messages d’erreur en français** si exposés à l’utilisateur.

---

## Zones déjà présentes dans l’arborescence (suite CDC)

- **Vente** : clients, produits, nouvelle vente, historique, reçus PDF sous `/vente/...`.
- **Finance** : dépenses, API snapshot/export sous `/api/finance`, agrégations côté serveur.
- **Admin** : utilisateurs, exports / vérification JSON selon pages existantes.

**RH, Formation, Consultation, Marketing, Logistique** : routes prévues dans le middleware ; souvent stubs ou « coming soon » jusqu’aux sprints correspondants du cahier des charges.

---

## Ce que la prochaine conversation doit recevoir pour rester alignée CDC

1. Référencer explicitement **`rempres-erp/`** comme racine npm et cible des commandes (`npm install`, `npm run dev`, `npm run test`, etc.).
2. Coller ou résumer les **épiques / sprints restants** du cahier des charges (priorités métier).
3. Pour chaque périmètre : **nouvelles routes**, **tables SQL / migrations**, **permissions**, **libellés FR** des erreurs utilisateur.

**Complément recommandé** : joindre les extraits précis du cahier des charges pour les « étapes suivantes » afin de cibler le travail sans redériver du document source.
