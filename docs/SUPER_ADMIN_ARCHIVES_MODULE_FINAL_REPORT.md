# SUPER_ADMIN — Module Archives (phase 1.4) — rapport de validation

**Date (contexte projet)** : 2026-05-13  
**Périmètre** : gouvernance historique, lecture seule côté super_admin sur les surfaces d’archives admin, navigation unifiée, suppression du code mort évident lié à l’ancien bandeau Actions-only.

Ce rapport est **strict et honnête** : il liste ce qui a été livré, les limites connues, et ce qui reste un risque ou une dette.

---

## 1. Éléments supprimés ou retirés du chemin d’exécution

| Élément | Action |
|--------|--------|
| `app/(app)/archives/ArchivesPageClient.tsx` | Supprimé (hub remplacé par `ArchivesGovernanceHub`). |
| `components/actions/ActionsGovernanceChrome.tsx` | Supprimé (remplacé par `GovernanceChrome` mutuellement exclusif Actions/Archives). |
| Hub `/archives` basé sur liens métier génériques | Remplacé par hub de gouvernance aligné sur `ARCHIVES_GOVERNANCE_NAV`. |

---

## 2. Validation lecture seule (super_admin)

| Contrôle | Statut |
|---------|--------|
| UI `/admin/archives` : pas de cases à cocher, pas de barre groupée, pas de restauration / purge pour `super_admin` | **Oui** (`readOnly` sur `AdminGlobalArchivesClient` + sections). |
| Server actions `app/(app)/admin/archives/actions.ts` : mutations refusées pour `super_admin` | **Oui** (`rejectSuperAdminArchiveMutation`). |
| Message utilisateur cohérent (FR) | **Oui** (bandeau + erreur serveur). |

**Limite honnête** : les pages archives **vente** (`/vente/clients/archives`, `/vente/produits/archives`) n’ont pas été entièrement ré-auditées dans cette passe. Si des actions de restauration y restent accessibles au `super_admin` via permissions fines, il faudra les aligner sur la même politique (UI + server).

---

## 3. Suppression / neutralisation des workflows actifs depuis Archives

| Zone | Statut |
|------|--------|
| Bandeau horizontal : pas de double bandeau Actions + Archives sur les URLs réservées Archives | **Oui** (`GovernanceChrome` + `isArchivesGovernancePath` + exclusion export dans `isGovernanceActionsPath`). |
| Hub `/archives` : pas de formulaires, pas de mutations | **Oui** (cartes + liens de navigation). |

---

## 4. Validation catégories Archives (structure officielle)

| Catégorie | Implémentation |
|-----------|----------------|
| Archives ventes | Lien canonique vente + périmètre historique (`/vente/clients/archives`, produits, historique, `/admin/archives` regroupés côté navigation active « sales »). |
| Archives finance / RH / formation | **Vues via audit filtré** (`/admin/audit?department=…`) — pas d’écran métier « archive » dédié dans le code actuel. |
| Exports | `/admin/activity-logs/export`. |
| Suppressions | `/admin/activity-logs?actionKey=delete`. |
| Historique système | `/admin/audit?category=system`. |

**Risque restant** : tant que l’UI audit générique sert de conteneur, la **sémantique** « archive » repose sur la convention d’URL (filtres). Ce n’est pas équivalent à des tables d’archives métier immuables par domaine.

---

## 5. Validation traçabilité

| Contrôle | Statut |
|---------|--------|
| Colonnes date / auteur sur `/admin/archives` (clients & produits) | **Déjà présentes** (libellés `deletedAtLabel`, `deletedByLabel`). |
| Traçabilité « globale » ERP (origine, raison d’archivage, état précédent) | **Partielle** — non modélisée uniformément sur toutes les catégories listées au manifeste. |

---

## 6. Validation permissions

| Contrôle | Statut |
|---------|--------|
| `/archives` (hub) réservé `super_admin` | **Oui** (inchangé côté gate serveur). |
| `/admin/archives` : `isAdminRole` (super_admin inclus) avec mutations bloquées pour super_admin | **Oui**. |

---

## 7. Responsive

| Contrôle | Statut |
|---------|--------|
| Bandeaux `ArchivesGovernanceNav` / `ActionsGovernanceNav` | Scroll horizontal masqué sur petits écrans (comportement existant / cohérent). |
| Hub cartes | Grille responsive (`sm` / `xl`). |

**Non garanti par tests automatisés dans cette passe** : parcours manuel complet tablette / mobile sur toutes les cibles de liens.

---

## 8. Mobile

Même remarque que §7 : pas de campagne de tests devices réalisée ici.

---

## 9. Tables archives

| Contrôle | Statut |
|---------|--------|
| Pagination / tri avancés type « data grid enterprise » | **Hors périmètre immédiat** — les sections admin conservent recherche + table (comportement existant). |
| Lecture seule super_admin | **Oui** (voir §2). |

---

## 10. Factorisation

| Élément | Statut |
|--------|--------|
| Source unique navigation Archives gouvernance | `ARCHIVES_GOVERNANCE_NAV` consommé par le bandeau **et** `SUPER_ADMIN_NAV_GROUPS` (groupe Archives). |
| Bandeau gouvernance partagé admin/actions/archives | `GovernanceChrome`. |

---

## 11. Performance

| Contrôle | Statut |
|---------|--------|
| `useSearchParams` encapsulé dans `Suspense` (sidebars super_admin + libellé header) | **Oui** — évite le pattern « searchParams sans boundary » sur le shell complet. |

**Limite** : léger écart possible un instant entre libellé header (fallback pathname-only) et surbrillance exacte des liens audit avec query, jusqu’à hydratation.

---

## 12. Problèmes résolus dans cette passe

1. Bandeau Actions qui recouvrait les URLs d’exports réservées aux Archives.  
2. Tab « Suppressions » / audit filtré : active state dépendant des **search params**.  
3. Rail super_admin : liens Archives dupliqués / non alignés sur la structure officielle.  
4. `super_admin` pouvait en théorie invoquer les server actions d’archives admin — **fermé**.  
5. Code mort : `ArchivesPageClient`, `ActionsGovernanceChrome`.

---

## 13. Risques restants (explicites)

1. **Archives métier finance / RH / formation** : dépendance à l’audit filtré — pas de modèle de données « archive » homogène.  
2. **Archives vente hors `/admin/archives`** : politique lecture seule super_admin non uniformisée partout.  
3. **Rétention légale / politiques de durée** : non implémentées dans cette livraison (texte de gouvernance uniquement).  
4. **Exports / journaux** : toujours des surfaces techniques ; le verrouillage « gouvernance » est navigationnel + permissions, pas une barrière réseau.

---

## 14. Confirmation (sans sur-promesse)

Le module Archives pour le périmètre **super_admin / gouvernance** traité ici est :

- **Plus stable** sur la navigation (exports / suppressions / audit filtré).  
- **Plus sécurisé** pour les mutations admin d’archives lorsque l’acteur est `super_admin`.  
- **Mieux gouverné** au sens « une source de vérité pour le menu Archives ».  
- **Partiellement** « enterprise-grade » sur la profondeur métier (voir risques §13).

Il n’est **pas** honnête de clamer : « 100 % terminé », « zéro dette », ou « toutes les catégories archives sont des tables immuables dédiées » sans travail data + produit supplémentaire.
