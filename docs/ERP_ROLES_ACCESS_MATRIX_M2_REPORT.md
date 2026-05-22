# REMPRES ERP — Micro phase M2
# Matrice officielle Rôles & Accès

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** gouvernance RBAC — **aucune implémentation** (pas de SQL, UI, middleware, guards)  
**Prérequis verrouillés :** M1 départements · M1.5 CRM ⊆ Vente · M1.5 `department_key` FORMATION (Consultation absorbée) · Super Admin 1.6  
**Sources auditées :** `lib/auth/roles.ts`, `lib/auth/permissions.ts`, `lib/auth/supervision.ts`, `lib/server/permissions.ts`, `lib/server/layout-access.ts`, `middleware.ts`, `components/layout/app-shell.tsx`, `lib/settings/governance-roles.ts`, `supabase/sql/003_seed_profiles_permissions.sql`, `035_authorization_generic_roles_departments.sql`, `049_crm_sales_domain_enterprise.sql`, `tests/unit/auth-matrix.test.ts`, cahier des charges §4.

---

## Synthèse exécutive

La phase M2 **verrouille la logique** des rôles et accès pour tout le futur ERP (sidebar, permissions, cockpit, guards, workflows). Elle **ne prétend pas** que le code actuel est déjà aligné.

**Modèle officiel retenu (2 dimensions + profils effectifs) :**

| Dimension | Stockage cible | Valeurs |
|-----------|----------------|---------|
| **Rôle générique** | `profiles.role_key` | `super_admin` · `manager` · `agent` · `accountant` · `auditor` |
| **Département** | `profiles.department_key` | `VENTE` · `FINANCE` · `RH` · `FORMATION` · `MARKETING` · `LOGISTIQUE` (+ cas spéciaux §2) |
| **Rôle ERP effectif** | *Dérivé* (documentation / UI) | ex. `MANAGER_VENTE` = `manager` + `VENTE` |

Les libellés **MANAGER_VENTE**, **MANAGER_FINANCE**, etc. (`GOVERNED_ERP_ROLES`) **ne sont pas** des `role_key` DB parallèles — ils décrivent l’**association rôle + département**.

**Verdict M2 :** la matrice est **claire, gouvernée, scalable en conception**, mais l’implémentation actuelle mélange **contrôle par URL** (middleware), **contrôle par module** (`permissions`), et **visibilité shell** (souvent permissive ou incohérente).

---

## 1. Rôles actuels (audit phase 1)

### 1.1 Rôles génériques (canon technique — `ROLE_KEYS`)

| `role_key` | Présent DB `app_roles` (035) | Résolution legacy |
|------------|------------------------------|-----------------|
| `super_admin` | Oui (hors agrégation 035) | — |
| `manager` | Oui | `directeur_general`, tous `responsable_*` |
| `agent` | Oui | `employe` |
| `accountant` | Oui | `comptable` |
| `auditor` | Oui | `auditeur` |

### 1.2 Rôles legacy encore présents dans l’historique

| Clé legacy | Mappé vers | Dette |
|------------|------------|-------|
| `directeur_general` | `manager` + `ADMINISTRATION` | Permissions seed 003 ; alias lecture |
| `responsable_vente` | `manager` + dept | Lignes `permissions` historiques possibles |
| `responsable_formation` / `responsable_consultation` | `manager` | Consultation à fusionner → `FORMATION` |
| `responsable_rh`, `responsable_marketing`, `responsable_logistique` | `manager` | Idem |
| `employe` | `agent` | — |
| `comptable` | `accountant` | — |
| `auditeur` | `auditor` | — |
| `admin` | Nettoyé en 035 | Risque lignes orphelines si migration partielle |

### 1.3 Rôles implicites / hybrides (problème)

| Phénomène | Description |
|-----------|-------------|
| **« Admin » fonctionnel** | `hasAdminConsoleAccess` = `super_admin` OU `manager` + `ADMINISTRATION` — accès large `/admin/*` gouverné, **≠** super_admin |
| **Super_admin sans dept** | `department_key` null — correct |
| **Manager sans distinction agent** | `canAccessPathForProfile` : `manager` et `agent` **mêmes préfixes URL** ; différenciation = table `permissions` seulement |
| **Sidebar RH / Logistique** | `visible: true` **sans** filtre département ni module — **visibilité fantôme** |
| **Actions / Paramètres shell** | Visibles si `canReadActivityLogs` (= `isAdminRole`) — **pas** réservés super_admin |

