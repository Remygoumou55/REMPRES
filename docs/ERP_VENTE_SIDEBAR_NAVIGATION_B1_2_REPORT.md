# REMPRES ERP — Phase B1.2
# Vente Sidebar & Navigation Architecture — Sales UX Governance

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** architecture UX / navigation — **aucun code, CRUD, workflow, SQL**  
**Prérequis verrouillés :** M1 · M1.5 · M2 · M2.5 · M3 · M3.75 · **B1.1**  
**Complément domaine :** `docs/ERP_VENTE_DOMAIN_ARCHITECTURE_B1_1_REPORT.md`  
**Références UX :** `lib/navigation/erp-ux-architecture.ts` · `lib/navigation/vente-rail-lock.ts` · M3.75 lock

---

## Synthèse exécutive

| Verdict | Formulation |
|---------|-------------|
| **Sidebar Vente** | **Une seule** colonne rail (`DepartmentBusinessSidebar`) — pattern M3 |
| **Groupes officiels** | **2** groupes repliables : **Commerce** + **CRM** (zones B1.1, pas départements) |
| **Accueil / cockpit** | Lien fixe **Accueil** → `/vente/dashboard` (hors groupe) |
| **CRM position** | Groupe **CRM** sous rail Vente — **interdit** top-level / rail parallèle |
| **État code** | Rail **conforme** M3.75 ; **navigation CRM interne dupliquée** (`CrmOperationalNav`) — dette P0 build |

**B1.2 verrouille** la hiérarchie et l’ownership des routes **avant** cockpit Vente métier et build CRM.

**B1.2 ne modifie pas** M1–M3.75 ni B1.1 — il **spécialise** la navigation Vente pour les builds futurs.

---

## 1. Navigation Vente actuelle (audit phase 1)

### 1.1 Couches de navigation observées

| Couche | Composant | Périmètre | Statut B1.2 |
|--------|-----------|-----------|-------------|
| **L1 — Shell ERP** | `DepartmentBusinessSidebar` / `DepartmentBusinessMobileNav` | Tout `/vente/*` | **Officielle** |
| **L2 — Groupe Commerce** | `CollapsibleNavGroup` id `commerce` | 4 liens M3 | **Officielle** |
| **L3 — Groupe CRM** | `CollapsibleNavGroup` id `crm` | Contenu = **`CRM_NAV`** (12 liens) | **Officielle runtime** ; écart vs spec M3 fichier (5 liens) |
| **L4 — CRM workspace** | `CrmOperationalNav` (horizontal) | Toutes pages `/vente/crm/*` via `CrmOperationalWorkspace` | **Legacy — à déprécier** comme nav primaire |
| **L5 — Legacy shell** | `PrimarySidebar` + `SecondarySidebar` + `useActiveNav` | Orphelins (non branchés AppShell) | **Legacy mort** |
| **L6 — Dept supervision** | `CRM_OPERATIONAL_LINKS` → `/dept/vente` | Supervision / KPI | **Hors sidebar métier** |

### 1.2 Schéma navigation réelle (2026-05-22)

```
AppShell
└── DepartmentBusinessSidebar [VENTE]
    ├── Logo → /vente/dashboard
    ├── Accueil (fixe) → /vente/dashboard
    ├── Label contexte "Vente"
    ├── [▼] Commerce
    │     ├── Clients      /vente/clients
    │     ├── Produits     /vente/produits
    │     ├── Nouvelle vente /vente/nouvelle-vente
    │     └── Historique   /vente/historique
    └── [▼] CRM  ← enrichi par CRM_NAV (12 entrées)
          ├── Pilotage CRM … /vente/crm
          ├── Clients (pont) … /vente/crm/clients
          ├── Leads … Pipeline … Devis … Commandes …
          ├── Activités … Prévisions … Analytics … Reporting … Gouvernance

Page /vente/crm/*
└── CrmOperationalWorkspace
    └── CrmOperationalNav (horizontal, 12 pills)  ← DUPLICATION L3
```

