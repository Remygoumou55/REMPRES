# RemPres

Plateforme de gestion d'entreprise multi-départements.

## Stack

| Technologie | Rôle |
|---|---|
| Next.js 14 (App Router) | Framework React fullstack |
| TypeScript | Typage statique |
| Tailwind CSS | Styles utilitaires |
| Supabase | Base de données PostgreSQL + Auth + RLS |
| Zustand | State management client (devise, panier) |
| Zod | Validation des données |
| Vercel | Hébergement et déploiement continu |

## Modules

- **Vente** — Catalogue produits, gestion clients, point de vente, historique
- **Admin** — Journal d'activité, export CSV/JSON signé, vérification d'intégrité
- **Auth** — Connexion, récupération de mot de passe, RBAC (rôles / permissions)

## Variables d'environnement requises

Créer un fichier `.env.local` à la racine du projet (`rempres-erp/`) :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Ces trois variables doivent également être configurées dans le **Vercel Dashboard**
→ Project → Settings → Environment Variables.

## Démarrer en local

```bash
cd rempres-erp
npm install
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

## Base de données

Les migrations SQL se trouvent dans `rempres-erp/supabase/sql/` et sont à exécuter
dans l'ordre dans l'éditeur SQL Supabase :

| Fichier | Contenu |
|---|---|
| `001_core_schema.sql` | Tables de base (profiles, permissions) |
| `002_clients_schema.sql` | Module clients |
| `003_seed_profiles_permissions.sql` | Données initiales |
| `004_products_schema.sql` | Module produits |
| `005_vente_schema.sql` | Module vente (sales, sale_items, stock_movements, expenses) |
| `006_currency_rates.sql` | Taux de change |

## Déployer sur Vercel

1. Connecter le dépôt GitHub à [vercel.com](https://vercel.com)
2. Sélectionner le **Root Directory** : `rempres-erp`
3. Framework : **Next.js** (auto-détecté)
4. Build command : `npm run build` (par défaut)
5. Ajouter les trois variables d'environnement ci-dessus
6. Déployer

## Scripts disponibles

```bash
npm run dev      # Serveur de développement (port 3000)
npm run build    # Build de production
npm run start    # Démarrer le build de production
npm run lint     # Linter ESLint
```