### 1.4 Permissions existantes (modules)

| Source | Modules observés |
|--------|------------------|
| Seed 003 | `clients`, `produits`, `vente` (par `role_key` legacy) |
| 035 | Agrégation vers `manager`, `agent`, `accountant`, `auditor` |
| 048+ | `logistics`, `crm`, `compliance`, `ai`, `cloud`, … (stubs enterprise) |

**Écart M1.5 :** module `crm` existe en SQL ; **règle normative** = utilisable uniquement si `department_key = VENTE` (non appliqué globalement aujourd’hui).

### 1.5 Contrôles d’accès actuels (couches)

| Couche | Fichier | Granularité |
|--------|---------|-------------|
| Middleware | `middleware.ts` | Auth + `canAccessPathForProfile` + `hasAdminConsoleAccess` sur `/admin` restreint |
| Path policy | `lib/auth/permissions.ts` | Préfixes par département ; super_admin via `supervision.ts` |
| Module policy | `lib/server/permissions.ts` | `permissions` table par `role_key` + `module_key` |
| Layout / sidebar | `layout-access.ts`, `app-shell.tsx` | Clients, produits, finance ; RH/logistics **toujours visibles** |

---

## 2. Rôles officiels ERP (phase 2 — structure verrouillée)

### 2.1 Principe : pas de multiplication des `role_key`

**Rejeté pour M2 :** créer 7+ `role_key` DB (`manager_vente`, `manager_finance`, …) — **duplication**, migration lourde, non scalable.

**Retenu :** **5 rôles génériques** + **1 département** par utilisateur métier (sauf exceptions ci-dessous).

### 2.2 Profils ERP effectifs officiels (libellés normatifs)

Ces libellés sont la **matrice produit** ; l’implémentation = `role_key` + `department_key` (+ modules).

| Libellé ERP officiel | `role_key` | `department_key` | Statut |
|----------------------|------------|------------------|--------|
| **SUPER_ADMIN** | `super_admin` | `null` | Gouvernance — validé |
| **MANAGER_VENTE** | `manager` | `VENTE` | Officiel |
| **AGENT_VENTE** | `agent` | `VENTE` | Officiel (manquant dans liste user M2 — **requis**) |
| **MANAGER_FINANCE** | `manager` | `FINANCE` | Officiel |
| **AGENT_FINANCE** | `agent` | `FINANCE` | Officiel (futur) |
| **ACCOUNTANT** | `accountant` | `FINANCE` | Officiel — rôle dédié (≠ simple agent) |
| **MANAGER_RH** | `manager` | `RH` | Officiel |
| **AGENT_RH** | `agent` | `RH` | Officiel (futur) |
| **MANAGER_FORMATION** | `manager` | `FORMATION` | Officiel (inclut Consultation) |
| **AGENT_FORMATION** | `agent` | `FORMATION` | Officiel (futur) |
| **MANAGER_MARKETING** | `manager` | `MARKETING` | Officiel |
| **AGENT_MARKETING** | `agent` | `MARKETING` | Officiel (futur) |
| **MANAGER_LOGISTIQUE** | `manager` | `LOGISTIQUE` | Officiel |
| **AGENT_LOGISTIQUE** | `agent` | `LOGISTIQUE` | Officiel (futur) |
| **AUDITOR** | `auditor` | `AUDIT` ou `null` | Fonction transversale — officiel |
| **MANAGER_ADMINISTRATION** (ex-DG) | `manager` | `ADMINISTRATION` | **Legacy gouverné** — pas département métier M1 |

### 2.3 Rôles illégitimes ou excessifs

| Élément | Verdict M2 |
|---------|------------|
| `responsable_*` comme `role_key` actif | **Illégitime** — lecture legacy uniquement |
| `CRM` comme rôle ou département | **Interdit** (M1.5) |
| `CONSULTATION` comme `department_key` | **Interdit** pour nouveaux profils (M1.5) |
| Rôle par sous-module (`manager_crm`) | **Rejeté** — sous-module = `permissions.module_key` |
| Super_admin + département | **Interdit** (`validateInviteRoleDepartment`) |

