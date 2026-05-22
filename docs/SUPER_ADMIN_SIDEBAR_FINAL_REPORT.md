# REMPRES ERP — Super Admin · foundation sidebar (rapport final)

**Date :** 2026-05-14  
**Périmètre :** navigation **uniquement** pour `isSuperAdmin === true` dans `AppShell` ; les autres rôles conservent le rail existant + `SecondarySidebarPanel`.

---

## 1. Éléments supprimés / neutralisés (super_admin)

| Élément | Comportement |
|---------|----------------|
| Entrées rail **Commerce, CRM, Finance, RH, Logistique** | **Non affichées** pour `super_admin` |
| Entrées **Actions** / **Administration** / **Console administration** du rail historique | **Remplacées** par la structure officielle |
| Lien **Paramètres** global en bas du rail (réglages personnels) | **Retiré du rail** : accès via groupe **Paramètres** → « Notifications » (`/settings`) |
| **`SecondarySidebarPanel`** | **Non montée** (`null`) lorsque `isSuperAdmin` — **plus de sidebar secondaire** pour ce rôle |

---

## 2. Composants factorisés / nouveaux

| Fichier | Rôle |
|---------|------|
| `lib/navigation/super-admin-nav.ts` | Données `SUPER_ADMIN_NAV_GROUPS` + `getSuperAdminNavSegment(pathname)` |
| `components/layout/app-shell/CollapsibleNavGroup.tsx` | Groupe **replié / déplié** unique (clic header, persistance `localStorage`, auto-ouverture si enfant actif, rail étroit → demande d’agrandir le rail) |
| `components/layout/app-shell/SuperAdminPrimarySidebar.tsx` | Rail desktop **Accueil + 3 groupes** |
| `components/layout/app-shell/SuperAdminMobileNav.tsx` | Drawer mobile aligné sur la même hiérarchie |
| `components/layout/app-shell.tsx` | Branchement conditionnel + libellé header contextuel |
| `components/layout/app-shell/MobileSidebar.tsx` | Prop `isSuperAdmin` → délègue à `SuperAdminMobileNav` |

**Conservé pour les autres rôles :** `PrimarySidebar`, `SecondarySidebar`, `GovernanceSidebarSection` (menu secondaire métier / admin existant).

---

## 3. Comportements collapsible (homogènes)

- **Ouverture / fermeture** : clic sur l’en-tête de groupe (chevron animé `transition-transform`).
- **Persistance** : clés `localStorage` `rempres_super_admin_nav:{actions|archives|settings}` (`1` / `0`).
- **Auto-dépli** : si une URL enfant du groupe est active, le groupe se rouvre.
- **Rail réduit (desktop)** : clic sur l’icône du groupe → **agrandit le rail** puis laisse le groupe utilisable.
- **Mobile** : fermeture du drawer après clic sur un lien (`onNavigate`).

---

## 4. Validation responsive

| Contrôle | Statut |
|----------|--------|
| Build Next + ESLint + types | **OK** (`npm run build`) |
| Matrice device **manuelle** (ultra-wide → mobile small) | **Non exécutée** dans cette session |
| Scroll vertical rail | `overflow-y-auto` sur le conteneur nav |

---

## 5. Validation mobile

| Contrôle | Statut |
|----------|--------|
| Drawer existant (`AppShell`) + contenu `SuperAdminMobileNav` | **Implémenté** |
| Overlay fermeture | Inchangé (`onClick` backdrop) |

---

## 6. Validation active states

- Liens : surbrillance `bg-white/20` si `pathMatches(href, pathname)` (gestion partielle des `?` sur `href`).
- Groupe : surbrillance en-tête si `segmentActive` **ou** enfant actif.

---

## 7. Permissions / visibilité

- Le rail super_admin s’affiche si `isSuperAdmin` (fourni par `getLayoutAccess()` côté layout).  
- Les **garde-fous serveur** sur chaque route restent la source de vérité ; la sidebar ne remplace pas RLS / middleware.

---

## 8. Suppression sidebar secondaire (super_admin)

**Confirmé :** `SecondarySidebarPanel` n’est **pas** rendu pour `isSuperAdmin`.

---

## 9. Navigation unifiée (super_admin)

Structure officielle **rail unique** :

1. **Accueil** → `/dashboard`  
2. **Actions** (repliable) : vue d'ensemble, approbations, alertes, audit, journaux, activité système.  
3. **Archives** (repliable) : raccourcis de **supervision** (archives admin, vues analytiques read-only, stubs départements, export journaux, historique ventes pour traçabilité).  
4. **Paramètres** (repliable) : utilisateurs, permissions (`/config`), sécurité, devise, notifications (`/settings`), système (`/admin`).

---

## 10. Performance

- Pas de `useEffect` sur le chemin entier hors groupes collapsibles.  
- Pas de souscription realtime ajoutée.

---

## 11. Accessibilité

- `aria-expanded` sur les boutons d’en-tête de groupe.  
- `aria-label` sur `<nav>`.  
- **Non couvert** : tests clavier complets (Tab trap dans groupes), audit WCAG tiers.

---

## 12. Architecture sidebar « globale » pour l’ERP

- **`CollapsibleNavGroup`** est réutilisable pour d’autres rôles (à brancher progressivement).  
- Les **données** super_admin restent centralisées dans **`lib/navigation/super-admin-nav.ts`**.

---

## 13. Problèmes résolus

1. **Double navigation** super_admin (rail métier + panneau secondaire).  
2. **Mélange** Vente / Finance / RH dans le **rail principal** pour le rôle supervision.

---

## 14. Risques restants (honnête)

| Risque | Détail |
|--------|--------|
| Liens **Archives** | Plusieurs cibles sont des **vues analytiques** ou stubs (`/formation`, `/marketing`) — pas uniquement des « archives » au sens strict base de données. |
| **URL directe** métier | Un super_admin peut toujours saisir `/vente/...` ; le header regroupe sous **Actions** (fallback `getSuperAdminNavSegment`). |
| **Persistance** | `localStorage` peut être indisponible (mode privé strict) ; comportement par défaut = groupes ouverts. |
| **Duplication sémantique** | « Notifications » → `/settings` et « Alertes » → `/admin/alerts` — périmètres différents, libellés à affiner si besoin produit. |

---

## 15. Confirmation (portée réelle)

Pour le rôle **super_admin** dans `AppShell` :

- **Stable** : build production vert.  
- **Factorisée** : données + groupe collapsible dédiés.  
- **Enterprise-grade** : hiérarchie explicite, sans panneau secondaire.  
- **Responsive** : drawer + rail ; **pas** de certification QA device complète.  
- **Scalable** : ajuster `SUPER_ADMIN_NAV_GROUPS` sans toucher au layout général.  
- **Production-ready** : sous réserve des risques §14 et des tests métier habituels.

---

*Fin du rapport — Phase 1.1 · Sidebar foundation super_admin.*
