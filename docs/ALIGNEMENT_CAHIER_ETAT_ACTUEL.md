# Alignement Cahier des charges ↔ État actuel de l’application RemPres

**Document de référence** — à mettre à jour à chaque release.  
**Source cahier** : `CAHIER_DES_CHARGES_REMPRES_ERP.md` (racine du workspace)  
**Date de l’audit** : avril 2026  

**Légende** : ✅ Réalisé · 🟡 Partiel / avancé · ⏳ Non réalisé (ou page stub seulement)

---

## Synthèse exécutive

| Zone (cahier §) | Statut global |
|-----------------|---------------|
| Vision & stack (§1–3) | 🟡 Aligné techniquement ; branding document = « RemPres ERP », app = **RemPres** |
| Phase 0 — Setup | ✅ Outils en place (repo, Supabase, Vercel, Cursor) |
| Phase 1 — Fondations | 🟡 Très avancé (auth, layout, RBAC partiel, dashboard, déploiement) |
| Phase 2 — Vente | 🟡 Très avancé (CRUD, POS, PDF, stock, devises, historique) ; lacunes listées ci-dessous |
| Phases 3 à 7 | ⏳ Non démarrées en profondeur (stubs / coming-soon) |
| QA / transversal (§6) | 🟡 Partiel (pas de suite de tests auto complète, Ctrl+K, notifications temps réel absents) |

**Position actuelle** : le projet a **largement dépassé** la « Phase 0 » du cahier (encore marquée « en cours » dans le texte statique du document) et **couvre l’essentiel des fondations + du module Vente** décrits en Phases 1 et 2. Les autres modules métier sont **volontairement** en attente (roadmap §5).

---

## 1) Statut global du projet (cahier §1 « Vision »)

| Élément cahier | État réel |
|----------------|-----------|
| Statut : En préparation / 0 % | **À actualiser** : le produit est **en développement avancé / recette**, pas à 0 %. |
| Phase en cours : Phase 0 | **Obsolète dans le texte** — en pratique : **Phase 1–2** largement couvertes. |
| GitHub + `rempres-erp` | ✅ |
| Supabase + PostgreSQL | ✅ |
| Vercel | ✅ (config + variables à maintenir) |
| Stack Next / TS / Tailwind / Lucide | ✅ (shadcn partiel selon composants) |

---

## 2) Départements (cahier §1.3)

| Département | Cahier | Implémentation actuelle |
|-------------|--------|-------------------------|
| Direction / Super Admin | À développer | 🟡 Dashboard, admin users, journal, paramètres implicites |
| Formation | À développer | ⏳ Route → `coming-soon` |
| Vente / Boutique | À développer | 🟡 **Noyau livré** (clients, produits, POS, historique, PDF) |
| Consultation | À développer | ⏳ Stub |
| RH | À développer | ⏳ Stub |
| Marketing | À développer | ⏳ Stub |
| Logistique | À développer | ⏳ Stub |
| Comptabilité / Finance | À développer | 🟡 `financial_transactions` côté données ; **pas** module Finance complet |
| Paramètres système | À développer | 🟡 Config app, devises store ; **pas** écran paramètres exhaustif |

---

## 3) Branding & design system (cahier §2)

| Exigence | Statut |
|----------|--------|
| Couleurs Primary / Secondary / etc. | 🟡 Globalement respectées (Tailwind `primary`, etc.) |
| DataTable header bleu | 🟡 Tables produits / clients alignées sur l’esprit du cahier |
| Sidebar 260px, actif, mobile | ✅ `app-shell` |
| Nom produit « RemPres ERP » | 🟡 App unifiée sous **RemPres** + `lib/config` |

---

## 4) Architecture technique (cahier §3)