### 2.4 Rôles manquants signalés (complétude)

| Manque | Recommandation M2 |
|--------|-------------------|
| Agents départementaux non listés dans la demande user | **Officiels** — même pattern que managers |
| « Viewer » lecture seule métier | **Futur** — variante `agent` avec permissions read-only par module |
| « Validateur » cross-dept | **Futur** — via `can_approve` + workflows gouvernance, pas rôle séparé obligatoire |

### 2.5 Cohérence avec `GOVERNED_ERP_ROLES`

Aligné sauf : pas d’entrée `manager:consultation` (correct — fusion FORMATION). **À ajouter en doc :** agents par département et `accountant` / `auditor`.

---

## 3. Matrice des responsabilités (phase 3)

Légende : **O** = ownership opérationnel · **S** = supervision / lecture gouvernée · **—** = hors périmètre

### 3.1 SUPER_ADMIN

| Domaine | Mission |
|---------|---------|
| Mission | Gouvernance plateforme, sécurité, conformité inter-départements |
| Territoire | `/dashboard` cockpit, `/actions`, `/archives`, `/settings`, `/admin/*` gouvernés, `/dept` lecture |
| Ownership | Utilisateurs, permissions système, audit global, paramètres |
| Limite | **Aucune** exécution métier (POS, RH opérationnel, dépenses, etc.) |

### 3.2 MANAGER_VENTE (+ AGENT_VENTE)

| Domaine | Manager | Agent |
|---------|---------|-------|
| Commerce (clients, produits, POS, historique) | O | O (selon permissions) |
| CRM (leads, pipeline, devis, opportunités) | O | O (selon permissions) |
| Finance, RH, Logistique, Marketing, Formation | — | — |
| Gouvernance super_admin | — | — |
| Approbations globales | — | — |

### 3.3 MANAGER_FINANCE / ACCOUNTANT

| Domaine | Manager Finance | Accountant |
|---------|-----------------|------------|
| Dépenses, trésorerie, reporting finance | O | O |
| Vente, CRM, RH, etc. | — | — |
| Exports financiers | O | O (renforcé) |

### 3.4 MANAGER_RH · MANAGER_FORMATION · MANAGER_MARKETING · MANAGER_LOGISTIQUE

Chaque manager : **ownership** exclusif de son préfixe (`/rh`, `/formation`, `/marketing`, `/logistique`).  
**FORMATION** : ownership **formation + consultation** (sous-domaines).  
**MARKETING** : campagnes / leads amont — **pas** closing vente (handoff → VENTE).

### 3.5 AUDITOR

| Domaine | Périmètre |
|---------|-----------|
| Mission | Intégrité, traçabilité, contrôle |
| Territoire | Journaux d’activité (`/admin/activity-logs`), exports audit |
| Ownership | — (lecture/contrôle uniquement) |

### 3.6 MANAGER_ADMINISTRATION (legacy)

| Domaine | Périmètre |
|---------|-----------|
| Mission | Pilotage transversal (ex-DG) — **pas** super_admin |
| Territoire | Préfixes `ADMIN_CONSOLE_ALLOWED_PREFIXES` (approbations, alertes, audit, `/dept`, etc.) |
| Limite | **Pas** `/settings` complet super_admin si politique stricte — **à trancher en implémentation** ; aujourd’hui large accès admin |

---

## 4. Matrice de visibilité (phase 4)

**Règle M2 :** la visibilité (sidebar, homepage, KPI) **suit** `department_key` + `role_key` + `permissions.module_key`. **Interdit :** sidebar universelle par défaut.

### 4.1 Homepage (`/dashboard`)

| Profil | Contenu visible |
|--------|-----------------|
| SUPER_ADMIN | Cockpit gouvernance global uniquement |
| MANAGER_* / AGENT_* | Dashboard **départemental** (futur) ou KPI filtrés **leur** dept — pas cockpit global |
| ACCOUNTANT | KPI / entrées Finance |
| AUDITOR | Liens audit / journaux — pas KPI métier opérationnels |
| MANAGER_ADMINISTRATION | Vue orientée gouvernance / dept — pas POS |