### 1.3 Sources auditées

| Fichier | Rôle |
|---------|------|
| `lib/navigation/erp-ux-architecture.ts` | Contrat M3 groupes Vente (minimal) |
| `lib/navigation/department-sidebar-nav.ts` | Build sidebar + `CRM_NAV` injection |
| `modules/crm/constants/nav.ts` | **`CRM_NAV`** — liste exhaustive CRM |
| `components/layout/app-shell/DepartmentBusinessSidebar.tsx` | Rendu rail |
| `components/layout/app-shell/CollapsibleNavGroup.tsx` | Expand/collapse + `localStorage` |
| `lib/navigation/shell-visibility.ts` | Flags `commerce` / `crm` (visibilité) |
| `lib/navigation/vente-rail-lock.ts` | Lock domaine `/vente` |
| `modules/crm/components/dashboard/CrmOperationalNav.tsx` | Nav horizontale interne |
| `app/(app)/vente/**` | 48 routes |
| `lib/constants/routes.ts` | Alias globaux vente/crm |

---

## 2. Legacy navigation

| Legacy | Comportement | Risque | Action build futur |
|--------|--------------|--------|-------------------|
| Double rail `commerce` + `crm` top-level | Pre-M3.5 `PrimarySidebar` | Confusion dept | **Ne pas réactiver** |
| `SecondarySidebarPanel` | 2e colonne COMMERCE/CRM | Double nav | **Interdit** (M3) |
| `useActiveNav` → `commerce` \| `crm` | ModuleId séparés | Sémantique 2 depts | Fichier orphelin — purge |
| `CrmOperationalNav` | Pills horizontales = copie `CRM_NAV` | **Triple entrée CRM** | Réduire à breadcrumb/context ou supprimer |
| `DashboardClient` raccourcis vente/crm | Homepage hybride | Hors cockpit | Déjà redirect métiers |
| M3 fichier 5 liens CRM vs `CRM_NAV` 12 | Contrat incomplet | Drift doc/code | B1.2 = référence nav CRM complète |
| `/vente/crm/clients` pont | 2e entrée « Clients » | Double entry | Règle B1.2 §5 |

---

## 3. Sidebar officielle Vente (modèle B1.2)

### 3.1 Pattern M3 (non négociable)

| Règle | Exigence |
|-------|----------|
| Colonnes | **1** rail vertical |
| Sidebar secondaire | **Interdite** |
| Profondeur shell | **Accueil** + **groupes repliables** + **liens** (max 3 niveaux) |
| Interaction | Clic groupe → **expand inline** → sous-liens → contenu |
| Collapse rail | 268px / 76px (`DepartmentBusinessSidebar`) |
| Collapse groupe | `CollapsibleNavGroup` + persistance `rempres_dept_nav:dept_{id}` |
| Mobile | Drawer `DepartmentBusinessMobileNav` — **même hiérarchie** |
| Department-aware | `department_key = VENTE` uniquement |
| Role-aware | Filtres `shellRail` + permissions lien (Commerce) |

### 3.2 Structure officielle verrouillée

```
SIDEBAR VENTE (unique)
│
├─ [FIXE] Accueil ────────────────────── /vente/dashboard  (cockpit entry)
│
├─ [GROUPE] Commerce (id: commerce)
│    ├─ Clients ─────────────────────── /vente/clients
│    ├─ Produits ────────────────────── /vente/produits
│    ├─ Nouvelle vente (POS) ─────────── /vente/nouvelle-vente
│    └─ Historique ───────────────────── /vente/historique
│
└─ [GROUPE] CRM (id: crm)
     ├─ Pilotage CRM ─────────────────── /vente/crm
     ├─ Leads ────────────────────────── /vente/crm/leads
     ├─ Pipeline ───────────────────────── /vente/crm/pipeline
     ├─ Opportunités ───────────────────── /vente/crm/opportunities
     ├─ Devis ────────────────────────── /vente/crm/quotes
     ├─ Commandes vente ──────────────── /vente/crm/orders
     ├─ Activités ──────────────────────── /vente/crm/activities
     ├─ Prévisions ─────────────────────── /vente/crm/forecasting
     ├─ Analytics ──────────────────────── /vente/crm/analytics
     ├─ Reporting ──────────────────────── /vente/crm/reporting
     └─ Gouvernance ────────────────────── /vente/crm/governance
```

