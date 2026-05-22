# REMPRES ERP — Micro phase M2.5
# Navigation & Visibility Alignment

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** alignement gouvernance navigation — **pas de workflow métier, pas de redesign UX complet**  
**Prérequis :** M1 · M1.5 · M2 · Super Admin 1.6  
**Livrables code :** `lib/navigation/shell-visibility.ts`, `lib/server/layout-access.ts`, `app-shell`, sidebars, tests  
**Rapport :** honnête sur ce qui est aligné vs dette restante

---

## Synthèse exécutive

La phase M2.5 **aligne la visibilité** du shell ERP (rail principal, footer Paramètres, raccourcis homepage) sur la **matrice M2** : `role_key` + `department_key` en priorité, permissions module en second.

**Corrections appliquées (alignement, pas métier) :**

| Problème M2 | Correction M2.5 |
|-------------|-----------------|
| RH `visible: true` pour tous | Visible si `department_key = RH` + `can_read` module `rh` |
| Logistique `visible: true` pour tous | Visible si `LOGISTIQUE` + permission |
| Formation / Marketing absents du rail | Modules ajoutés, filtrés par département |
| Paramètres footer universel | Lien footer **uniquement** si `shellRail.settings` (super_admin) |
| Actions/Settings via `isAdminRole` large | Actions = `hasAdminConsoleAccess` ; Settings rail = super_admin |
| CRM visible hors Vente | CRM rail si `VENTE` + lecture |
| Homepage raccourcis cross-dept | Filtrés via `shouldShowDashboardModuleShortcut` |

**Non modifié (volontairement) :** fusion Commerce+CRM en un seul module rail (design sidebars métiers ultérieur) ; middleware URL (déjà M2) ; matrice SQL `permissions` par `role_key` seul (dette M2 §I7).

**Verdict :** navigation shell **alignée M2** pour la visibilité ; **pas** « 100 % parfait » sur permissions DB agrégées ni QA device matrix.

---

## 1. Navigation actuelle (avant / après M2.5)

### 1.1 Arborescence technique

| Couche | Fichiers | Rôle |
|--------|----------|------|
| Layout serveur | `lib/server/layout-access.ts` | Profil + permissions modules + `shellRail` |
| Politique visibilité | `lib/navigation/shell-visibility.ts` | Règles M2 dérivées |
| Shell client | `components/layout/app-shell.tsx` | Construction `ModuleDef[]` |
| Active segment | `useActiveNav.ts` | Préfixes URL → `ModuleId` |
| Super admin | `SuperAdminPrimarySidebar` | Inchangé (gouvernance) |
| Secondaire | `SecondarySidebarPanel` | Sous-menu module actif (non super_admin) |
| Middleware | `middleware.ts` | Accès URL (inchangé M2.5) |

### 1.2 Rail modules (utilisateurs métier)

| ModuleId | Préfixe URL | Département requis (M2.5) |
|----------|-------------|---------------------------|
| `commerce` | `/vente` (hors `/vente/crm`) | `VENTE` |
| `crm` | `/vente/crm` | `VENTE` (M1.5) |
| `finance` | `/finance` | `FINANCE` |
| `rh` | `/rh` | `RH` |
| `logistics` | `/logistique` | `LOGISTIQUE` |
| `formation` | `/formation`, `/consultation` | `FORMATION` ou legacy `CONSULTATION` |
| `marketing` | `/marketing` | `MARKETING` |
| `actions` | `/actions`, `/admin` (nav) | `hasAdminConsoleAccess` |
| `settings` | `/settings` | **super_admin** (rail + footer) |

### 1.3 Super_admin

Rail verrouillé : Accueil · Actions · Archives · Paramètres — **aucun module métier** au rail. Conforme phase 1.6.

---

## 2. Shell actuel (post-alignement)

### 2.1 Flux de données

```
profiles (role_key, department_key)
    → getModulePermissions(module_keys)
    → resolveShellRailVisibility()
    → AppShell (modules[].visible)
    → PrimarySidebar / MobileSidebar (.filter visible)
```

### 2.2 `ShellRailVisibility` (contrat)

Champs booléens : `commerce`, `crm`, `finance`, `rh`, `logistics`, `formation`, `marketing`, `actions`, `settings`.

**Règle centrale :** si `department_key` ≠ département du module → `visible = false`, **même si** permissions module true (corrige fuite visuelle manager agrégé).

### 2.3 Footer Paramètres (Primary + Mobile)

Avant : lien `/settings` **toujours** en bas du rail.  
Après : `showSettingsLink={shellRail.settings}` — **false** pour managers métiers.

---

## 3. Legacy visibility (cartographie)

| Élément | Visibilité avant | Après M2.5 |
|---------|------------------|------------|
| RH / Logistique pour Vente | Visible | Masqué |
| Paramètres pour manager Vente | Footer visible | Masqué |
| Actions pour manager Vente | Parfois via `isAdminRole` | Masqué |
| Actions pour manager ADMINISTRATION | Oui | Oui (`hasAdminConsoleAccess`) |
| Consultation | Routes séparées | Rail **Formation** si dept CONSULTATION (transition M1.5) |
| CRM hors Vente | Possible si permissions | Masqué |
| Archives au rail métier | Non | Non (super_admin uniquement) |
| `/admin/*` legacy | URL bloquées super_admin | Inchangé |