**État actuel :** dashboard métier avec tuiles conditionnelles `canRead*` — **partiel** ; super_admin OK.

### 4.2 Sidebar (rail principal — hors super_admin)

| Module shell cible | Visible si | État actuel |
|------------------|------------|-------------|
| **Vente** (Commerce + CRM regroupés) | `department_key = VENTE` + modules `clients`/`produits`/`vente`/`crm` | **Split** commerce + crm ; visible si clients/produits |
| **Finance** | `FINANCE` + module `finance` | OK (conditionnel) |
| **RH** | `RH` + module `rh` | **Défaut visible: true** — **non conforme M2** |
| **Logistique** | `LOGISTIQUE` + module `logistics` | **Défaut visible: true** — **non conforme M2** |
| **Formation & Consultation** | `FORMATION` + modules `formation`/`consultation` | **Absent du rail** — **non conforme M2** |
| **Marketing** | `MARKETING` + module `marketing` | **Absent du rail** |
| **Actions / Paramètres** | SUPER_ADMIN ou MANAGER_ADMINISTRATION **uniquement** | **Hybride** : `canReadActivityLogs` trop large |

### 4.3 SUPER_ADMIN sidebar

Rail verrouillé : Accueil · Actions · Archives · Paramètres — **conforme** (phase 1.6).

### 4.4 Sous-modules (visibilité)

| Département | Sous-modules `module_key` (normatif) |
|-------------|--------------------------------------|
| VENTE | `clients`, `produits`, `vente`, **`crm`** |
| FINANCE | `finance`, `depenses` (futur homogénéisation) |
| RH | `rh` |
| FORMATION | `formation`, `consultation` (clé technique conservée) |
| MARKETING | `marketing` |
| LOGISTIQUE | `logistics` |

### 4.5 Archives · Notifications · KPI

| Profil | Archives | KPI globaux cockpit |
|--------|----------|---------------------|
| SUPER_ADMIN | Hub `/archives`, lecture seule admin | Oui (supervision) |
| MANAGER_* | Archives **de leur** domaine si policy | Non — KPI dept |
| MANAGER_VENTE | Archives vente + CRM traçabilité | Non |
| Autres dept | Selon modules | Non |

---

## 5. Matrice d’autorité d’action (phase 5)

**Principe :** **Voir ≠ modifier.**  
- **Niveau URL** : autorise l’entrée dans le module (middleware).  
- **Niveau `permissions`** : `can_create` · `can_read` · `can_update` · `can_delete` · `can_approve` · `can_export` · `can_assign` · `can_manage_users` · `can_manage_settings`.

### 5.1 Actions par type

| Action | SUPER_ADMIN | MANAGER dept | AGENT dept | ACCOUNTANT | AUDITOR |
|--------|-------------|--------------|------------|------------|---------|
| Consulter (métier) | S (lecture traçabilité vente) | O | O* | O (finance) | — |
| Créer / modifier métier | **Interdit** | O | O* | O (finance) | — |
| Supprimer métier (soft) | **Interdit** | O | O* | Limité | — |
| Exporter | O (gouvernance) | O | O* | O | O (logs) |
| Approuver (workflows) | O (gouvernance) | O | —* | — | — |
| Gérer utilisateurs | O (`/settings/users`) | **Interdit** | **Interdit** | **Interdit** | **Interdit** |
| Gérer permissions | O | **Interdit** | **Interdit** | **Interdit** | **Interdit** |
| Paramètres système | O | **Interdit** | **Interdit** | **Interdit** | **Interdit** |

\*Agent : sous-ensemble du manager via matrice `permissions` (typiquement pas `can_manage_users`, `can_approve` selon politique).

### 5.2 SUPER_ADMIN — lecture vs action

| Zone | Consulter | Créer/modifier |
|------|-----------|----------------|
| Ventes historique / archives figées | Oui | **Non** |
| POS / clients actifs / CRM actif | **Non** | **Non** |
| Utilisateurs / permissions | Oui | Oui (gouvernance) |
| Archives admin | Oui (lecture seule UI) | **Non** (mutations rejetées serveur) |
| Approbations / alertes | Oui | Selon workflow gouvernance (pas métier) |

**Code actuel :** aligné sur l’esprit (`isSuperAdminOperationalPath`, tests `auth-matrix`).