**Note :** `CRM_NAV` inclut **Clients** (`/vente/crm/clients`) — pont vers référentiel. B1.2 **recommande** de **retirer** ce lien du groupe CRM au build (Clients **uniquement** dans Commerce) — pont accessible depuis pages CRM, pas sidebar.

**Routes existantes hors sidebar officielle (accessibles URL / liens internes) :**

| Route | Statut B1.2 |
|-------|-------------|
| `/vente/crm/visual` | Couche analytique — lien cockpit / raccourci KPI, **pas** item sidebar P0 |
| `/vente/clients/archives` | Sous-route Commerce — pas item rail P0 |
| `/vente/produits/archives` | Idem |
| `/vente/recu/[saleId]` | Transactionnel — deep link depuis Historique |
| `/vente/clients/[id]`, `/produits/[id]` | Fiches — depth 4 OK, hors sidebar |

---

## 4. Groupes officiels — gouvernance

| Groupe | id | Top-level ? | Rôle | Liens min (M3) | Liens complets (B1.2) |
|--------|-----|-------------|------|----------------|----------------------|
| **Accueil** | — | **Oui** (fixe rail) | Cockpit entry | 1 | 1 |
| **Commerce** | `commerce` | **Non** (groupe) | Transactionnel + référentiel | 4 | 4 (+ archives via pages) |
| **CRM** | `crm` | **Non** (groupe) | Relation + conversion | 5 (M3 fichier) | **11–12** (`CRM_NAV` sans doublon Clients) |

### 4.1 Matrice entité → groupe (B1.1 + B1.2)

| Entité navigation | Groupe | Interdit ailleurs |
|-------------------|--------|-------------------|
| Cockpit Vente | Accueil (fixe) | CRM, Commerce |
| Clients référentiel | Commerce | CRM sidebar (recommandé) |
| Catalogue / POS / Historique | Commerce | CRM |
| Leads, Pipeline, Opportunités, Devis | CRM | Commerce top-level |
| Commandes commerciales | CRM | Logistique |
| Pilotage CRM | CRM | — |
| Analytics CRM avancés | CRM (ou Visual lien secondaire) | Rail top-level |

### 4.2 Visibilité groupes (M2.5 — non modifié)

| Flag `shellRail` | Affiche groupe | Condition |
|------------------|----------------|-----------|
| `commerce` | Commerce | `department_key=VENTE` + (`canReadClients` \| `canReadProducts`) |
| `crm` | CRM | `department_key=VENTE` + lecture CRM/clients/produits |

**Important :** `commerce` et `crm` sont des **flags de visibilité**, pas des **modules département**.

---

## 5. CRM navigation governance

### 5.1 Position officielle (M1.5 + B1.1 + B1.2)

| Affirmation | Statut |
|-------------|--------|
| CRM dans sidebar Vente | **Oui** — groupe `crm` |
| CRM rail top-level AppShell | **Interdit** |
| CRM département | **Interdit** |
| CRM route hors `/vente` | **Interdit** |

### 5.2 Source de vérité liens CRM

| Priorité | Source | Usage |
|----------|--------|-------|
| **1 (B1.2)** | `CRM_NAV` | Liste exhaustive sidebar groupe CRM |
| 2 | `erp-ux-architecture.ts` | Minimum M3 P0 (5 liens) — sous-ensemble |
| 3 | `CrmOperationalNav` | **Ne doit pas** redéfinir la liste — aligner ou supprimer |

### 5.3 Pont Clients (`/vente/crm/clients`)