---

## 4. Sidebar visibility alignée M2

### 4.1 Matrice cible (référence M2 — rappel)

| Profil effectif | Modules rail visibles |
|-----------------|----------------------|
| SUPER_ADMIN | Gouvernance uniquement (sidebar dédiée) |
| MANAGER_VENTE | Accueil, Commerce, CRM |
| MANAGER_FINANCE | Accueil, Finance |
| MANAGER_RH | Accueil, RH |
| MANAGER_FORMATION | Accueil, Formation & Consultation |
| MANAGER_MARKETING | Accueil, Marketing |
| MANAGER_LOGISTIQUE | Accueil, Logistique |
| MANAGER_ADMINISTRATION | Accueil, Actions (pas Paramètres rail métier*) |
| AGENT_* | Même département, sous-ensemble items si permissions |

\* Paramètres complets = super_admin ; ex-DG via URLs admin console selon `ADMIN_CONSOLE_ALLOWED_PREFIXES`.

### 4.2 Implémentation

- **PrimarySidebar** : filtre `modules.visible` ; footer settings conditionnel.  
- **SecondarySidebar** : items `visible` alignés sur flag module parent.  
- **MobileSidebar** : même logique + sections par module visible.

---

## 5. Visibility matrix alignée (homepage + shell)

| Profil | Homepage | Rail | Paramètres footer | Archives rail |
|--------|----------|------|-------------------|---------------|
| SUPER_ADMIN | Cockpit gouvernance | Gouvernance | N/A (sidebar SA) | Oui |
| MANAGER_VENTE | KPI + raccourcis Vente/CRM | Commerce, CRM | Non | Non |
| MANAGER_FINANCE | KPI + Finance | Finance | Non | Non |
| MANAGER_RH | KPI + RH | RH | Non | Non |
| MANAGER_FORMATION | KPI + (futur) | Formation | Non | Non |
| MANAGER_MARKETING | KPI + (futur) | Marketing | Non | Non |
| MANAGER_LOGISTIQUE | KPI + Logistique | Logistique | Non | Non |

**Voir ≠ modifier :** un module visible avec `can_read` false sur items → groupe visible mais sous-liens réduits (ex. commerce sans clients si pas permission).

---

## 6. Department rail review

| Département officiel M1 | Présent rail M2.5 | Sous-menu |
|-------------------------|-------------------|-----------|
| VENTE (+ CRM) | Oui (2 modules*) | Commerce + CRM_NAV |
| FINANCE | Oui | Finance + dépenses |
| RH | Oui (filtré) | RH_NAV_ITEMS |
| FORMATION (+ Consultation) | Oui | Formation + Consultation dashboard |
| MARKETING | Oui | Marketing hub |
| LOGISTIQUE | Oui (filtré) | LOGISTICS_NAV |

\* Fusion Commerce+CRM en un module unique = **phase sidebars métiers** (hors M2.5).

---

## 7. Shell corrections (fichiers modifiés)

| Fichier | Changement |
|---------|------------|
| `lib/navigation/shell-visibility.ts` | **Nouveau** — politique visibilité |
| `lib/server/layout-access.ts` | Permissions rh/logistics/formation/marketing/crm + `shellRail` |
| `components/layout/app-shell.tsx` | Modules filtrés ; Formation/Marketing |
| `components/layout/app-shell/types.ts` | `formation`, `marketing` ModuleId |
| `components/layout/app-shell/useActiveNav.ts` | Préfixes formation/consultation/marketing |
| `PrimarySidebar.tsx` / `MobileSidebar.tsx` | Footer settings conditionnel |
| `app/(app)/layout.tsx` | Passe `shellRail` |
| `app/(app)/dashboard/page.tsx` | Raccourcis via `shellRail` |
| `lib/constants/nav-labels.ts` | Libellés Formation & Marketing |
| `tests/unit/shell-visibility.test.ts` | **10 tests** anti-régression |

---

## 8. Legacy navigation review

| Legacy | Statut M2.5 |
|--------|-------------|
| ModuleId `commerce` + `crm` séparés | Conservé ; visibilité couplée VENTE |
| `/consultation` routes | Actives ; nav → segment `formation` |
| `useActiveNav` `/archives` → `settings` | Conservé (secondaire gouvernance) |
| Dashboard tuiles `canReadFinance` directes | Partiellement conservées pour KPI (pas raccourcis) |
| Dept cards `/dept` sur dashboard | Inchangé (supervision) |
| Liens executive | `showExecutiveLink` si admin console |

**Cleanup futur :** registre modules dérivé de `DEPARTMENT_NAVIGATION` ; unification rail Vente ; suppression lien settings hardcodé résiduel ailleurs.

---

## 9. Responsive validation

