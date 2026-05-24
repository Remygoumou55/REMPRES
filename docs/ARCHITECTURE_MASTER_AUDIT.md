# ARCHITECTURE MASTER AUDIT — Bloc 2 Étape 1

**Date :** 22 mai 2026  
**Bloc :** ARCHITECTURE CLEANUP — Étape 1 (audit only)  
**Prérequis :** Bloc 1 SECURITY + ISOLATION LOCK = **CERTIFIED**  
**Verdict global :** `PARTIAL`

**Règle respectée :** Super Admin **non modifié** (lecture seule).

---

## 1. Contexte

Mission : **comprendre l’architecture réelle** avant tout cleanup — pas supprimer, pas refactorer.

| État | Détail |
|------|--------|
| RBAC | Verrouillé (profile → sidebar → routes → API guards) |
| SA | Gelé — `ErpNavSidebar`, `/dashboard`, `SuperAdminCockpitClient` |
| Codebase | ~2 217 fichiers source ; `modules/` = 1 100 fichiers |
| Routes actives | 242 `page.tsx` sous `app/(app)/` |

**Rapports phase :** `docs/architecture-audit/*.md`

---

## 2. Structure tree

```
rempres-erp/
├── app/(app)/          Authenticated ERP — AppShell unique
│   ├── admin/          147 pages (legacy gouvernance, lock non-SA)
│   ├── vente/          28 pages (commerce + CRM)
│   ├── finance/        18 pages
│   ├── dept/[key]/     Cockpit dept CANONIQUE
│   ├── dashboard/      SA cockpit GELÉ
│   └── …
├── lib/                Authority, server loaders, erp-core (286)
├── components/         Layout, dashboard, governance UI (161)
├── modules/            Domain packages (1100) — parfois parallèle à app/
├── tests/              60 fichiers Vitest
└── supabase/sql/       67 migrations
```

**Synthèse :** séparation couches claire ; ownership métier **partiellement dupliqué** (hr/rh, governance/admin, modules vs app).

→ Détail : [`architecture-audit/STRUCTURE_ARCH_REPORT.md`](architecture-audit/STRUCTURE_ARCH_REPORT.md)

---

## 3. Dependency map

**Chaîne runtime saine (post-Bloc 1) :**

```
DB profiles → profile-authority → layout-access (cache)
  → AppShell → sidebar-authority / shell-visibility
  → middleware → route-authority
```

**Orphelins identifiés (0 import runtime) :**

- `DeptSidebarNav`, `dept-nav-configs.ts`
- `SuperAdminPrimarySidebar` cluster (5 fichiers)
- `DepartmentDashboardPage`, `DepartmentCockpitPlaceholder` (routes actives)
- `VenteCockpitClient`, `FinanceCockpitClient` (hors `app/`)

**Dual truth navigation SA (documenté, non corrigé) :**

- Production : `nav-config.ts` → `ErpNavSidebar`
- Parallèle : `super-admin-nav.ts` → composants orphelins + tests lockdown

→ Détail : [`architecture-audit/DEPENDENCY_REPORT.md`](architecture-audit/DEPENDENCY_REPORT.md)

---

## 4. Cockpit ownership

| Rôle | Route | Owner | Statut |
|------|-------|-------|--------|
| Super Admin | `/dashboard` | `SuperAdminCockpitClient` | **ACTIF — GELÉ** |
| Manager dept | `/dept/[key]` | `DeptHomePage` + `dept-dashboard.ts` | **ACTIF — CANONIQUE** |
| Legacy | `/vente/dashboard`, `/finance/dashboard` | redirect → `/dept/*` | **ACTIF** |
| B2/B3 ref UI | — | `VenteCockpitClient`, `FinanceCockpitClient` | **ORPHELIN** |

**Conclusion :** pas de double cockpit runtime par département. Dette = UI modules + placeholder non routés.

→ Détail : [`architecture-audit/COCKPIT_OWNERSHIP_REPORT.md`](architecture-audit/COCKPIT_OWNERSHIP_REPORT.md)

---

## 5. Navigation topology

**AppShell (production) :**

```
super_admin → ErpNavSidebar → nav-config.ts
department  → DepartmentBusinessSidebar → department-sidebar-nav + erp-ux-architecture
```

**Alignement Bloc 1 :** `sidebar-authority` + `route-authority` = sources uniques.

**Dette :** fichiers SA legacy non branchés ; `m3-75-final-lock.test.ts` en drift.

→ Détail : [`architecture-audit/NAV_ARCH_REPORT.md`](architecture-audit/NAV_ARCH_REPORT.md)

---

## 6. Legacy map