| Composant cible | Statut |
|-----------------|--------|
| Next.js 14 App Router | ✅ |
| Zod | ✅ (validations produits, ventes, etc.) |
| TanStack Query | 🟡 Présence dans dépendances / utilitaires ; usage **non homogène** partout |
| Zustand | ✅ (ex. devises) |
| Recharts | ⏳ Graphique dashboard en **barres CSS**, pas Recharts |
| @react-pdf/renderer | ✅ Reçu vente |
| Structure dossiers `(auth)` / `(dashboard)` | 🟡 Routes `app/` réorganisées différemment mais fonctionnellement équivalentes |
| `hooks/usePermissions` etc. | 🟡 Logique surtout dans `lib/server/permissions` + pages |

---

## 5) Sécurité (cahier §3)

| Exigence | Statut |
|----------|--------|
| Auth email / mot de passe | ✅ |
| RLS | 🟡 À maintenir sur **chaque** nouvelle table ; vente/clients/produits selon scripts exécutés |
| Middleware | ✅ + `getUser()`, profil `is_active`, admin |
| RBAC / `permissions` | 🟡 En place pour modules gérés ; matrice complète **non** sur tous les modules |
| `activity_logs` | ✅ + exports, JSON signé (selon implémentation) |
| Soft delete `deleted_at` | 🟡 Là où le modèle l’utilise |
| 2FA | ⏳ Futur (cahier) |

---

## 6) Roadmap — alignement phase par phase

### Phase 0 — Configuration & Setup (cahier §5)

| Livrable | Statut |
|----------|--------|
| GitHub, Supabase, Cursor, Vercel, workspace | ✅ (Notion = externe au repo) |

### Phase 1 — Fondations (cahier §5, Prompts 1–8)

| Livrable | Statut | Commentaire |
|----------|--------|---------------|
| Next.js + dépendances | ✅ | |
| Connexion Supabase | ✅ | |
| Tables core | 🟡 | Évolué avec vente, profils, logs, etc. |
| Login email / password | ✅ | + invitation, reset, set-password |
| Layout sidebar / branding | ✅ | `app-shell` |
| Rôles / permissions | 🟡 | `profiles`, `app_roles`, middleware ; matrice exhaustive en attente |
| UI réutilisable | 🟡 | Badge, KpiCard, EmptyState, PageHeader, etc. |
| Dashboard KPI | ✅ | + graphique 7 jours, activité récente |
| Déploiement Vercel | ✅ | Variables à surveiller |

### Phase 2 — Vente (cahier §5, Prompts 9–12)

| Livrable | Statut | Commentaire |
|----------|--------|---------------|
| Tables Vente | ✅ | `sales`, `sale_items`, `stock_movements`, etc. |
| Produits CRUD + images + stock | 🟡 | Images + stock OK ; **tableau** enrichi labels métier |
| Clients | ✅ | + création rapide au POS |
| POS | ✅ | UX premium itérée |
| Historique + filtres | 🟡 | + filtre client, page **détail** vente |
| Facture PDF | ✅ | Reçu |
| Dépenses (`expenses`) | ⏳ | Table possible en SQL ; **UI** non priorisée |
| KPI vente | 🟡 | Dashboard + historique ; pas module « KPI vente » isolé |
| Devises GNF/XOF/USD/EUR | 🟡 | Store + affichage ; MAJ taux **paramétrable** à consolider |

**Checklist QA Phase 2 (cahier §6)** — repère rapide :

| Critère cahier | Statut |
|----------------|--------|
| Produit + image + stock | 🟡 |
| Badge stock bas | ✅ |
| Vente panier + paiement | ✅ |
| Déduction stock | ✅ (RPC transactionnelle) |
| Référence `VNT-…` | ✅ (trigger / logique SQL) |
| Facture PDF + conversion | 🟡 PDF OK ; détail conversion sur reçu selon config |
| Historique | 🟡 |
| Export CSV (ventes / journal) | 🟡 Journal / activité ; export vente **à valider** selon besoin |

### Phase 3 — Formation (cahier §5)

| Livrable | Statut |
|----------|--------|
| Tout le module | ⏳ | Aucune table métier « formation » branchée en UI complète |

