# Rapport — Hotfix UX navigation Actions (« Synthèse » / « Vue d'ensemble »)

**Date :** 2026-05-14  
**Objectif :** une seule identité produit pour le hub `/actions` : **`Vue d'ensemble`**, sans alias « Synthèse » dans le périmètre module Actions.

---

## 1. Fichiers corrigés ou touchés

| Fichier | Modification |
|---------|----------------|
| `lib/constants/nav-labels.ts` | Ajout `NAV_LABELS.actionsOverview` ; commentaire de gouvernance UX. |
| `lib/actions/governance-nav.ts` | Libellé hub = `NAV_LABELS.actionsOverview`. |
| `lib/navigation/super-admin-nav.ts` | Premier lien Actions = `NAV_LABELS.actionsOverview`. |
| `components/layout/app-shell.tsx` | Sous-entrée mobile / secondaire du module Actions → `NAV_LABELS.actionsOverview` (au lieu de dupliquer « Actions »). |
| `components/actions/ActionsGovernanceHub.tsx` | `aria-label` sans « Synthèse » (`Indicateurs clés — module Actions`). |
| `components/dashboard/super-admin-cockpit/SuperAdminCockpitClient.tsx` | Titre de section « Synthèses graphiques » → **« Graphiques globaux »** (cockpit super_admin, éviter le lemme « synthèse »). |
| `app/(app)/actions/page.tsx` | `metadata.title` aligné sur `actionsOverview` + `actions`. |
| `messages/fr|en|pt|zh/navigation.json` | Clé `navigation.superadmin./actions` ; suppression clé morte `navigation.item.intelligence` ; correctifs mineurs breadcrumb (en/pt/zh). |
| `tests/unit/governance-actions-nav-label.test.ts` | Test de non-régression sur l’unicité du libellé hub. |

---

## 2. Suppression de « Synthèse » (module Actions)

- Aucune chaîne **« Synthèse »** restante dans `app/(app)/actions`, `components/actions`, `lib/actions`, `lib/navigation` pour le hub `/actions`.
- `aria-label` du bandeau d’indicateurs sur le hub : terminologie sans « Synthèse ».

---

## 3. « Vue d'ensemble » comme libellé officiel

- Source unique : **`NAV_LABELS.actionsOverview`** (`"Vue d'ensemble"`).
- Réutilisée par : bandeau gouvernance, rail super_admin (premier lien du groupe Actions), item du module Actions dans `AppShell` (menu secondaire / mobile).

---

## 4. Sidebar (super_admin)

- `CollapsibleNavGroup` affiche `item.label` : aligné sur `NAV_LABELS.actionsOverview`.

---

## 5. Mobile

- `MobileSidebar` consomme les mêmes `modules` : sous-lien `/actions` = **Vue d'ensemble**.

---

## 6. Desktop

- Rail `SuperAdminPrimarySidebar` : identique.

---

## 7. États actifs

- `governanceNavActiveId` : un seul id `hub` pour `pathname === /actions` ; pas de double matching sur deux libellés différents pour la même route.

---

## 8. Fil d’Ariane / header

- Contexte header super_admin : inchangé (`SUPER_ADMIN_HEADER_LABELS.actions` = « Actions » pour le **segment**, distinct du **libellé de lien** « Vue d'ensemble » — pas de double étiquette sur la même entrée de menu).

---

## 9. i18n

- Clés ajoutées : `navigation.superadmin./actions` (fr/en/pt/zh).
- Clé retirée : `navigation.item.intelligence` (non référencée dans le code).

---

## 10. Responsive

- Aucun changement de grille ; libellés courts inchangés côté module (`shortLabel` = « Actions »).

---

## 11. Code mort

- Suppression des entrées JSON `navigation.item.intelligence` orphelines.

---

## 12. Problèmes résolus

- Risque d’**ambiguïté** entre deux formulations pour `/actions` (historique « Synthèse » vs « Vue d'ensemble »).
- **Doublon UX** module Actions / sous-lien : « Actions » + « Actions » → **Actions** + **Vue d'ensemble** pour l’entrée hub (non super_admin avec journal).

---

## 13. Risques restants

- `NAV_LABELS` reste **francophone** pour toutes les locales d’UI qui ne passent pas par `t()` sur ce rail (comportement déjà antérieur au hotfix).
- Autres écrans hors module Actions (CRM, finance, docs) peuvent encore contenir le mot « synthèse » dans un sens **métier** (hors périmètre de ce hotfix).

---

## 14. Confirmation (bornée)

Pour le **module Actions** et le **cockpit super_admin** concernés par ce diff :

- La navigation autour de `/actions` est **normalisée** sur **`Vue d'ensemble`** comme identité de lien, avec **une seule constante** produit et **aucune** occurrence résiduelle de « Synthèse » sur ces surfaces.

Ce rapport ne constitue pas une certification i18n exhaustive sur l’ensemble de l’ERP.
