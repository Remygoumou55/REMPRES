# ERP UX P0 Alignment — Micro Phase M3.5

**Date :** 2026-05-22  
**Statut :** Implémentation P0 livrée (alignement code ↔ M3)  
**Périmètre :** Sidebar · Cockpit · Dashboard · Navigation · Post-login — **sans build métier**

---

## 1. État UX initial (avant M3.5)

| Zone | État |
|------|------|
| Rail métier | Double rail : `PrimarySidebar` (modules Commerce + CRM séparés) + `SecondarySidebarPanel` |
| Homepage dept | `DepartmentDashboardPage` → `GovernanceHomeCenter` (help-center) |
| `/dashboard` | Hybride : `SuperAdminCockpitClient` **ou** `DashboardClient` multi-modules |
| Post-login | `super_admin` → `/admin/dashboard` ; login → `/dashboard` fixe |
| Vente | `commerce` + `crm` comme deux modules top-level du rail |
| Cockpit dept | Absent — onboarding documentaire à la place |

---

## 2. Gaps M3 détectés (audit)

| ID | Gap | Priorité |
|----|-----|----------|
| G1 | `SecondarySidebarPanel` actif pour tous les métiers | P0 |
| G2 | `GovernanceHomeCenter` comme landing `*/dashboard` | P0 |
| G3 | `/dashboard` hybride pour non–super_admin | P0 |
| G4 | Post-login incohérent (`/admin/dashboard`, login `/dashboard`) | P0 |
| G5 | Rail Vente doublé (Commerce + CRM top-level) | P0 |
| G6 | Cockpits départementaux absents (structure M3) | P0 |
| G7 | Consultation : cockpit séparé vs Formation (M1.5) | P1 |

---

## 3. SecondarySidebar removal

**Fait :**

- `SecondarySidebarPanel` retiré du rendu `AppShell` pour les utilisateurs métier.
- Navigation opérationnelle intégrée dans le rail unique via `CollapsibleNavGroup` (`DepartmentBusinessSidebar` / `DepartmentBusinessMobileNav`).

**Conservé (dettes) :**

- Fichier `components/layout/app-shell/SecondarySidebar.tsx` encore présent (code mort, suppression physique reportée).

**Super Admin :** inchangé — pas de sidebar secondaire (phase 1.6 / M3).

---

## 4. GovernanceHomeCenter replacement

**Fait :**

- Tous les `app/(app)/*/dashboard/page.tsx` métier passent par `DepartmentDashboardPage` → `DepartmentCockpitPlaceholder` (zones M3 : header, KPI, alertes, graphiques, activité, actions rapides).

**Conservé :**

- `GovernanceHomeCenter.tsx` reste dans le dépôt pour réutilisation **aide / support / documentation** — plus utilisé comme homepage métier.

---

## 5. Routing alignment

| Règle M3 | Implémentation |
|----------|----------------|
| `super_admin` → `/dashboard` | `resolvePostLoginRoute` + `SUPER_ADMIN_COCKPIT_ROUTE` ; login + landing |
| Métiers → cockpit dept | `resolvePostLoginRoute` par `department_key` |
| Consultation → Formation | `resolveEffectiveDepartmentKey` + redirect `/consultation/dashboard` → `/formation/dashboard` |
| Non–SA sur `/dashboard` | Redirect serveur vers cockpit dept |

**Fichiers :** `lib/navigation/home-route.ts`, `lib/roleRedirects.ts`, `app/login/page.tsx`, `app/(app)/dashboard/page.tsx`, `app/page.tsx` (déjà via `getDestinationForRole`).

---

## 6. Vente consolidation

**Fait :**

- Un seul rail département **Vente** avec groupes repliables **Commerce** et **CRM** (spec `OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE`).
- Suppression des modules top-level `commerce` / `crm` dans `AppShell`.

**Validation :** `tests/unit/m3-5-ux-alignment.test.ts` — groupes `commerce` + `crm` sous VENTE.

---

## 7. Cockpit placeholder alignment

**Composant :** `components/cockpit/DepartmentCockpitPlaceholder.tsx`

| Zone M3 | Statut |
|---------|--------|
| context_header | Placeholder texte |
| kpi_primary | 4 cartes « — » |
| alerts | État vide |
| charts | Skeleton |
| recent_activity | État vide |
| quick_actions | Liens depuis archi sidebar (max 3) |

**RH :** `/rh` conserve son pilotage opérationnel existant ; `/rh/dashboard` = cockpit structure M3.

---

## 8. Responsive QA

| Breakpoint | Sidebar | Cockpit | Navigation |
|------------|---------|---------|------------|
| Desktop | Rail repliable 268/76px | OK | Groupes inline |
| Mobile | `DepartmentBusinessMobileNav` drawer | OK | Groupes expand + fermeture drawer |
| Super Admin | `SuperAdminMobileNav` réintégré | OK | Inchangé |

