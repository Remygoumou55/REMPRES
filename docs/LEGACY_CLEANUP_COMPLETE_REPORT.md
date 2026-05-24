# LEGACY CLEANUP COMPLETE — Bloc 2 Étape 2

**Date :** 22 mai 2026  
**Verdict :** `CLEANED` (avec dette documentée résiduelle)

**Super Admin :** `ErpNavSidebar`, `SuperAdminCockpitClient`, `/dashboard` — **non modifiés**.

---

## 1. Contexte

Suite à l’audit architecture (Étape 1) et au cleanup P1 (orphelins sidebar), mission : réduire la dette structurelle **sans casser le runtime** certifié Bloc 1.

---

## 2. Admin governance

| Avant | Après |
|-------|-------|
| 147 routes `page.tsx` sous `/admin/*` | **13** routes KEEP |
| Middleware bloquait déjà ~90 % des URLs | Fichiers legacy **supprimés** (134 pages) |

**Registre :** `lib/navigation/admin-route-registry.ts`

### Routes KEEP (alignées `edge-route-guards`)

- `/admin` (redirect settings)
- `/admin/approvals`, `/admin/alerts`, `/admin/audit`
- `/admin/activity-logs` (+ export routes)
- `/admin/archives`, `/admin/exports`, `/admin/suppressions`
- `/admin/platform-dashboard`, `/admin/intelligence`, `/admin/global-dashboard`
- `/admin/users`, `/admin/departments/[departmentKey]`

**Liens corrigés :** `ExecutiveGlobalDashboard`, `GOVERNANCE_OPERATIONAL_LINKS`, `TENANTS_OPERATIONAL_LINKS` → routes KEEP uniquement.

→ Détail : [`architecture-audit/ADMIN_GOVERNANCE_REPORT.md`](architecture-audit/ADMIN_GOVERNANCE_REPORT.md)

---

## 3. Cockpit cleanup

| Supprimé | Raison |
|----------|--------|
| `DepartmentDashboardPage` | 0 route |
| `DepartmentCockpitPlaceholder` | 0 route |
| `VenteCockpitClient` | Remplacé par `DeptHomePage` |
| `FinanceCockpitClient` | Remplacé par `DeptHomePage` |
| `DeptDashboardClient` | Orphelin (`page.tsx` utilise server `DeptHomePage`) |
| `DashboardClient` | SA utilise `SuperAdminCockpitClient` uniquement |
| `dept-dashboard-shell` | 0 import |

**Owner runtime unique :**

- Métier : `/dept/[key]` → `DeptHomePage` + `getDeptDashboardData`
- SA : `/dashboard` → `SuperAdminCockpitClient` (gelé)

**Contrats B2/B3 :** `cockpit-standard.ts`, `vente-reference-implementation.ts`, `finance-reference-implementation.ts` mis à jour (chemins + routes).

**Conservé :** `vente-cockpit-payload.ts`, `finance-cockpit-payload.ts` (contrats runtime / tests B2.3).

→ Détail : [`architecture-audit/COCKPIT_CLEANUP_REPORT.md`](architecture-audit/COCKPIT_CLEANUP_REPORT.md)

---

## 4. Wrappers / placeholder cleanup

- 10 `layout.tsx` orphelins sous `admin/*` supprimés
- Dossier `components/cockpit/` vide (placeholder retiré)
- Pas de modification `AppShell` / navigation métier

→ Détail : [`architecture-audit/WRAPPER_PLACEHOLDER_REPORT.md`](architecture-audit/WRAPPER_PLACEHOLDER_REPORT.md)

---

## 5. Runtime cleanup

| Impact | Détail |
|--------|--------|
| Build surface | −134 pages admin compilées |
| Imports morts | −7 composants cockpit/shell |
| Liens 404 | Évités sur executive dashboard (href → KEEP) |
| Middleware | Inchangé — continue de bloquer `/admin/*` hors registre |

→ Détail : [`architecture-audit/RUNTIME_CLEANUP_REPORT.md`](architecture-audit/RUNTIME_CLEANUP_REPORT.md)

---

## 6. Performance

- **Build** : moins de routes statiques admin → compilation plus légère
- **Bundle** : suppression clients cockpit dupliqués (Vente/Finance modules)
- **Aucune régression** middleware 83.2 kB

---

## 7. Dette restante

| ID | Item | Priorité |
|----|------|----------|
| R1 | `vente-cockpit-payload` / `finance-cockpit-payload` orphelins UI (contrats tests) | P3 |
| R2 | Modules `modules/*` platform UI vs routes admin supprimées | P3 |
| R3 | `FinanceDashboardClient` sur `/finance` (hors scope dept cockpit) | P2 |
| R4 | Docs historiques mentionnant pages supprimées | P4 |

---

## 8. Validation matrix

| AREA | EXPECTED | ACTUAL | RESULT |
|------|----------|--------|--------|
| SA cockpit | SuperAdminCockpitClient | OK | PASS |
| SA sidebar | ErpNavSidebar | OK | PASS |
| Dept cockpit | DeptHomePage | OK | PASS |
| Orphan placeholder | absent | OK | PASS |
| Admin KEEP | 13 pages | OK | PASS |
| Admin legacy file | cloud/ai absent | OK | PASS |
| RBAC | 26 tests | OK | PASS |
| m3-75 | 16 tests | OK | PASS |

Tests : `tests/unit/legacy-cleanup-matrix.test.ts` (8 cas)

→ [`architecture-audit/CLEANUP_MATRIX_REPORT.md`](architecture-audit/CLEANUP_MATRIX_REPORT.md)

---

## 9. Build validation

| Check | Résultat |
|-------|----------|
| `npm run lint` | PASS |
| `npm run build` | PASS |
| Tests ciblés (62) | PASS |

→ [`architecture-audit/CLEANUP_VALIDATION_REPORT.md`](architecture-audit/CLEANUP_VALIDATION_REPORT.md)

---

## 10. Verdict

### `CLEANED`

- Dette cockpit shadow **éliminée**
- Surface admin legacy **réduite de 91 %** (147 → 13 pages)
- Runtime métier + SA **intacts**
- Tests alignés (m3-75, b2-3, matrix)

### Pourquoi pas `PARTIAL` seul

Les objectifs Étape 2 (admin gouverné, cockpit morts, wrappers, matrix) sont **fermés** avec preuves automatisées.

### Réserve

Les payloads B2.3 isolés (R1) restent comme **contrats documentés**, pas comme UI runtime — acceptable et explicite.