| Aspect | Règle B1.2 |
|--------|------------|
| Ownership route | Vente — référentiel = `/vente/clients` |
| Page pont | Autorisée (aide contextuelle CRM) |
| Sidebar CRM « Clients » | **Doublon** — retirer au build navigation |
| Sidebar Commerce « Clients » | **Canonique** |

### 5.4 `CrmOperationalNav` — décision architecture

| Option | Verdict B1.2 |
|--------|--------------|
| Nav primaire parallèle au rail | **Rejetée** |
| Conservation pills contextuelles | **Tolérée temporairement** — dette UX |
| Suppression au profit du rail seul | **Cible build** — conforme M3 |

---

## 6. Route ownership

**Règle B1.1 :** propriétaire unique = **VENTE** ; préfixe **`/vente`**.

### 6.1 Table ownership routes

| Route | Zone | Owner nav | Doublon ? |
|-------|------|-----------|-----------|
| `/vente/dashboard` | Cockpit | Accueil fixe | Non |
| `/vente/clients` (+ sous-routes) | Commerce | Groupe Commerce | Non |
| `/vente/produits` (+ sous-routes) | Commerce | Groupe Commerce | Non |
| `/vente/nouvelle-vente` | Commerce | Groupe Commerce | Non |
| `/vente/historique` (+ détail) | Commerce | Groupe Commerce | Non |
| `/vente/recu/*` | Commerce | Deep link | Non |
| `/vente/crm` | CRM | Groupe CRM | Non |
| `/vente/crm/leads` … `governance` | CRM | Groupe CRM | Non |
| `/vente/crm/clients` | CRM pont | **Pas sidebar CRM** | **Oui** vs Commerce |
| `/vente/crm/visual` | Analytics | Hors sidebar P0 | Non |
| `/dept/vente` | Supervision | Hors sidebar métier | Non |

### 6.2 Routes interdites (futur)

| Pattern | Raison |
|---------|--------|
| `/crm/*` hors `/vente` | Violation territoire B1.1 |
| `/commerce/*` top-level | Pas de dept Commerce |
| Module rail `crm` séparé | M1.5 |

### 6.3 Alias globaux (`ROUTES`)

| Constante | Route | Groupe sidebar |
|-----------|-------|----------------|
| `ROUTES.clients` | `/vente/clients` | Commerce |
| `ROUTES.produits` | `/vente/produits` | Commerce |
| `ROUTES.newSale` | `/vente/nouvelle-vente` | Commerce |
| `ROUTES.history` | `/vente/historique` | Commerce |
| `ROUTES.crm` | `/vente/crm` | CRM |
| `ROUTES.crmVisual` | `/vente/crm/visual` | Hors P0 sidebar |

---

## 7. Cockpit entry architecture

### 7.1 Entrée officielle Vente

| Attribut | Valeur verrouillée |
|----------|-------------------|
| **Route cockpit** | `/vente/dashboard` |
| **Libellé rail** | Accueil |
| **Icône** | `LayoutDashboard` |
| **Post-login** | `resolvePostLoginRoute` → `/vente/dashboard` (manager/agent VENTE) |
| **Nature page** | Cockpit structure M3 (`DepartmentCockpitPlaceholder` → données métier futur) |

### 7.2 Ce que le cockpit n’est pas

| Interdit | Raison |
|----------|--------|
| `GovernanceHomeCenter` | Help center (retiré M3.5) |
| `/dashboard` global | Réservé super_admin |
| `/vente/nouvelle-vente` comme homepage | Opérationnel, pas pilotage |
| `/vente/crm` comme homepage | Sous-espace CRM, pas dept entry |

### 7.3 Raccourcis & switching

| Mécanisme | Statut B1.2 |
|-----------|-------------|
| Accueil sidebar | **Canonisé** |
| Quick actions cockpit (placeholder) | Liens Commerce max 3 — OK |
| `DashboardClient` shortcuts | **Non** pour profils VENTE |
| Switch Commerce ↔ CRM | Via **groupes sidebar**, pas 2 rails |