### Phase 4 — Consultation (cahier §5)

| Livrable | Statut |
|----------|--------|
| Tout le module | ⏳ | Stub only |

### Phase 5 — RH + Marketing + Logistique (cahier §5)

| Livrable | Statut |
|----------|--------|
| RH / Marketing / Logistique | ⏳ | Stubs + `coming-soon` |

### Phase 6 — Finance globale + transversal (cahier §5, Prompts 16–19)

| Livrable | Statut |
|----------|--------|
| Recettes / dépenses / bénéfice global | 🟡 | `financial_transactions` pour revenus typés ; **pas** compta complète |
| Notifications in-app | ⏳ |
| Paramètres complets | 🟡 Partiel |
| Recherche Ctrl+K | ⏳ |
| Exports multi-format | 🟡 CSV/JSON côté admin journal ; Excel global ⏳ |
| Rapports consolidés DG | ⏳ |

### Phase 7 — Finalisation & production (cahier §5, Prompt 20)

| Livrable | Statut |
|----------|--------|
| Tests manuels complets | 🟡 En continu |
| Perf / sécurité / README / déploiement stable / mobile | 🟡 Partiel — **v1.0** peut être visée, pas une certification « fin phase 7 » |

---

## 7) Systèmes transversaux (cahier §6 « QA » — bas de page)

| Fonction | Statut |
|----------|--------|
| Notification stock bas (in-app) | 🟡 Alerte **dashboard** ; pas centre de notifs |
| Notification vente importante | ⏳ |
| Badge notifications temps réel | ⏳ |
| Ctrl+K recherche globale | ⏳ |
| MAJ taux, écran paramètres taux | 🟡 Logique côté serveur possible ; UI paramètres **à finaliser** |
| Export Excel | ⏳ (hors export CSV/JSON existants) |

---

## 8) Où s’est arrêté le développement « pour l’instant »

1. **Modules métier** hors Vente (Formation, Consultation, RH, Marketing, Logistique, Finance « métier ») : **non construits** au sens cahier — uniquement **navigation** et page **Bientôt disponible**.
2. **Phase 2 Vente** : il reste typiquement **dépenses (UI)**, **exports ventes** si exigés au même niveau que le journal, **paramètres devises** complet, recette **exhaustive** checklist §6.
3. **Phase 6–7** : notifications, Ctrl+K, rapports DG, finalisation **production** (tests, perf, doc) = **travail à planifier** après stabilisation des bugs remontés en recette.
4. **Cahier des charges statique** : la section *Statut global / Progression* en tête de fichier ne reflète **pas** encore l’avancement réel — **mise à jour recommandée** (voir section 9).

---

## 9) Proposition de mise à jour du texte du cahier (copier-coller)

Vous pouvez remplacer dans `CAHIER_DES_CHARGES_REMPRES_ERP.md` (§1) :

```text
### Statut Global du Projet
- Statut actuel: En développement actif (noyau Vente + fondations)
- Date de démarrage: Avril 2026
- Phase en cours: Phase 2 (Vente) largement amorcée — Phases 3–6 non démarrées en profondeur
- Progression globale: Estimation indicative ~35–45 % (fonctionnel / roadmap 7 phases) — à affiner
```

*(Les pourcentages sont indicatifs ; ajustez selon votre critère de « livré / restant ».)*

---

## 10) Prochaine étape recommandée (décision produit)

1. **Geler** une **liste de bugs** recette sur le périmètre Vente + Auth + Admin.  
2. **Choisir** : soit **poursuivre Phase 2** (dépenses, exports, paramètres devises), soit **démarrer Phase 3** (Formation) selon priorité business.  
3. **Actualiser** ce fichier `ALIGNEMENT_CAHIER_ETAT_ACTUEL.md` à chaque sprint.

---

*Document généré pour cohérence entre le cahier statique et le dépôt `rempres-erp`.*