| Contrôle | Statut M2.5 |
|----------|-------------|
| Desktop rail collapse | **Préservé** — pas de changement structurel |
| Mobile drawer | **Préservé** — `SuperAdminMobileNav` / `MobileSidebar` |
| Nouveaux modules Formation/Marketing | Même pattern scroll `overflow-y-auto` |
| QA device matrix manuelle | **Non exécutée** |

**Alignement ne doit pas casser responsive** — aucune modification des classes collapse/transition.

---

## 10. Scalability review

| Aspect | Évaluation |
|--------|------------|
| Ajout département | Étendre `shell-visibility.ts` + `ModuleId` + entrée `DEPARTMENT_NAVIGATION` |
| Registre dynamique | **Recommandé** — remplacer `modules[]` hardcodé par builder depuis `departments` table |
| 30+ départements | Faisable si builder générique ; état actuel = **7 dept + gouvernance** OK |
| Nouveau sous-module | `permissions.module_key` + section secondaire |

**Anti-pattern évité :** `visible: true` global.

---

## 11. Incohérences trouvées

| # | Incohérence | Statut M2.5 |
|---|-------------|-------------|
| I1 | Permissions `manager` globales en SQL | **Ouverte** — visibilité corrigée côté shell |
| I2 | Commerce + CRM = 2 rails pour 1 dept | **Ouverte** — design futur |
| I3 | `useActiveNav` archives → settings | **Acceptée** (chrome archives) |
| I4 | Formation visible si `can_read` false (seed) | Possible — dept match mais menu vide |
| I5 | MANAGER_ADMINISTRATION sans Paramètres rail | **Conforme** M2 |
| I6 | Dashboard KPI finance visible hors dept finance | **Partielle** — tuiles KPI pas re-filtrées |
| I7 | Secondary sidebar montre items si module actif par URL | Middleware bloque accès cross-dept |

---

## 12. Problèmes détectés

1. ~~RH/Logistique universels~~ → **corrigé**  
2. ~~Formation/Marketing absents~~ → **corrigé**  
3. ~~Paramètres footer universel~~ → **corrigé**  
4. ~~CRM hors Vente visible~~ → **corrigé**  
5. Permissions agrégées `role_key=manager` — **non corrigé** (hors périmètre M2.5)  
6. Pas de registre navigation unique — **dette**  
7. KPI dashboard non strictement départementaux — **dette UX**  
8. Pas de tests E2E navigation — **dette QA**

---

## 13. Dette future

| Dette | Priorité |
|-------|----------|
| Builder rail depuis `DEPARTMENT_NAVIGATION` | Haute |
| Fusion module Vente (Commerce+CRM) | Moyenne (sidebars métiers) |
| Policy `permissions ∧ department_key` serveur | Haute (M3 implémentation RBAC) |
| Migration `CONSULTATION` → `FORMATION` profils | Haute |
| Filtrer KPI dashboard par dept | Moyenne |
| Tests E2E visibilité rail | Moyenne |
| Purge modules permissions enterprise du shell | Basse |

---

## 14. Risques restants

| Risque | Mitigation |
|--------|------------|
| Utilisateur voit module mais URL refusée | Middleware OK ; message access-denied |
| Manager avec permissions vente+rh en DB voit seulement son dept | Shell M2.5 |
| Agent voit module sans droit CRUD | Items filtrés `can_read` partiel |
| Régression super_admin | Tests lockdown + pas de changement SA sidebar |

---

## 15. Confirmation officielle M2.5

| Critère | Statut |
|---------|--------|
| **Alignée** M2 (visibilité shell) | **Oui** — politique + implémentation |
| **Gouvernée** | **Oui** — `shell-visibility.ts` source |
| **Non hybride** (universal rail) | **Oui** pour RH/Logistique/Settings footer |
| **Non universelle** | **Oui** — filtrage dept |
| **Scalable** | **Oui** avec registre futur |
| **Enterprise-grade** | **Oui** (référence + tests) |
| **Implémentation complète RBAC SQL** | **Non** — hors périmètre |
| **Sidebars métiers finales** | **Non** — phase suivante |

### Formulation de verrouillage

> **La navigation et la visibilité shell ERP obéissent à la matrice M2** via `resolveShellRailVisibility`.  
> **Super_admin reste isolé** sur le rail gouvernance.  
> **Les sidebars métiers définitives** et la **matrice permissions SQL** sont les étapes suivantes, sans remettre en cause M1 / M1.5 / M2.

---

## Annexe — Tests anti-régression

`tests/unit/shell-visibility.test.ts` :

- super_admin → rail métier masqué  
- MANAGER_VENTE → commerce + crm, pas finance/rh  
- MANAGER_FINANCE → finance seul  
- RH / Logistique requièrent dept  
- CONSULTATION → rail formation  
- Paramètres rail interdit manager vente  
- Actions pour ADMINISTRATION  
- Homepage shortcuts cohérents  

Commande : `npm test -- tests/unit/shell-visibility.test.ts`

---

*Micro phase M2.5 — alignement navigation & visibilité. Prochaine étape normative : sidebars métiers + implémentation RBAC permissions∧department.*