---

## 8. Navigation interne

### 8.1 Profondeur & contexte

| Niveau | Exemple | Max |
|--------|---------|-----|
| 0 | Shell rail | 1 |
| 1 | Groupe Commerce/CRM | 2 groupes |
| 2 | Lien sidebar | N liens |
| 3 | Page métier | OK |
| 4 | Fiche / détail | OK avec breadcrumb futur |

### 8.2 Breadcrumbs (état actuel)

- **Pas** de système breadcrumb Vente unifié — dette.
- **Recommandation B1.2 :** `Vente > Commerce > Clients` / `Vente > CRM > Pipeline` — build futur.

### 8.3 Expand state

| Élément | Persistance |
|---------|-------------|
| Rail large/étroit | State React `isPrimaryExpanded` |
| Groupe ouvert | `localStorage` `rempres_dept_nav:dept_{commerce\|crm}` |
| Auto-open | Groupe actif si enfant match pathname |

### 8.4 Context loss — risques

| Risque | Mitigation B1.2 |
|--------|-----------------|
| `CrmOperationalNav` masque le groupe CRM actif | Supprimer ou synchroniser highlight |
| Header `navContextLabel` | `resolveDepartmentNavContextLabel` — OK |
| Deep link sans sidebar | Middleware + layout Vente — OK |

---

## 9. Scalability review

| Extension | Où ajouter | Interdit |
|-----------|------------|----------|
| Nouveau lien POS | Groupe Commerce | Top-level |
| Nouveau stade pipeline | Groupe CRM (`CRM_NAV`) | Dept CRM |
| Module « Tarifs » | Commerce ou CRM selon B1.1 ownership | 3e groupe sans décision B1.x |
| Permissions agent partiel | Filtrer liens dans groupe | Masquer groupe entier si vide |
| Multi-tenant | Préfixe `/vente` inchangé | Routes par tenant dans URL — hors B1.2 |
| i18n labels | `CRM_NAV` + archi groupes | Renommer id groupe `commerce` → breaking |

**Règle scalabilité :** nouveaux items **dans le groupe existant** ; **3e groupe** (ex. « Administration commerciale ») nécessite **amendement B1.x**, pas improvisation build.

---

## 10. Legacy impacts navigation

| Item | Impact futur |
|------|--------------|
| Aligner `erp-ux-architecture.ts` VENTE links sur `CRM_NAV` | Doc sync — **sans modifier M3** = amendement B1.3 ou note B1.2 prime |
| Retirer `CrmOperationalNav` | Réduction duplication — 1 PR navigation |
| Retirer `CRM_NAV` entry Clients | 1 lien sidebar |
| Purge `PrimarySidebar` / `useActiveNav` | Clarté contributeurs |
| Tests CI navigation | Étendre `m3-75-final-lock` → règles B1.2 (pas de `CrmOperationalNav` primaire) |

---

## 11. Duplications détectées (liste complète)

| ID | Duplication | Sévérité |
|----|-------------|----------|
| D-N1 | Sidebar CRM 12 liens + `CrmOperationalNav` 12 pills | **Haute** |
| D-N2 | Clients `/vente/clients` + `/vente/crm/clients` dans nav | Moyenne |
| D-N3 | M3 spec 5 liens CRM vs runtime 12 | Moyenne (doc) |
| D-N4 | `shellRail` flags `commerce`/`crm` vs un dept | Faible (sémantique) |
| D-N5 | `shouldShowDashboardModuleShortcut` vente + crm séparés | Faible |
| D-N6 | `ROUTES.crm` + groupe CRM + `ModuleId crm` legacy | Faible |

---

## 12. Incohérences trouvées (liste complète)