### 5.3 MANAGER_VENTE — autorité normative

| Sous-domaine | CRUD | Export | Approbation |
|--------------|------|--------|-------------|
| Clients / produits | O | O | — |
| POS / ventes | O | O | — |
| CRM (pipeline, devis) | O | O | O (devis sensibles — futur) |

---

## 6. Matrice des interdictions (phase 6)

### 6.1 Par profil (résumé)

| Profil | Interdit absolu |
|--------|-----------------|
| **SUPER_ADMIN** | Toute mutation métier ; POS ; CRM actif ; finance opérationnelle ; RH opérationnel |
| **MANAGER_VENTE** | Paramètres super_admin ; gouvernance globale ; finance/RH/logistique/marketing/formation **opérationnels** |
| **MANAGER_FINANCE** | Vente, CRM, RH, logistique, paramètres système |
| **MANAGER_RH** | Vente, finance (hors lecture agrégée si policy), paramètres |
| **MANAGER_FORMATION** | Vente, finance opérationnel, paramètres |
| **MANAGER_MARKETING** | Paramètres ; finance ; exécution vente |
| **MANAGER_LOGISTIQUE** | Paramètres ; vente POS ; finance |
| **AGENT_*** | Gestion utilisateurs ; permissions ; paramètres ; approbations globales (par défaut) |
| **AUDITOR** | Toute mutation ; modules métier hors logs |

### 6.2 Modules interdits par département (cross-access URL)

Déjà **partiellement** appliqué : `canAccessPathForProfile` refuse cross-prefix (ex. manager VENTE → `/finance` = false, testé).

**Non appliqué :** visibilité sidebar RH/Logistique pour profils Vente.

---

## 7. Matrice supervision SUPER_ADMIN (phase 7)

| Département | Voit (supervision) | Surveille | Contrôle | Audite | N’exécute pas |
|-------------|------------------|-----------|----------|--------|---------------|
| **VENTE** | KPI cockpit, `/dept/vente`, historique/archives vente | Alertes vente, tendances | — | Audit filtré, archives | POS, CRM actif, CRUD clients |
| **FINANCE** | KPI agrégés, `/dept/finance` | Alertes finance | — | Audit `department=finance` | Saisie dépenses |
| **RH** | KPI, `/dept/rh` | Alertes RH | — | Audit `department=rh` | Dossiers RH |
| **FORMATION** | KPI, `/dept/formation` | — | — | Audit `department=formation` | Sessions / missions |
| **MARKETING** | KPI (si câblé) | — | — | — | Campagnes |
| **LOGISTIQUE** | KPI stock | Ruptures (cockpit) | — | — | Mouvements stock |
| **Gouvernance** | Actions, Archives, Paramètres | Plateforme | Utilisateurs, sécurité | Journaux, approbations | — |

**Interdit M2 :** super_admin comme « employé », « commercial », ou « responsable formation ».

---

## 8. Scalabilité & rôles futurs (phase 8)

### 8.1 Modèle scalable (30+ départements)

| Mécanisme | Scalabilité |
|-----------|-------------|
| `departments` table + `department_key` | **Bonne** |
| `role_key` générique (5 valeurs) | **Bonne** — pas explosion combinatoire en DB |
| `permissions(role_key, module_key)` | **Bonne** — ajout module par département |
| Profils effectifs `MANAGER_{DEPT}` | **Bonne** — label dérivé |
| `canAccessPathForProfile` par préfixe | **Moyenne** — chaque dept doit enregistrer `routePrefixes` |
| Shell `modules[]` hardcodé | **Mauvaise** — refactor vers registre départements |

### 8.2 Rôles futurs (signalés, non implémentés)

| Rôle futur | Usage | Impact |
|------------|-------|--------|
| **VIEWER** (agent read-only) | Consultation sans CRUD | Flags `can_*` à false sauf read |
| **VALIDATOR** | Approbations cross-module | `can_approve` + workflow |
| **ANALYST** | BI / exports | `can_read` + `can_export` multi-module **sous contrôle** |
| **ASSISTANT** | Sous-ensemble agent | Sous-matrice permissions |
| **DEPT_ADMIN** | Alias manager renforcé | Optionnel — éviter si `manager` suffit |

**Ne pas créer** de `role_key` par département.

