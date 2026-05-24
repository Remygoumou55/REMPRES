# STRUCTURE ARCH REPORT — Bloc 2 Étape 1

**Date :** 22 mai 2026  
**Périmètre :** `rempres-erp/` (lecture seule)

## Architecture tree (top-level)

```
rempres-erp/
├── app/                    378 files — Next.js App Router
│   ├── (app)/              242 page.tsx — shell unique AppShell
│   ├── api/                26 handlers
│   └── auth/login/...      pages publiques
├── modules/                1100 files — domain packages (largest tree)
├── lib/                    286 files — shared server/client, ERP core
├── components/             161 files — shared UI, layout, governance
├── tests/                  60 files — Vitest unit
├── supabase/sql/           67 migrations
├── docs/                   81+ reports
├── hooks/                  8 (root)
├── providers/              1
├── messages/               32 i18n
└── types/                  3
```

**Total source-ish (hors node_modules, .next) :** ~2 217 fichiers

## `app/(app)/` segments (ownership)

| Segment | page.tsx | Owner runtime |
|---------|----------|---------------|
| `admin/` | **147** | Gouvernance SA (bloqué non-SA) — majoritairement placeholders |
| `vente/` | **28** | Commerce + CRM opérationnel |
| `finance/` | **18** | Finance + enterprise subtree |
| `logistique/` | **12** | Ops partiel |
| `rh/` | **8** | RH partiel |
| `settings/` | **9** | Paramètres gouvernance |
| `dept/` | **2** | Cockpit département unifié |
| `dashboard/` | **2** | Accueil SA (gelé) + redirect métier |
| autres | ~24 | consultation, formation, marketing, actions, archives |

## `lib/` ownership zones

| Zone | Files | Rôle |
|------|------:|------|
| `erp-core/` | 106 | Event bus, approvals, governance standards |
| `server/` | 36 | Loaders layout, dashboard, archives |
| `navigation/` | 12 | sidebar/route authority, home-route |
| `auth/` | 5 | RBAC Bloc 1 (verrouillé) |
| `governance/` | 21 | Repos audit/alerts/approvals |
| `constants/` | 9 | nav-config, dept configs, routes |

## `modules/` top packages

| Module | Files | Note |
|--------|------:|------|
| `department-dashboards/` | 183 | Visual/KPI dept |
| `hr/` | 107 | RH domain |
| `dashboard-system/` | 61 | Dept read security |
| `admin-platform-dashboard/` | 59 | Platform UI (parallel admin routes) |
| `executive-dashboard/` | 56 | Executive visuals |
| `vente/` | **1** | Cockpit client orphelin (référence B2.4) |

## Cohérence structurelle

| Critère | État |
|---------|------|
| Séparation app / lib / components | **Claire** |
| Domain logic dans `modules/` | **Partielle** — beaucoup reste dans `app/` + `lib/` |
| Ownership département | **Ambigu** — `lib/hr` + `lib/rh` + `modules/hr` + `app/rh` |
| Zones gelées SA | `/dashboard`, `ErpNavSidebar`, `SuperAdminCockpitClient` |

## Zones ambiguës

1. **Dual HR paths** : `lib/hr/`, `lib/rh/`, `app/rh/`, `app/api/rh/`
2. **Governance éclatée** : `lib/governance`, `components/governance`, `app/admin`, `modules/governance-platform`
3. **Archives** : 5 emplacements (lib, components, admin, app/archives)
4. **`lib/security/`** : répertoire vide

## Verdict structure

**PARTIAL** — arbre lisible, ownership métier pas toujours unique par domaine.