**Non exécuté en CI :** tests E2E viewport automatisés — validation manuelle recommandée.

---

## 9. Regression testing

| Suite | Résultat |
|-------|----------|
| `npm test` (vitest) | **61 passed** (+6 M3.5) — voir M3.75 pour lock final |
| `npx tsc --noEmit` | **OK** (après correction TS2322 `DepartmentDashboardPage` → `departmentKey` non nullable) |

**Note M3.75 :** une erreur TS2322 (`string \| null` → `string`) a été détectée lors de l’implémentation M3.5 et **corrigée avant clôture** ; le log de compilation initial ne doit pas être interprété comme erreur active post-lock.

**Nouveaux tests :** `tests/unit/m3-5-ux-alignment.test.ts`

---

## 10. Problèmes corrigés (liste)

1. Suppression rendu `SecondarySidebarPanel` métier  
2. Remplacement help-center dept par cockpit placeholder M3  
3. `/dashboard` réservé super_admin (redirect métiers)  
4. Post-login super_admin → `/dashboard` (plus `/admin/dashboard`)  
5. Login redirect profil-aware  
6. Rail Vente unifié (Commerce + CRM en groupes)  
7. Consultation dashboard → Formation  
8. Shell métier : `departmentKey` propagé depuis layout  
9. Mobile super_admin restauré après refactor shell  

---

## 11. Incohérences restantes (honnêtes)

| Item | Détail |
|------|--------|
| `SecondarySidebar.tsx` | Fichier legacy non supprimé |
| `DashboardClient.tsx` | Code hybride orphelin (plus routé pour métiers) |
| `PrimarySidebar.tsx` / `MobileSidebar.tsx` | Orphelins du shell métier |
| `useActiveNav.ts` | Plus consommé par `AppShell` métier |
| `/rh` vs `/rh/dashboard` | Deux surfaces RH (opérationnel + cockpit) — cohérent M3 mais peut prêter à confusion |
| `admin/dashboard` | Redirect `/dashboard` — OK pour SA |
| Permissions lien-à-lien | Filtrage Commerce partiel ; CRM groupe si `shellRail.crm` |

---

## 12. Dette UX restante

- Purge physique fichiers legacy sidebar (`SecondarySidebar`, `PrimarySidebar` métier).  
- Brancher données réelles sur `DepartmentCockpitPlaceholder`.  
- Unifier libellés quick-actions (affichage href brut).  
- E2E responsive Playwright.  
- Pages opérationnelles `/finance`, `/vente/*` — hors scope M3.5.  

---

## 13. Risques futurs

1. **Réintroduction double rail** si un dev remonte `SecondarySidebarPanel` dans `AppShell`.  
2. **Régression post-login** si nouveaux flux auth contournent `resolvePostLoginRoute`.  
3. **Consultation** : routes `/consultation/*` encore exposées dans nav Formation — à rationaliser au build métier.  
4. **Cross-dept users** : sidebar ne montre qu’un département (`department_key`) — supervision multi-dept reste via Actions/gouvernance.  

---

## 14. Confirmation officielle

| Critère | Statut |
|---------|--------|
| Alignée M3 (contrat `erp-ux-architecture.ts`) | **Oui** — implémentation P0 |
| Non hybride homepage métier | **Oui** — redirect `/dashboard` |
| Non dupliquée navigation Vente | **Oui** — groupes sous rail unique |
| Cohérente post-login | **Oui** |
| Responsive (structure) | **Oui** — pas de 2e colonne |
| Enterprise-grade shell | **Oui** — modèle Super Admin étendu aux métiers |
| Métiers finaux / CRUD / workflows | **Non** — volontairement hors scope |

**Verdict :** UX ERP **P0 alignée M3** pour démarrer le build départemental. Ce n’est pas un « 100 % parfait » produit : placeholders et dette fichier listés ci-dessus.

---

## Fichiers créés / modifiés (référence)

| Fichier | Action |
|---------|--------|
| `lib/navigation/home-route.ts` | Créé |
| `lib/navigation/department-sidebar-nav.ts` | Créé |
| `components/cockpit/DepartmentCockpitPlaceholder.tsx` | Créé |
| `components/layout/app-shell/DepartmentBusinessSidebar.tsx` | Créé |
| `components/layout/app-shell/DepartmentBusinessMobileNav.tsx` | Créé |
| `components/layout/app-shell.tsx` | Refactor |
| `components/governance/home/DepartmentDashboardPage.tsx` | Cockpit |
| `app/(app)/layout.tsx` | `departmentKey` |
| `app/(app)/dashboard/page.tsx` | SA only |
| `app/login/page.tsx` | Post-login |
| `lib/roleRedirects.ts` | Délégation home-route |
| `app/(app)/consultation/dashboard/page.tsx` | Redirect Formation |
| `tests/unit/m3-5-ux-alignment.test.ts` | Créé |