| ID | Incohérence | Preuve |
|----|-------------|--------|
| I-N1 | Triple navigation zone CRM | Sidebar + `CrmOperationalWorkspace` |
| I-N2 | Groupe nommé « Commerce » sous label « Vente » | UX sémantique B1.1 D-V1 |
| I-N3 | `prefetch={false}` sur `CrmOperationalNav` seulement | Incohérence perf |
| I-N4 | Visual CRM absent sidebar mais présent `ROUTES.crmVisual` | Trou navigable |
| I-N5 | `enrichGroupLinks` : CRM ignore spec M3 fichier | `department-sidebar-nav.ts` |

---

## 13. Risques futurs

| Risque | Scénario | Garde B1.2 |
|--------|----------|------------|
| R-N1 | Réintroduction `SecondarySidebar` | Interdit M3 |
| R-N2 | Nouveau rail « CRM » | Interdit M1.5 |
| R-N3 | 3e groupe sidebar sans gouvernance | Procédure amendement B1.x |
| R-N4 | Cockpit = `/vente/crm` | Accueil = dashboard only |
| R-N5 | Marketing ajoute leads dans sidebar Vente | Handoff — pas item MKT |

---

## 14. Dette navigation future

1. **Supprimer ou dégrader** `CrmOperationalNav` comme navigation primaire.  
2. **Retirer** entrée sidebar CRM « Clients » (garder pont page).  
3. **Breadcrumbs** Vente unifiés.  
4. **Synchroniser** contrat M3 fichier vs B1.2 (document prime).  
5. **Tests** : une seule liste CRM dans sidebar ; pas de second rail.  
6. **Purge** fichiers shell legacy.  
7. **Filtrage** lien-à-lien CRM selon permissions granulaires (M2 impl).

---

## 15. Confirmation officielle B1.2

| Critère | Statut |
|---------|--------|
| Claire | **Oui** — 1 rail, 2 groupes, 1 accueil |
| Gouvernée | **Oui** — matrices groupe + route |
| Non hybride | **Oui** — pas de CRM top-level |
| Non dupliquée | **Partiel** — D-N1 à corriger au build |
| Scalable | **Oui** — règles extension §9 |
| Enterprise-grade | **Oui** |
| 100 % code conforme | **Non** — `CrmOperationalNav` = dette |

### Verdict final

# SALES NAVIGATION — VERROUILLÉE B1.2

Tout build futur (cockpit Vente, CRM, clients, pipeline, devis, transactions) **doit obéir** à :

1. Sidebar unique `DepartmentBusinessSidebar`  
2. Accueil → `/vente/dashboard`  
3. Groupes **Commerce** + **CRM** uniquement  
4. Liste CRM = **`CRM_NAV`** (sans doublon Clients sidebar)  
5. **Pas** de navigation primaire parallèle (`CrmOperationalNav` cible suppression)  
6. Territoire **`/vente/*`** exclusivement (B1.1)

---

## Annexe A — Contrat navigation une page (build-ready)

```yaml
sidebar_vente:
  pattern: M3_SINGLE_COLLAPSIBLE_RAIL
  home:
    label: Accueil
    href: /vente/dashboard
  groups:
    - id: commerce
      label: Commerce
      links: [/vente/clients, /vente/produits, /vente/nouvelle-vente, /vente/historique]
    - id: crm
      label: CRM
      source: CRM_NAV  # sans /vente/crm/clients en sidebar
  forbidden:
    - secondary_sidebar
    - top_level_module_crm
    - primary_nav: CrmOperationalNav
```

## Annexe B — Fichiers référence (non modifiés B1.2)

| Fichier | Rôle navigation |
|---------|-----------------|
| `DepartmentBusinessSidebar.tsx` | Rendu officiel |
| `department-sidebar-nav.ts` | Construction groupes |
| `modules/crm/constants/nav.ts` | CRM_NAV |
| `vente-rail-lock.ts` | Validation domaine |
| `shell-visibility.ts` | Visibilité groupes |

---

*Phase B1.2 — architecture navigation uniquement. Aucun artefact d’implémentation produit.*