---

## 9. Legacy — impacts migration (phase 9)

| Zone | Dette | Action future (hors M2) |
|------|-------|-------------------------|
| `permissions` lignes `responsable_*` | Doublons possibles | Purge / consolidation sur 5 rôles |
| Seed 003 non révoqué | Matrice obsolète | Migration permissions officielle M3 |
| `directeur_general` profils | → `manager` + `ADMINISTRATION` | Documenter différence vs super_admin |
| `department_key = CONSULTATION` | Profils existants | Backfill → `FORMATION` |
| Sidebar permissive | Fuite visibilité | Aligner sur matrice §4 |
| Modules enterprise (`ai`, `cloud`) | Permissions super_admin only | Quarantaine gouvernance |
| Cahier §4 rôles `responsable_*` | Doc obsolète | Mise à jour CDC |
| CRM module sans garde dept | Accès théorique CRM hors VENTE | Règle M2 : `crm` ⊆ `VENTE` |
| `isAdminRole` → Actions/Settings visibles | Confusion avec super_admin | Séparer `canAccessGovernanceNav` |

---

## 10. Overlaps détectés

| Overlap | Parties | Risque | Résolution M2 |
|---------|---------|--------|---------------|
| Super_admin vs DG | `super_admin` vs `manager`+`ADMINISTRATION` | Confusion pouvoirs | Doc + UI labels distincts |
| Admin console vs Paramètres | Préfixes `/admin` vs `/settings` | Accès hybride DG | DG ≠ settings complets (à implémenter) |
| CRM module vs Vente dept | Permissions `crm` | CRM hors Vente | Garde dept M1.5 |
| Manager = Agent sur URL | `canAccessPathForProfile` | Agent trop puissant si permissions laxistes | Renforcer permissions par rôle |
| RH/Logistique visibles tous | app-shell | Navigation fantôme | Filtrer par dept |
| Marketing vs Vente | Leads | Doublon funnel | Marketing amont ; Vente aval |
| Formation vs RH | Compétences | Chevauchement | RH = contrat ; Formation = parcours |
| Auditor vs super_admin audit | Journaux | — | Auditor limité logs ; super_admin global |

---

## 11. Risques futurs

| Risque | Gravité |
|--------|---------|
| Implémentation sidebar avant matrice | Haute — régression gouvernance |
| Permissions `super_admin` sur modules métier en SQL 049 | Moyenne — revue matrices |
| Agents avec `can_manage_users` par agrégation 035 | Haute — audit flags |
| Nouveau dept sans `routePrefixes` | Moyenne — middleware ouvre trop ou trop peu |
| Confusion MANAGER_VENTE / module CRM | Moyenne — glossaire M1.5 |

---

## 12. Problèmes détectés (liste complète)

1. Triple couche accès (URL / module / UI) **non alignée**.  
2. RH et Logistique **visibles par défaut** dans le shell.  
3. Formation, Marketing **absents** du rail alors que départements officiels.  
4. CRM et Commerce **scindés** dans la navigation (M1.5 non appliqué UI).  
5. `manager` et `agent` **indistinguables** au niveau URL.  
6. `GOVERNED_ERP_ROLES` incomplet (pas d’agents, accountant, auditor).  
7. Legacy `responsable_*` encore dans seeds / historique SQL.  
8. MANAGER_ADMINISTRATION ≈ accès admin large — **risque confusion** super_admin.  
9. `canReadActivityLogs` = `isAdminRole` — étend Actions au-delà du super_admin.  
10. Modules permissions enterprise nombreux — bruit gouvernance.  
11. Consultation encore dans middleware / profils — M1.5 non migré.  
12. Matrice CDC (10 rôles nommés) **≠** modèle générique 035.

---

## 13. Incohérences (liste complète)

| # | Incohérence |
|---|-------------|
| I1 | Liste user M2 = managers seulement ; agents **requis** par modèle |
| I2 | `GOVERNED_ERP_ROLES` vs `ROLE_OPTIONS_UI` (pas d’agents) |
| I3 | Visibilité shell ≠ `canAccessPathForProfile` |
| I4 | Visibilité shell ≠ `department_key` pour RH/Logistique |
| I5 | SUPER_ADMIN settings vs MANAGER_ADMINISTRATION admin paths |
| I6 | Module `crm` sans contrainte `department_key=VENTE` en serveur |
| I7 | `permissions` par `role_key` seul — **pas** par département (2 managers différents même matrice) |
| I8 | Cahier : un rôle = un responsable ; code : manager générique + dept |
| I9 | Consultation dept vs FORMATION officiel |
| I10 | Dashboard tuiles vs matrice visibilité stricte |

