# REMPRES ERP — Super Admin · verrouillage final sidebar (phase 1.1.5)

**Date :** 2026-05-14  
**Périmètre :** archives navigation honnêtes, header sans fallback trompeur, accès URL **middleware** aligné sur `canAccessPathForProfile`, tests unitaires.

---

## 1. Corrections Archives (navigation)

| Avant | Après |
|-------|--------|
| Liens vers vues analytiques actives (`/finance/visual`, `/rh/visual`, `/logistique/visual`, `/formation`, `/marketing`) | **Supprimés** du groupe Archives |
| Mélange « pseudo-départements » | **7 entrées** limitées à hub archives, corbeille admin, archives clients/produits, historique ventes, exports journaux, audit |

Fichier : `lib/navigation/super-admin-nav.ts` (`SUPER_ADMIN_NAV_GROUPS` → groupe **Archives**).

---

## 2. Validation lecture seule (côté politique d’accès)

| Contrôle | Implémentation |
|----------|----------------|
| Super_admin **sans** POS / CRM / clients actifs | `lib/auth/supervision.ts` : exceptions explicites **read-only** vente (`SUPER_ADMIN_READ_ONLY_VENTE_PREFIXES`) |
| Blocage `/vente/*` opérationnel | `isSuperAdminOperationalPath` exclut d’abord les chemins read-only |
| Autorisation `/actions`, `/archives`, `/config` | Ajout à `SUPER_ADMIN_GOVERNANCE_ALLOWED_PREFIXES` |
| `canAccessPathForProfile` | `lib/auth/permissions.ts` : super_admin → gouvernance **ou** `isSuperAdminReadOnlyVentePath` |

**Lecture seule UI** sur chaque page d’archive : non garantie par cette phase (contrôle serveur + navigation seulement).

---

## 3. Suppression navigation hybride (Archives)

Le groupe **Archives** ne sert plus de raccourci vers des modules métiers « vivants » ; uniquement traçabilité / exports / historiques listés au §1.

---

## 4. Header — gouvernance du contexte

- Introduit `SuperAdminNavHighlight` incluant **`unmapped`**.
- Libellés centralisés : `SUPER_ADMIN_HEADER_LABELS` (`lib/navigation/super-admin-nav.ts`).
- Fallback honnête : **`Vue hors menu supervision`** (plus de libellé **Actions** forcé pour chemins non mappés).
- `/dept` → `unmapped` (hors structure du rail super_admin).

Fichier consommateur : `components/layout/app-shell.tsx`.

---

## 5. Fallback corrigé

| Cas | Libellé |
|-----|---------|
| Routes mappées | Accueil / Actions / Archives / Paramètres |
| `/dept`, chemins autorisés hors menu | **Vue hors menu supervision** |

---

## 6. Contrôle accès URL (middleware)

- Préfixes protégés étendus : **`/actions`**, **`/archives`**, **`/config`** (`middleware.ts`).
- Matcher aligné : session + `canAccessPathForProfile` appliqués également sur ces routes.

---

## 7. Cohérence rôle / navigation

- Rail super_admin inchangé structurellement (phase 1.1).
- Politique serveur **renforcée** : historique ventes + archives vente + reçus autorisés pour **super_admin** ; nouvelle vente / clients actifs **interdits** (tests §12).

---

## 8. Sidebar governance

- Pas de sidebar secondaire pour super_admin (inchangé 1.1).
- Segments actifs : `unmapped` n’active **aucun** groupe repliable (surbrillance honnête).

---

## 9–10. Responsive / mobile

- Aucune modification UI supplémentaire ; comportements 1.1 conservés.

---

## 11. Accessibilité

- Inchangé (phase 1.1).

---

## 12. Performance

- Pas de logique supplémentaire coûteuse ; `getSuperAdminNavSegment` reste synchrone O(n) sur de petites listes.

---

## 13. Factorisation foundation

- `SUPER_ADMIN_HEADER_LABELS` + `getSuperAdminNavSegment` : source unique pour header + futurs breadcrumbs.
- Politiques super_admin : **`lib/auth/supervision.ts`** (source unique avec `permissions.ts`).

---

## 14. Problèmes résolus

1. Archives « hybrides » dans le rail.  
2. Fallback header **Actions** mensonger.  
3. `/actions`, `/archives`, `/config` **non** couverts par le middleware (trou de gouvernance).  
4. Super_admin **bloqué** de `/vente/historique` malgré besoin de traçabilité — **corrigé** via exceptions read-only.

---

## 15. Risques restants (honnête)

| Risque | Détail |
|--------|--------|
| Lecture seule **métier** | Les pages `/vente/historique` etc. peuvent encore exposer des actions UI si les composants ne les masquent pas par rôle — **hors périmètre** de ce verrou navigation + middleware. |
| `/dept` | Toujours autorisé par politique gouvernance ; libellé **unmapped** dans le header super_admin. |
| Autres rôles | Extension `ADMIN_CONSOLE_ALLOWED_PREFIXES` pour éviter régression d’accès console sur `/config` / `/actions` / `/archives` — à surveiller si de nouvelles routes « console » apparaissent. |

---

## 16. Confirmation (portée réelle)

Pour **phase 1.1.5** :

- La **foundation sidebar** super_admin est **verrouillée** au sens **navigation + libellés + politique d’accès centralisée** et **tests** à jour.  
- Ce n’est **pas** une certification « 100 % lecture seule sur toutes les pages » sans revue écran par écran.

---

*Fin du rapport — Phase 1.1.5 · Final lock.*