| Catégorie | Volume | Risque runtime |
|-----------|--------|----------------|
| `/admin/*` placeholders | 147 pages | **Bloqué** middleware — faible si lock maintenu |
| Fichiers sidebar/cockpit orphelins | ~12 fichiers | **Aucun** — dead code |
| Redirects legacy dashboard | 2 routes | **Faible** — intentionnel |
| Test drift m3-75 | 2 tests FAIL | **Aucun** — doc only |
| Doc non versionné | `ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md` | **Traité** ce commit |

→ Détail : [`architecture-audit/LEGACY_DEADZONE_REPORT.md`](architecture-audit/LEGACY_DEADZONE_REPORT.md)

---

## 7. Runtime observation

| Zone | Évaluation |
|------|------------|
| `getLayoutAccess` + `cache()` | Bon — 1 résolution / requête |
| Authority pipeline | Pas de duplication post-Bloc 1 |
| Sidebar dynamic import | Code-split OK |
| Dept charts `ssr: false` | Hydration cost documenté |
| Middleware 83.2 kB | Stable |
| Build surface 147 admin routes | Compile OK — dette taille |

**Aucune modification runtime** (audit-only).

→ Détail : [`architecture-audit/RUNTIME_OBSERVATION_REPORT.md`](architecture-audit/RUNTIME_OBSERVATION_REPORT.md)

---

## 8. Dette structurelle (priorisée pour Bloc 2 Étape 2+)

| ID | Dette | Priorité | Action future |
|----|-------|----------|---------------|
| D1 | 147 pages `admin/` placeholder | P2 | Archiver ou réduire après cartographie usage |
| D2 | Cluster orphelin SA sidebar (5 fichiers) | P1 | Supprimer **après** MAJ tests — pas toucher ErpNavSidebar |
| D3 | `dept-sidebar-nav` + `dept-nav-configs` | P1 | Suppression safe |
| D4 | `VenteCockpitClient` / `FinanceCockpitClient` hors routes | P2 | Garder ref B2.4 ou déplacer docs |
| D5 | Dual `nav-config` / `super-admin-nav` | P2 | Unifier tests sur nav-config |
| D6 | `lib/hr` + `lib/rh` dual naming | P3 | Rename plan |
| D7 | `modules/vente` quasi vide | P3 | Consolider ownership |
| D8 | `m3-75-final-lock.test.ts` drift | P1 | Aligner tests sur ErpNavSidebar (sans changer SA) |
| D9 | `DepartmentDashboardPage` placeholder | P1 | Suppression safe |

---

## 9. Risques

| Risque | Niveau | Mitigation actuelle |
|--------|--------|---------------------|
| Cleanup aveugle admin routes | **Élevé** | Middleware block + ce audit |
| Modifier SA par erreur | **Élevé** | Zone gelée — read-only |
| Supprimer orphelin utilisé par test | **Moyen** | MAJ tests avant delete |
| Build time / bundle admin | **Moyen** | Acceptable ; réduire en P2 |
| Confusion cockpit modules vs DeptHome | **Faible** | Tests b2-3/b3 confirment DeptHome |

---

## 10. Verdict

### `PARTIAL`

**Pourquoi pas `CLEAN` :**

- 147 routes `admin/` legacy (surface énorme)
- ~12 fichiers navigation/cockpit orphelins
- Dual source SA nav (`nav-config` vs `super-admin-nav`)
- Test drift `m3-75`
- Ownership métier dupliqué (hr/rh, modules vs app)

**Pourquoi pas `DIRTY` :**

- Runtime **cohérent** : 1 AppShell, 1 cockpit dept (`DeptHomePage`), 1 authority chain Bloc 1
- Pas de fuite RBAC détectée (tests 70 PASS)
- SA inchangé et isolé
- Redirects legacy gouvernés
- Build + lint PASS

### Critères Étape 1

| Critère | Statut |
|---------|--------|
| Architecture tree | ✔ |
| Dependency map | ✔ |
| Cockpit ownership | ✔ |
| Navigation topology | ✔ |
| Legacy identifié | ✔ |
| Runtime observé | ✔ |
| Build OK | ✔ |
| Tests OK (hors drift connu) | ✔ |
| SA non modifié | ✔ |

---

## Validation (Phase 7)

→ [`architecture-audit/ARCH_VALIDATION_REPORT.md`](architecture-audit/ARCH_VALIDATION_REPORT.md)

| Check | Résultat |
|-------|----------|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Tests architecture + RBAC (70) | PASS |
| `m3-75-final-lock` | FAIL (drift documenté) |

---

## Références croisées

- Bloc 1 : `docs/RBAC_HARD_LOCK_REPORT.md`
- Audit historique : `docs/ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md`
- UX contract : `lib/navigation/erp-ux-architecture.ts`