**I7 est structurante :** aujourd’hui `permissions` ne distingue pas `manager` VENTE de `manager` RH — **même ligne `role_key=manager`**. La différenciation repose sur **middleware par département** + futur affinage permissions par **profil effectif** ou matrices `manager` scindées par convention (ex. seeds par couple rôle+module filtré à l’invite). **Recommandation M2 :** en implémentation, lier permissions modules autorisés au **département du profil** (policy serveur), pas seulement au `role_key`.

---

## 14. Confirmation officielle M2

| Critère | Statut |
|---------|--------|
| **Claire** | **Oui** — modèle 2D + profils effectifs documentés |
| **Gouvernée** | **Oui** (normatif) ; **partiel** (code) |
| **Non dupliquée** | **Oui** (pas de `role_key` par dept) |
| **Scalable** | **Oui** avec correctif registre nav + policy permissions∧dept |
| **Enterprise-grade** | **Oui** comme matrice de référence |

### Formulation de verrouillage

> **Tout développement ultérieur** (sidebars métiers, guards, middleware final, workflows) **doit** implémenter :  
> 1) **Cinq rôles génériques** en DB ;  
> 2) **Un département métier** par utilisateur (sauf super_admin et cas auditor) ;  
> 3) **Libellés MANAGER_{DEPT} / AGENT_{DEPT}** comme profils effectifs ;  
> 4) **CRM** = sous-module de **VENTE** (`module_key=crm` ⇒ `department_key=VENTE`) ;  
> 5) **FORMATION** = seul dept pour formation + consultation ;  
> 6) **SUPER_ADMIN** = gouvernance sans métier ;  
> 7) **Visibilité** et **autorité** séparées, sans sidebar universelle.

**La matrice M2 est verrouillée. Elle n’est pas entièrement implémentée.**

---

## Annexe A — Tableau de référence rapide (visibility + authority)

| Profil effectif | Sidebar (cible) | Routes (préfixe) | Modules permis (normatif) |
|-----------------|-----------------|-----------------|---------------------------|
| SUPER_ADMIN | Accueil, Actions, Archives, Paramètres | Gouvernance + `/dept` + vente read-only | Gouvernance, pas métier actif |
| MANAGER_VENTE | Vente (Commerce+CRM) | `/vente` | clients, produits, vente, crm |
| AGENT_VENTE | Vente (réduit) | `/vente` | sous-ensemble |
| MANAGER_FINANCE | Finance | `/finance` | finance |
| ACCOUNTANT | Finance | `/finance` | finance (lecture/export renforcés) |
| MANAGER_RH | RH | `/rh` | rh |
| MANAGER_FORMATION | Formation & Consultation | `/formation` | formation, consultation |
| MANAGER_MARKETING | Marketing | `/marketing` | marketing |
| MANAGER_LOGISTIQUE | Logistique | `/logistique` | logistics |
| AUDITOR | Minimal / logs | `/admin/activity-logs` | activity / export |
| MANAGER_ADMINISTRATION | Gouvernance partielle | Admin console prefixes | admin gouvernance |

---

## Annexe B — Documents liés

- `docs/ERP_DEPARTMENTS_FOUNDATION_M1_REPORT.md`  
- `docs/ERP_DEPARTMENTS_CANONICAL_DECISIONS_M1_5_REPORT.md`  
- `docs/SUPER_ADMIN_FINAL_LOCKDOWN_REPORT.md`  
- `lib/auth/permissions.ts` · `lib/auth/roles.ts` · `lib/settings/governance-roles.ts`  
- `tests/unit/auth-matrix.test.ts`

---

*Micro phase M2 — matrice Rôles & Accès. Définit la logique ; n’implémente pas. Prochaine étape normative : alignement implémentation (permissions∧dept, sidebar, migration CONSULTATION) puis **sidebars métiers**.*
