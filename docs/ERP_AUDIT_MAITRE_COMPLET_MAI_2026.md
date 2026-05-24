# Audit maître complet — RemPres ERP

**Date :** 24 mai 2026  
**Périmètre :** `rempres-erp/` + cahier des charges racine + historique Git + 74 rapports `docs/` + sessions de développement (avril → mai 2026)  
**Destinataires :** équipe produit, audits croisés (Claude, ChatGPT, autres IA), documentation de continuité  
**Règle absolue respectée dans les développements récents :** le cockpit **Super Admin** (`/dashboard`, `DashboardClient`, `SuperAdminCockpitClient`) est **gelé** — référence UX, non modifié lors des factorisations département.

---

## Table des matières

1. [Synthèse exécutive](#1-synthèse-exécutive)  
2. [Méthodologie et limites](#2-méthodologie-et-limites)  
3. [Logique métier et architecture de l’application](#3-logique-métier-et-architecture-de-lapplication)  
4. [Chronologie complète du développement](#4-chronologie-complète-du-développement)  
5. [Cahier des charges — conformité](#5-cahier-des-charges--conformité)  
6. [État d’avancement global (pourcentages)](#6-état-davancement-global-pourcentages)  
7. [Audit par département (détaillé)](#7-audit-par-département-détaillé)  
8. [Super Admin et gouvernance](#8-super-admin-et-gouvernance)  
9. [Transversal : RBAC, middleware, sécurité](#9-transversal--rbac-middleware-sécurité)  
10. [Transversal : event bus, notifications, automations](#10-transversal--event-bus-notifications-automations)  
11. [Base de données et migrations SQL](#11-base-de-données-et-migrations-sql)  
12. [Duplications, dette technique et incohérences](#12-duplications-dette-technique-et-incohérences)  
13. [Bugs, incidents et corrections majeures](#13-bugs-incidents-et-corrections-majeures)  
14. [Performance, fiabilité et production](#14-performance-fiabilité-et-production)  
15. [Tests et qualité](#15-tests-et-qualité)  
16. [Ce qui a fonctionné / ce qui n’a pas fonctionné](#16-ce-qui-a-fonctionné--ce-qui-na-pas-fonctionné)  
17. [Backlog priorisé (à faire)](#17-backlog-priorisé-à-faire)  
18. [Index documentaire pour audits croisés](#18-index-documentaire-pour-audits-croisés)  
19. [Annexes métriques](#19-annexes-métriques)

---

## 1. Synthèse exécutive

### 1.1 Verdict en une phrase

**RemPres ERP est une plateforme web Next.js / Supabase crédible sur le noyau Vente + CRM + Finance + gouvernance Super Admin, avec une architecture départementale récente (`/dept/*`) et des fondations enterprise (SQL 001–062, event bus, RBAC générique), mais aucun département métier n’est « terminé » au sens d’un ERP professionnel homogène — seul **Vente** est certifié comme **référence d’implémentation** (standard B2.4).

### 1.2 Chiffres clés (mai 2026)

| Indicateur | Valeur |
|------------|--------|
| Commits Git (branche `main`) | ~80+ depuis avril 2026 |
| Fichiers `.tsx` (app, components, lib, modules) | ~652 |
| Tests unitaires Vitest | ~42 fichiers |
| Scripts SQL `supabase/sql/` | 66 fichiers |
| Pages App Router `app/(app)/**/page.tsx` | ~242 |
| Rapports projet `docs/` | 74 |
| Départements métier cibles | 7 (+ gouvernance SA) |
| Départements « finis » (critère ERP complet) | **0** |
| Département le plus avancé | **Vente** (~85 %) |
| Départements les moins avancés | **Formation, Consultation, Marketing** (~15–25 %) |

### 1.3 Progression globale (estimation honnête)

| Référentiel | % estimé | Commentaire |
|-------------|----------|-------------|
| **Roadmap CDC 7 phases** (avr. 2026) | **~48–52 %** | Mise à jour mai : dépasse largement Phases 0–2, amorce Phases 5–6, Phases 3–4 quasi vides |
| **Alignement `ALIGNEMENT_CAHIER` (avr.)** | indiquait **35–45 %** | **Sous-estime** le travail mai (gouvernance, RH SQL, bus, `/dept/*`) |
| **Standard cockpit B2.4 (7 dept)** | **~22 %** homogène | 1/7 runtimes certifiés (Vente) ; Finance partiel ; autres placeholders ou partiels |
| **Prêt production « ERP Guinée complet »** | **~40–45 %** | Utilisable en prod pour **vente + admin** ; risque 404 / KPI vides ailleurs |

### 1.4 Réponse directe : quels départements sont « finis » ?

| Département | Commencé ? | Terminé ? | Niveau |
|-------------|------------|-----------|--------|
| **Vente** (+ CRM) | Oui | **Non** (le plus complet) | **~85 %** — opérationnel |
| **Finance** | Oui | **Non** | **~75 %** — CFO + enterprise + dépenses |
| **RH** | Oui | **Non** | **~60 %** — pages RH, KPI partiels |
| **Logistique** | Oui | **Non** | **~55 %** — hub + stock, cockpit dept incomplet |
| **Marketing** | Oui (cockpit) | **Non** | **~25 %** — KPI seulement, pas d’UI campagnes |
| **Formation** | Oui (cockpit) | **Non** | **~20 %** — coming-soon racine |
| **Consultation** | Oui (cockpit) | **Non** | **~20 %** — coming-soon racine |
| **Super Admin** | Oui | **Gelé / quasi complet** | **~85 %** gouvernance — **ne pas modifier** |

**Aucun département n’est « fini »** au sens : toutes les routes sidebar existent, CRUD complet, KPI live, tests, RLS validés, event bus branché, documentation à jour.

---

## 2. Méthodologie et limites

### 2.1 Sources primaires

- `CAHIER_DES_CHARGES_REMPRES_ERP.md` (racine workspace)  
- `docs/ALIGNEMENT_CAHIER_ETAT_ACTUEL.md` (instantané **avril 2026** — partiellement obsolète)  
- `docs/AUDIT_CHRONOLOGIQUE_PROJET_REMPRES_ERP.md`  
- `docs/PARCOURS_COMPLET_REMPRES_DU_CAHIER_DES_CHARGES_A_AUJOURDHUI.md`  
- **74 rapports** `docs/ERP_*`, `docs/PHASE*`, `docs/SUPER_ADMIN_*`, `docs/RBAC_*`  
- **Code** : `app/`, `lib/`, `components/`, `modules/`, `middleware.ts`, `types/database.types.ts`  
- **Git** : `git log` (~80 commits récents sur `main`)  
- **Sessions mai 2026** (factorisation sidebar, `/dept/*`, middleware access-denied, quick actions, reset SQL)

### 2.2 Limites explicites

- Impossible de reconstituer **chaque message** du tout premier prompt Cursor non exporté ; le narratif le plus fidèle est `PARCOURS_COMPLET` + commits.  
- Les **%** sont des **estimations pondérées** (couverture routes + données + UX + gouvernance), pas une mesure automatique.  
- L’audit **ne remplace pas** une recette utilisateur terrain ni un pentest.  
- Le header CDC (« Progression 0 %, Phase 0 ») est **fausse** par rapport au code — document historique non maintenu.

---

## 3. Logique métier et architecture de l’application

### 3.1 Vision produit

ERP multi-départements pour une entreprise en **Guinée** : vente/commerce, finance (GNF + devises), RH, formation, consultation, marketing, logistique — avec **pilotage central Super Admin** (gouvernance, pas d’opérations vente directes).

### 3.2 Stack technique

| Couche | Technologie |
|--------|-------------|
| Front | Next.js 14 App Router, React, TypeScript, Tailwind |
| UI | Composants maison + patterns shadcn-like, Lucide |
| Données client | TanStack Query (usage **hétérogène**) |
| État local | Zustand (ex. devises) |
| Auth | Supabase Auth (invitation, profils) |
| API données | Supabase PostgreSQL + RLS |
| Déploiement | Vercel (`app.rempres.com`) |
| Graphiques | Recharts (cockpits dept) + patterns CSS historiques |

### 3.3 Modèle d’organisation (décisions M1 / M1.5 — normatif)

```
SUPER_ADMIN  →  /dashboard  (gouvernance globale, gelé)
MANAGER/AGENT + department_key  →  /dept/{slug}  (cockpit département)
MANAGER ADMINISTRATION  →  console admin (/settings, /admin/*, /dept hub)
CRM  →  sous-ensemble de VENTE (pas un 8e département)
FORMATION + CONSULTATION  →  même rail sidebar (décision M1.5), slugs séparés en URL
```

**Trois référentiels départements coexistent encore (dette M1) :**

| Référentiel | Fichier | Usage |
|-------------|---------|--------|
| A | `lib/constants/departments.ts` | UI cartes, `/dept/[deptKey]` |
| B | `lib/departments/department-config.ts` | RBAC, middleware, navigation M3 |
| C | `lib/constants/dept-nav-configs.ts` | **Legacy** rôles `responsable_*` — **souvent faux hrefs** |

### 3.4 Flux utilisateur type

1. Login → middleware (`is_active`, profil)  
2. Redirection : SA → `/dashboard` ; manager vente → `/dept/vente` ; legacy → `/dashboard` ou dept  
3. Sidebar : `getSidebarForRole()` → rail SA **ou** `DepartmentBusinessSidebar` **ou** legacy  
4. Cockpit dept : `DeptHomePage` + `getDeptDashboardData()`  
5. Opérations : routes `/vente/*`, `/finance/*`, etc.  
6. Mutations → logs `activity_logs` + (partiellement) event bus → notifications

### 3.5 Zones cockpit officielles (M3 / B2.4)

Ordre normatif : `context_header` → `kpi_primary` → `alerts` → `charts` → `recent_activity` → `quick_actions`

**Implémentation actuelle `DeptHomePage` :** banner, KPI, graphiques 7j, alertes, activité, **actions rapides** (mai 2026). Aligné M3 pour les 7 départements.

**Implémentation parallèle non routée :** `VenteCockpitClient`, `FinanceCockpitClient` (B2.3 / B3) — payloads complets mais **non montés** sur des routes.

---

## 4. Chronologie complète du développement

### 4.1 Phase 0 — Genèse (avril 2026)

| Date / commit | Jalon |
|---------------|--------|
| `f6ae1d0` | Initial commit |
| `1fca1e7` | **ERP v1.0** : auth invitation-only, RBAC départements, POS, CRUD clients/produits, journal activité, KPI dashboard, pages coming-soon, 404, branding |
| `f236f8b` | POS premium, graphique 7 jours, timeline dashboard |
| `6923d69` | Produits, client inline POS, historique détail, middleware `is_active` |
| `cc55b1c` | Module finance (base) |

**État :** fondations réelles posées ; CDC encore marqué « 0 % ».

### 4.2 Phase 1 — Stabilisation auth & admin (avril 2026)

- Permissions « safe » (pas de crash serveur)  
- Page admin users, invitations, callback, sync profil  
- Exports signés, `activity_logs` enrichis (narratif PARCOURS P1.5–P1.6)  
- Archives admin, devises, tests E2E (`a8a64a6`)

### 4.3 Phase 2 — UI industrialisation (rapports PHASE2 → 4.9)

- Standardisation `page-wrapper`, `PageHeader`, `KpiCard`, `TableShell`  
- Filtres, pagination, debounce recherche  
- Modales métier (clients, produits, dépenses, approbations)  
- **Honesty locks** : refus de prétendre « 100 % » sans preuve

### 4.4 Phase 3 — Gouvernance & plateforme (mai 2026, commits)

| Commit / thème | Livrable |
|----------------|----------|
| `44576a7` → `18e69cb` | Stack gouvernance, direction/actions/archives, dashboards dept selector |
| `618a637` | RH enterprise |
| `e378344` | Migrations SQL **042–060**, hubs admin |
| `6df015d` | Centres visuels dashboard |
| `7a546b7`, `7ff9672` | Auth centralisée, hardening prod |

### 4.5 Phase 4 — Architecture métier Vente & Finance (mai 2026)

| Mission | Contenu |
|---------|---------|
| **B1.1–B1.6** | Architecture domaine Vente verrouillée (spec) |
| **B2.0–B2.3** | Runtime vente, CRM write path, conversion devis→vente, cockpit live |
| **B2.4** | Standard gouvernance ERP (contrat normatif) |
| **B3** | Finance department + enterprise SQL 047 |
| **B3.1–B3.2+** | Approval engine, event bus |
| **P1–P9** | CRM events, notifications, finance/HR events, observability |

### 4.6 Phase 5 — UX M3 & factorisation (mai 2026)

| Mission | Contenu |
|---------|---------|
| **M1, M1.5** | Fondation départements, décisions canoniques |
| **M2, M2.5** | Matrice rôles, visibilité navigation |
| **M3, M3.5, M3.75** | Sidebar cockpit, alignement UX P0, verrou Vente rail unique |
| `5be85a1` → `dea145a` | NAV_CONFIG, accordéon dept, admin consolidation |
| `38339f5` | RBAC sidebar factorization |
| `a60c31b` | `DeptHomePage` factorisé (7 dept) |
| `4b7df9f` | Routes `/dept/*` + redirects legacy |
| `b0cd450` | Fix middleware `/dept` access-denied |
| `3e4ba65` | Actions rapides dept |
| `5b4c644` / `aa80285` | Scripts reset données SQL |

### 4.7 Corrections récentes (session utilisateur)

- **Accès refusé** sur `/dept/vente` : middleware ne reconnaissait que `/vente`, pas `/dept/vente` → `canProfileAccessDeptPath`  
- **Ancienne UI** : utilisateurs sur `/vente/dashboard` → redirects + `dashboardRoute` → `/dept/*`  
- **Sidebar SA-like** pour managers : `getSidebarForRole` + `DepartmentBusinessSidebar`  
- **Reset données** : scripts `999_reset_all_data.sql` v2

---

## 5. Cahier des charges — conformité

### 5.1 Respect global du CDC

| Domaine CDC | Respect | Écart |
|-------------|---------|-------|
| Vision multi-départements | **Oui** | Organisation hybride (3 référentiels dept) |
| Stack Next/Supabase/Vercel | **Oui** | — |
| Branding couleurs | **Largement** | Nom « RemPres » vs « RemPres ERP » |
| Auth + RLS + middleware | **Oui** | RLS à maintenir sur chaque nouvelle table |
| RBAC `permissions` | **Partiel** | Rôles génériques `manager`/`agent` + legacy `responsable_*` |
| 7 phases roadmap | **Non linéaire** | Saut direct à gouvernance + vente + finance |
| Modules 3–7 (formation…logistique) | **Faible** | Stubs ou partiels |
| 2FA, Ctrl+K, notifs temps réel | **Non** | Prévu « futur » CDC |
| Un rôle = un responsable (CDC §4) | **Non aligné** | Modèle générique + `department_key` (M2) |

### 5.2 Départements CDC vs implémentation

| # CDC | Département CDC | Statut réel mai 2026 |
|-------|-----------------|----------------------|
| 1 | Direction Générale | = **Super Admin** `/dashboard` (pas dept séparé) |
| 2 | Formation | Cockpit `/dept/formation` ; racine → **coming-soon** |
| 3 | Vente | **Complet relatif** commerce + CRM |
| 4 | Consultation | Cockpit ; racine → **coming-soon** |
| 5 | RH | **Partiel** (pages + SQL rh_*) |
| 6 | Marketing | Cockpit ; racine → **coming-soon** |
| 7 | Logistique | **Partiel** (12 routes, SQL logistics_*) |
| 8 | Finance | **Avancé** (pas seulement comptable stub) |
| 9 | Paramètres | = **`/settings`** gouvernance (pas dept) |

### 5.3 Mise à jour CDC recommandée

Le fichier `CAHIER_DES_CHARGES_REMPRES_ERP.md` doit être actualisé (§1 statut, liste départements, fusion Formation/Consultation, rôles génériques, progression **~50 %**).

---

## 6. État d'avancement global (pourcentages)

### 6.1 Par phase CDC (7 phases)

| Phase CDC | Description | % | Preuve |
|-----------|-------------|---|--------|
| **0** Setup | Repo, Supabase, Vercel | **95 %** | En prod |
| **1** Fondations | Auth, layout, RBAC, logs | **90 %** | Middleware, permissions, activity_logs |
| **2** Vente | CRUD, POS, stock, historique | **85 %** | Routes `/vente/*`, CRM |
| **3** Formation | Module formation | **15 %** | Cockpit KPI ; pas de CRUD |
| **4** Consultation | Missions | **15 %** | Idem |
| **5** RH + Marketing + Logistique | Trois modules | **45 %** moyenne | RH 60, Log 55, Mkt 25 |
| **6** Finance + transversal | Finance globale, notifs | **65 %** | Finance 75 ; notifs P3 partiel |
| **7** Finalisation prod | Tests, perf, doc | **40 %** | Tests unitaires ; E2E partiel ; doc riche |

**Moyenne pondérée phases CDC : ~48–52 %**

### 6.2 Par couche technique

| Couche | % |
|--------|---|
| Schéma SQL / migrations | **75 %** (large, certaines tables sans UI) |
| API / server loaders | **55 %** |
| UI pages opérationnelles | **50 %** |
| RBAC / middleware | **70 %** |
| Event bus & automations | **35 %** (fondations, peu de mutations branchées) |
| Documentation interne | **90 %** (74 rapports — maintenance lourde) |
| Tests automatisés | **45 %** |

### 6.3 Matrice « Prêt pour un client métier »

| Persona | Prêt ? |
|---------|--------|
| Vendeur / manager vente | **Oui** (avec recette) |
| Comptable / finance | **Partiel** (CFO + enterprise) |
| RH | **Partiel** |
| Logistique | **Partiel** |
| Formation / consultation / marketing | **Non** (cockpit seulement) |
| Super Admin | **Oui** gouvernance (cockpit gelé) |

---

## 7. Audit par département (détaillé)

### 7.1 VENTE (+ CRM) — ~85 % — **Référence B2.4**

**Statut :** Commencé · **Non terminé** · **Le plus avancé**

| Élément | État | Détail |
|---------|------|--------|
| Cockpit `/dept/vente` | ✅ Live | `getVenteCommerceKpis`, graphiques 7j, alertes stock |
| Routes commerce | ✅ | clients, produits, nouvelle-vente, historique, archives, reçu |
| CRM `/vente/crm/*` | ✅ | leads, pipeline, opportunities, quotes, orders, activities, forecasting |
| Sidebar M3 | ✅ | Groupes Commerce + CRM |
| Runtime B2 | ✅ | `vente-cockpit-payload`, commerce KPIs, quote→sale |
| Event bus CRM | 🟡 ~10 % mutations (rapport P1) | Majorité hors bus |
| `VenteCockpitClient` | ⚠️ Orphelin | Non monté — doublon `DeptHomePage` |
| Tests | 🟡 | `b2-3-vente-cockpit-live`, auth-matrix |

**Éléments à ajouter :**
- [ ] Unifier cockpit (supprimer ou router `VenteCockpitClient`)
- [ ] Brancher mutations CRM/vente sur event bus (P1 suite)
- [ ] Exports ventes niveau CDC si exigés
- [ ] Recette E2E complète parcours vente
- [ ] Résoudre frontière stock Vente vs Logistique (spec M1)

**Éléments à corriger :**
- [ ] Liens quick-actions déjà OK
- [ ] Vérifier RLS sur toutes tables `crm_*`

---

### 7.2 FINANCE — ~75 %

**Statut :** Commencé · **Non terminé**

| Élément | État | Détail |
|---------|------|--------|
| Cockpit `/dept/finance` | ✅ | Treasury KPIs, expenses, sales agrégés |
| `/finance` CFO | ✅ | `FinanceDashboardClient` |
| `/finance/depenses` | ✅ | CRUD dépenses |
| Enterprise `/finance/enterprise/*` | ✅ | journal, AR, trésorerie, budgets, reporting (12+ routes) |
| Tables `finance_*` | ✅ | 047, 052 |
| `FinanceCockpitClient` | ⚠️ Orphelin | Doublon |
| Sidebar M3 | 🟡 | Enterprise pas dans groupe officiel M3 |
| Event bus finance | ❌ ~0 % (P4) | Non branché en production |

**À ajouter :**
- [ ] Intégration event bus P4/P5 (seuils, notifications finance)
- [ ] Unifier `/dept/finance` vs `/finance` (UX unique)
- [ ] Sidebar enterprise dans `erp-ux-architecture`
- [ ] Tests E2E parcours comptable

**À corriger :**
- [ ] Deux chemins cockpit (confusion utilisateur)

---

### 7.3 RH — ~60 %

**Statut :** Commencé · **Non terminé**

| Élément | État | Détail |
|---------|------|--------|
| Cockpit `/dept/rh` | 🟡 | KPI live partiels ; placeholders « module en activation » |
| Pages | ✅ | `/rh`, collaborateurs, congés, contrats, présences, recrutement, visual |
| SQL | ✅ | `rh_*` 040–045 |
| Legacy nav | ❌ | `dept-nav-configs` → `/rh/employes` (**404**, vrai = `/rh/collaborateurs`) |
| Event bus HR | 🟡 Fondation P7/P9 | Expansion partielle |

**À ajouter :**
- [ ] KPI dept complets (4e indicateur, graphiques)
- [ ] Aligner `dept-nav-configs` et quick-actions
- [ ] Visual RH hors placeholder repository
- [ ] Tests RH + RLS recrutement

---

### 7.4 LOGISTIQUE — ~55 %

**Statut :** Commencé · **Non terminé**

| Élément | État | Détail |
|---------|------|--------|
| Cockpit `/dept/logistique` | 🟡 | KPI depuis table **`products`** (catalogue vente), pas `logistics_*` |
| Hub `/logistique` | ✅ | `getLogisticsOperationalOverview` |
| Pages | ✅ | stock, entrepôts, mouvements, achats, alertes, livraisons, fournisseurs, reporting, governance |
| SQL | ✅ | `048_logistics_domain_enterprise` |
| Legacy nav | ❌ | `/logistique/articles` manquant → utiliser `/logistique/stock` |

**À ajouter :**
- [ ] KPI cockpit depuis modules logistics (pas products seuls)
- [ ] Corriger nav legacy + quick-actions
- [ ] Tests intégration stock

---

### 7.5 FORMATION — ~20 %

**Statut :** Commencé (minimal) · **Loin de terminé**

| Élément | État |
|---------|------|
| `/dept/formation` | 🟡 KPI si tables `trainings`, `trainees`, `certificates` existent |
| `/formation` | ❌ Redirect **coming-soon** |
| Pages `/formation/formations`, etc. | ❌ **N'existent pas** (nav les annonce) |
| SQL métier formation | ❌ Pas de migrations dédiées trouvées |

**À ajouter (minimal viable) :**
- [ ] Tables + migrations formation (si absentes)
- [ ] 4–6 pages : formations, apprenants, inscriptions, certificats
- [ ] CRUD + RLS
- [ ] Retirer ou implémenter liens sidebar/quick-actions

---

### 7.6 CONSULTATION — ~20 %

**Statut :** Commencé (minimal) · **Loin de terminé**

| Élément | État |
|---------|------|
| `/dept/consultation` | 🟡 Compte `missions` + clients entreprise |
| `/consultation` | ❌ coming-soon |
| Pages missions/agenda/clients | ❌ Absentes |
| Fusion M1.5 avec Formation (nav) | 🟡 Rail formation pointe consultation |

**À ajouter :** même pattern que Formation (missions, agenda, clients, livrables).

---

### 7.7 MARKETING — ~25 %

**Statut :** Commencé (minimal) · **Loin de terminé**

| Élément | État |
|---------|------|
| `/dept/marketing` | 🟡 Compte `campaigns`, `leads` si tables existent |
| `/marketing` | ❌ coming-soon |
| `/marketing/campagnes`, `/marketing/leads` | ❌ Absentes |
| `erp-ux-architecture` | ⚠️ `cockpitRoute: "/marketing/dashboard"` vs réel `/dept/marketing` |

**À ajouter :** UI campagnes/leads ; corriger doc architecture ; tables si absentes.

---

### 7.8 Tableau récapitulatif départements

| Département | Commencé | Terminé | % | Cockpit `/dept` | Opérationnel | SQL métier | UI complète |
|-------------|----------|---------|---|-----------------|--------------|------------|-------------|
| Vente | ✅ | ❌ | 85 | ✅ | ✅ | ✅ | ✅ |
| Finance | ✅ | ❌ | 75 | ✅ | ✅ | ✅ | 🟡 |
| RH | ✅ | ❌ | 60 | 🟡 | 🟡 | ✅ | 🟡 |
| Logistique | ✅ | ❌ | 55 | 🟡 | 🟡 | ✅ | 🟡 |
| Marketing | ✅ | ❌ | 25 | 🟡 | ❌ | 🟡 | ❌ |
| Formation | ✅ | ❌ | 20 | 🟡 | ❌ | ❌ | ❌ |
| Consultation | ✅ | ❌ | 20 | 🟡 | ❌ | 🟡 | ❌ |

---

## 8. Super Admin et gouvernance

### 8.1 Périmètre gelé (NE PAS MODIFIER)

- `app/(app)/dashboard/page.tsx`  
- `DashboardClient.tsx`  
- `SuperAdminCockpitClient.tsx`  
- UX cockpit SA validée (rapports Phase 1.2, sidebar 1.1)

### 8.2 Modules gouvernance livrés

| Module | Route | Statut |
|--------|-------|--------|
| Accueil SA | `/dashboard` | ✅ Gelé |
| Actions | `/actions`, `/admin/approvals` | ✅ |
| Archives | `/archives`, `/admin/archives` | ✅ |
| Paramètres | `/settings/*` | ✅ (legacy lock hotfix) |
| Alertes | `/admin/alerts` | ✅ (hardening mai) |
| Approbations | `/admin/approvals` | ✅ |
| Audit | `/admin/audit`, activity-logs | ✅ |
| Hubs enterprise admin | `/admin/platform`, `multitenant`, `cloud`, etc. | 🟡 Nombreuses pages **référence / démo** |

### 8.3 Supervision SA sur départements

- SA peut accéder **`/dept/*`** en lecture pilotage (pas opérations vente directes)  
- Hub `/dept` (cartes départements) : admin uniquement

---

## 9. Transversal — RBAC, middleware, sécurité

### 9.1 Modèle de rôles (M2)

| Rôle | Usage |
|------|--------|
| `super_admin` | Gouvernance globale |
| `manager` + `department_key` | Manager département |
| `agent` + `department_key` | Opérationnel |
| `accountant` | Finance |
| `auditor` | Logs |
| `responsable_*` (legacy) | Encore dans DB / `dept-nav-configs` |

### 9.2 Fichiers critiques

- `middleware.ts` — auth, redirects settings, **`edgeCanAccessPathForProfile`**, `isDeptRouteAllowed`  
- `lib/middleware/edge-route-guards.ts`  
- `lib/navigation/dept-cockpit-route.ts` — **`canProfileAccessDeptPath`** (fix mai)  
- `lib/auth/permissions.ts` — miroir serveur  
- `lib/navigation/sidebar-for-role.ts` — factorisation sidebar mai  

### 9.3 Incidents RBAC résolus

| Problème | Correction |
|----------|------------|
| Manager vente voyait sidebar SA | `getSidebarForRole` + `DepartmentBusinessSidebar` |
| `/dept/vente` → access-denied | `canProfileAccessDeptPath` |
| Legacy role routes vs generic | Double garde middleware |

### 9.4 Risques sécurité résiduels

- RLS : checklist `RLS_AUDIT_CHECKLIST.md` — **à réexécuter** par nouvelle table  
- Cross-dept : tests `auth-matrix.test.ts` — bonne base, pas exhaustif  
- JWT vs profil DB : délégué profil serveur (OK si cohérent)

---

## 10. Transversal — event bus, notifications, automations

| Composant | Statut | Rapport |
|-----------|--------|---------|
| Event bus B3.2 | ✅ Fondation | `ERP_EVENT_BUS_B3_2_REPORT.md` |
| CRM events P1 | 🟡 ~10 % mutations | `ERP_CRM_EVENT_EXPANSION_P1_REPORT.md` |
| Notifications P2–P3 | 🟡 Pont + livraison in-app | Tables `notifications` |
| Finance events P4–P6 | ❌ Non branché prod | `ERP_FINANCE_EVENT_ACTIVATION_P4` |
| HR P7/P9 | 🟡 Fondation + expansion | Partiel |
| Observability P8 | 🟡 | Tables `erp_observability_*` |
| Automation P6 | 🟡 | `erp_automation_*` — pas workflow métier complet |

**Verdict :** infrastructure **avancée**, exploitation métier **immature**.

---

## 11. Base de données et migrations SQL

### 11.1 Volumétrie

- **66 fichiers** `supabase/sql/` (001 core → 062 approvals, 999 reset)  
- Types générés : `types/database.types.ts` (**~100+ tables** publiques)

### 11.2 Domaines SQL

| Domaine | Fichiers clés | UI alignée |
|---------|---------------|------------|
| Core | 001–003 | ✅ |
| Clients/Products/Vente | 002, 004, 005, 015 | ✅ |
| Finance base + enterprise | 008, 011, 012, 047 | ✅ |
| CRM | 049 | ✅ |
| RH | 040–045 | 🟡 |
| Logistics | 048 | 🟡 |
| Governance | 036–038, 062 | ✅ |
| Enterprise platform | 050–061 | 🟡 Hubs admin |
| Reset | 999_reset, 999_verify | ✅ Outil ops |

### 11.3 Reset données (mai 2026)

- `999_reset_all_data.sql` v2 — TRUNCATE cœur + DELETE optionnel  
- Conserve : profiles, permissions, currency_rates, pipeline stages  
- **Exécution manuelle** Supabase uniquement

---

## 12. Duplications, dette technique et incohérences

### 12.1 Duplications majeures

| # | Duplication | Impact | Action recommandée |
|---|-------------|--------|-------------------|
| D1 | `DeptHomePage` vs `VenteCockpitClient` / `FinanceCockpitClient` | 3 patterns cockpit | Garder `DeptHomePage`, supprimer ou router legacy |
| D2 | `DeptDashboardClient` (API client) | Code mort | Supprimer ou fusionner |
| D3 | `DepartmentCockpitPlaceholder` | Non utilisé | Supprimer si confirmé |
| D4 | 3 référentiels départements A/B/C | Nav 404, confusion | Unifier sur `department-config` |
| D5 | `/dept/X` vs hubs `/finance`, `/rh`, `/logistique` | Double entrée | Documenter « cockpit vs opérations » |
| D6 | `dept-nav-configs` vs `erp-ux-architecture` | Hrefs faux | Déprécier legacy config |
| D7 | Rapports `005` et `062` approval_requests | Migration doublon | Vérifier prod un seul schéma |
| D8 | Nombreux hubs `/admin/*` similaires | Maintenance | Marquer « reference UI » |

### 12.2 Incohérences documentées

- CDC « 0 % » vs réalité ~50 %  
- `ALIGNEMENT_CAHIER` avril vs mai (super_admin, settings, dept)  
- Marketing `cockpitRoute` dans M3 architecture  
- Formation/consultation : CDC séparés, M1.5 fusionnés  

### 12.3 Fichiers orphelins / scripts

- `scripts/patch-cockpit.mjs` — utilitaire dev  
- `DeptDashboardClient.tsx` dans `[deptKey]` — non utilisé par `page.tsx`

---

## 13. Bugs, incidents et corrections majeures

| # | Symptôme | Cause | Fix | Commit / période |
|---|----------|-------|-----|------------------|
| B1 | Sidebar manager = sidebar SA | `isDeptRole` legacy only | `sidebar-for-role.ts` | `38339f5` |
| B2 | `/dept/vente` access-denied | Middleware prefixes `/vente` only | `canProfileAccessDeptPath` | `b0cd450` |
| B3 | Ancienne UI dept dashboard | Routes legacy `/vente/dashboard` | Redirects + `dashboardRoute` | `4b7df9f` |
| B4 | Admin alerts loading | Server/client boundary | Hardening | `52111c9` |
| B5 | Cache stale profil | `unstable_cache` + cookies | Remove cache | `ae40639` |
| B6 | Re-renders massifs | Callbacks AppShell | `useRowSelection` | `099f940` |
| B7 | Invitation 500 / redirect | Auth flux | Multiples fixes avril | `9e89522`… |
| B8 | Reset SQL Results spam | `SELECT reset_delete_table` | v2 DO + TRUNCATE + SELECT bilan | `aa80285` |
| B9 | Build dept quick actions | Import server in client | Miroir client-safe config | `3e4ba65` |

---

## 14. Performance, fiabilité et production

### 14.1 Optimisations réalisées (mai 2026)

- Middleware allégé (`edge-route-guards`)  
- Moins de round-trips layout (`layout-access`, profil dédup)  
- `dynamic = 'force-dynamic'` sur cockpits dept  
- Bundles dashboard split  
- Rapports : `ERP_AUDIT_PERFORMANCE_MAY2026`, `AUDIT_PERFORMANCE_M3_75`

### 14.2 Lenteurs / risques résiduels

| Risque | Sévérité |
|--------|----------|
| `DeptHomePage` + Recharts client-only | Moyenne (hydration) |
| 242 pages — build long | Faible |
| Hubs admin non paginés | Moyenne |
| Double fetch cockpit API (`DeptDashboardClient` si réactivé) | Moyenne |
| Event bus overhead si mal branché | Future |

### 14.3 Fiabilité ERP professionnelle

| Critère | Note /5 | Commentaire |
|---------|---------|-------------|
| Auth & sessions | 4 | Solide après durcissement |
| RBAC dept | 3.5 | Récent, à tester tous rôles |
| Intégrité données vente | 4 | Transactions vente, archives |
| Couverture modules | 2.5 | 3 dept faibles |
| Observabilité | 3 | Logs + gouvernance ; bus immature |
| Documentation | 4.5 | Très fournie, parfois contradictoire |
| **Global « ERP pro »** | **3 / 5** | Bon socle, pas homogène |

---

## 15. Tests et qualité

| Type | Quantité | Couverture |
|------|----------|------------|
| Vitest unit | ~42 fichiers | RBAC, M3 alignment, vente cockpit, finance runtime, settings lock |
| Playwright E2E | Présent | Smoke responsive, parcours partiels |
| Tests manuels | Rapports multiples | SA sidebar, M3.75 — **non exhaustif auto** |

**Manques :** tests E2E par département, tests intégration event bus, tests RLS automatisés.

---

## 16. Ce qui a fonctionné / ce qui n’a pas fonctionné

### 16.1 Ce qui a bien fonctionné

- Approche **par phases verrouillées** (honesty reports) — évite fausses promesses « 100 % »  
- **Vente + CRM** comme verticale de référence B2.4  
- **Super Admin** isolé et stable  
- **Factorisation mai** : `DeptHomePage`, sidebar par rôle, `/dept/*`  
- **SQL enterprise** structuré (migrations numérotées)  
- **Corrections rapides** access-denied / cache / perf

### 16.2 Ce qui n’a pas fonctionné ou a dérapé

- **CDC statique non maintenu** → confusion sur % avancement  
- **Triple référentiel départements** dès M1 non résolu  
- **Cockpits B2.3/B3** livrés puis **non routés** (effort dupliqué)  
- **Nav annonçant pages inexistantes** (formation, marketing) → 404  
- **Event bus** : beaucoup de tables, peu de wiring métier  
- **Alignement avril** devenu faux en mai sans refresh  
- **Reset SQL v1** : UX Supabase confuse (corrigé v2)

---

## 17. Backlog priorisé (à faire)

### P0 — Bloquants UX / confiance

1. Aligner **toutes les navs** sur routes existantes (supprimer 404)  
2. Décider sort **VenteCockpitClient** / **FinanceCockpitClient** (router ou supprimer)  
3. Actualiser **CDC** + `ALIGNEMENT_CAHIER` (mai 2026)  
4. Tests manuels **chaque rôle** × **chaque dept** sur `/dept/*`

### P1 — Compléter départements « vides »

5. **Formation** : schéma SQL + 4 pages CRUD minimales  
6. **Consultation** : idem missions/clients  
7. **Marketing** : campagnes + leads UI  
8. **Logistique** : KPI dept depuis `logistics_*`  
9. **RH** : KPI complets + fix nav employes→collaborateurs

### P2 — Plateforme

10. Brancher **event bus** sur mutations finance + CRM (P4–P6)  
11. Unifier référentiel départements (supprimer `dept-nav-configs` ou sync auto)  
12. Suite tests E2E smoke par dept  
13. Ctrl+K / centre notifications (CDC phase 7)

### P3 — Documentation & ops

14. **Documentation utilisateur** par rôle (hors rapports dev)  
15. Runbook déploiement + reset + backup Supabase  
16. Audit RLS automatisé CI

---

## 18. Index documentaire pour audits croisés

### 18.1 Par où commencer (autre IA)

1. **Ce document** — `ERP_AUDIT_MAITRE_COMPLET_MAI_2026.md`  
2. **CDC** — `../CAHIER_DES_CHARGES_REMPRES_ERP.md`  
3. **Chronologie** — `AUDIT_CHRONOLOGIQUE_PROJET_REMPRES_ERP.md`  
4. **Alignement (à mettre à jour)** — `ALIGNEMENT_CAHIER_ETAT_ACTUEL.md`  
5. **Architecture dept** — `ERP_DEPARTMENTS_FOUNDATION_M1_REPORT.md`  
6. **Standard build** — `ERP_GOVERNANCE_STANDARD_B2_4_REPORT.md`  
7. **UX lock** — `ERP_UX_P0_FINAL_LOCK_M3_75_REPORT.md`  
8. **Vente live** — `ERP_VENTE_COCKPIT_LIVE_B2_3_REPORT.md`  
9. **RBAC** — `RBAC_FINAL_VALIDATION.md`, `ERP_ROLES_ACCESS_MATRIX_M2_REPORT.md`  
10. **Prod** — `PRODUCTION_DEPLOYMENT_CHECKLIST.md`, `RLS_AUDIT_CHECKLIST.md`

### 18.2 Codes mission (lexique)

| Préfixe | Signification |
|--------|----------------|
| **M1–M3.75** | Organisation, rôles, UX sidebar/cockpit |
| **B1.x** | Spec architecture Vente |
| **B2.x** | Runtime / CRM / cockpit live Vente |
| **B2.4** | Standard gouvernance ERP |
| **B3.x** | Finance, approvals, event bus |
| **P1–P9** | Events, notifications, automation, observability |
| **Phase 2–4.9** | Locks UI/data transverses |
| **SA 1.x** | Modules Super Admin |

---

## 19. Annexes métriques

### 19.1 Commits récents significatifs (extrait)

```
aa80285 fix: reset SQL v2
5b4c644 chore: reset SQL scripts
3e4ba65 feat: dept quick actions
b0cd450 fix: /dept middleware access
4b7df9f fix: dept dashboard routes
a60c31b feat: DeptHomePage factorization
38339f5 fix: RBAC sidebar
67b1e94 feat: Vente B2 + Finance B3 + B2.4
f120deb feat: M3.5/M3.75 UX lock
1fca1e7 feat: ERP v1.0 complete system
```

### 19.2 Structure code (approximatif)

```
app/(app)/     ~242 pages
components/    UI partagée, dashboard, layout
lib/           auth, navigation, server, vente/finance runtime
modules/       crm, finance, hr, logistics, platform
supabase/sql/  66 migrations
tests/unit/    42 tests
docs/          74 rapports
```

### 19.3 Formule de % département (méthode audit)

Pour chaque département, % = moyenne pondérée :

- **25 %** — Routes opérationnelles existantes vs nav annoncée  
- **25 %** — Données live (loaders / SQL) vs placeholders  
- **20 %** — CRUD / workflows métier  
- **15 %** — RBAC + middleware  
- **15 %** — Tests + doc + conformité B2.4  

---

## Conclusion

RemPres ERP a parcouru en **~5–6 semaines** un chemin atypique par rapport au CDC linéaire : un **noyau vente mature**, une **gouvernance Super Admin forte**, une **finance enterprise avancée**, et une **coquille UX départementale unifiée** (`/dept/*`) posée en mai 2026. Les **trois derniers départements métier** (formation, consultation, marketing) et l’**exploitation du bus d’événements** restent les principaux écarts vers un ERP « professionnel complet ».

**Pourcentage global réaliste : ~48–52 %** de la roadmap CDC 7 phases.  
**Aucun département n’est « fini »** ; **Vente** est la référence la plus proche d’un module production-ready.

---

*Document généré pour audit croisé et documentation de continuité — RemPres ERP, 24 mai 2026.*  
*Prochaine mise à jour recommandée : après chaque sprint ou release majeure.*
