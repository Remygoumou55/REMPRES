# ARCHITECTURE CLEANUP P1 — Bloc 2 Étape 2

**Date :** 22 mai 2026  
**Scope :** Orphelins sidebar + alignement tests m3-75  
**Super Admin :** `ErpNavSidebar` et cockpit SA **non modifiés**

---

## Fichiers supprimés (8)

| Fichier | Raison |
|---------|--------|
| `components/layout/dept-sidebar-nav.tsx` | 0 import runtime |
| `lib/constants/dept-nav-configs.ts` | Chaîne orpheline ; hrefs legacy incorrects |
| `components/layout/app-shell/SuperAdminPrimarySidebar.tsx` | Remplacé par `ErpNavSidebar` (gelé) |
| `components/layout/app-shell/SuperAdminMobileNav.tsx` | Orphelin — mobile = même `renderSidebar()` |
| `components/layout/app-shell/MobileSidebar.tsx` | Orphelin |
| `components/layout/app-shell/PrimarySidebar.tsx` | Orphelin métier |
| `components/layout/app-shell/SecondarySidebar.tsx` | Orphelin double rail |
| `components/layout/app-shell/SuperAdminNavContextLabel.tsx` | 0 import |

**Conservé (intentionnel) :**

- `ErpNavSidebar.tsx` — production SA
- `lib/navigation/super-admin-nav.ts` — tests lockdown + `super-admin-lockdown.ts`
- `DepartmentBusinessSidebar.tsx`, `CollapsibleNavGroup.tsx`

---

## Tests alignés

`tests/unit/m3-75-final-lock.test.ts` :

- Attend `ErpNavSidebar` + `usesErpGlobalSidebar` pour SA
- Interdit références `SuperAdminPrimarySidebar` / `SuperAdminMobileNav` dans AppShell
- **16/16 PASS**

---

## Non traité (hors P1)

- `DepartmentDashboardPage` / `DepartmentCockpitPlaceholder` (cockpit, pas sidebar)
- 147 pages `admin/*`
- `modules/vente` cockpit clients (référence B2.4)

---

## Validation

| Check | Résultat |
|-------|----------|
| `m3-75-final-lock` | PASS (16) |
| ErpNavSidebar modifié | **Non** |
| SuperAdminCockpitClient modifié | **Non** |
