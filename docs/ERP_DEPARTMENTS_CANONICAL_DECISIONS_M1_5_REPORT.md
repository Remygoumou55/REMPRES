# REMPRES ERP — Micro phase M1.5
# Department Canonical Decisions Lock

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** décisions d’architecture — **aucun code, aucune UI, aucune permission implémentée**  
**Prérequis :** M1 (`docs/ERP_DEPARTMENTS_FOUNDATION_M1_REPORT.md`), Super Admin 1.6  
**Périmètre verrouillé :** (1) **CRM ownership** · (2) **Formation + Consultation — clé canonique**

---

## Synthèse des décisions officielles (verrouillage M1.5)

| Décision | Verdict officiel | Formulation normative |
|----------|------------------|------------------------|
| **CRM** | **Option B — sous-domaine Vente** | Le CRM **n’est pas** un département ERP. Il appartient au département **VENTE** (relation client, pipeline, devis, conversion). |
| **Formation + Consultation** | **Option A — clé `FORMATION`** | Un seul département métier. **`department_key` canonique = `FORMATION`**. Consultation est un **sous-domaine métier**, pas une clé département. |

**Ce qui reste technique (hors département) :**

- Permission module `crm` dans `permissions` — **autorisé** comme granularité RBAC **sous** VENTE (phase M2).
- `source_type` financier `training` / `consultation` — **conservé** comme typologie de flux, pas comme département.

**Statut honnête :** les décisions sont **verrouillées** ; l’alignement code/SQL/navigation est **non fait** en M1.5 (phase M2+).

---

## 1. État CRM actuel (audit phase 1)

### 1.1 Routes

| Zone | Préfixe | Pages observées |
|------|---------|-----------------|
| **Canonique** | `/vente/crm/*` | hub, clients (pont), leads, pipeline, opportunités, devis, commandes, activités, prévisions, analytics, reporting, governance, visual |
| **Racine produit** | `ROUTES.crm` = `/vente/crm` | Aucune route `/crm` autonome hors arbre Vente |
| **Vente opérationnelle** | `/vente/clients`, `/vente/produits`, `/vente/nouvelle-vente`, `/vente/historique` | Parallèle au CRM, même département |

**Conclusion audit :** le routage URL place déjà le CRM **sous Vente**. Il n’existe pas de « département CRM » au niveau URL.

### 1.2 Module code (`modules/crm/`)

- ~80 fichiers : repositories (`crm_leads`, `crm_opportunities`, `crm_quotes`, …), workspace UI, hooks, audit hooks.
- Migration SQL dédiée : `049_crm_sales_domain_enterprise.sql` (tables `crm_*`, permissions module `crm`).
- **Déclaration explicite d’ownership département** dans `modules/crm/constants/module-keys.ts` :

```typescript
export const CRM_DEPARTMENT_KEY = "VENTE" as const;
export const CRM_GOVERNANCE_DEPARTMENT_KEY = "VENTE" as const;
```

Le code métier CRM **revendique déjà** le département VENTE ; l’écart est surtout **navigation et perception UI**.

### 1.3 Navigation (hybride — problème principal)

| Couche | Comportement actuel |
|--------|---------------------|
| `useActiveNav` | `/vente/crm` → `ModuleId` **`crm`** (avant `/vente` → `commerce`) |
| `app-shell` | Deux modules rail : **`commerce`** (catalogue/POS) et **`crm`** (pipeline) |
| `DashboardClient` | Lien raccourci « CRM » vers `/vente/crm` |
| `department-dashboards/crm` | `vertical: "crm"`, `primaryDeptKey: "vente"` |

**Conclusion :** navigation = **2 modules shell** pour **1 département** → illusion organisationnelle.

### 1.4 Permissions & données

| Élément | État |
|---------|------|
| `permissions.module_key` | Entrée distincte **`crm`** (SQL 049) — séparée de `clients` / vente historique |
| Garde route département | `VENTE.routePrefixes = ["/vente"]` → **inclut** `/vente/crm` |
| Clients CRM | Page pont : référentiel unique **module Vente** (`CRM_CUSTOMERS_ROUTE`) — **pas de duplication données clients** |
| Activity mapping | `mapModuleToDepartment` : pas d’entrée `crm` → activités CRM peuvent être **non rattachées** à VENTE si `module_key` = `crm` |
| Executive / dept dashboards | Domaine vertical `"crm"` distinct de `"vente"` dans certains types |

### 1.5 Legacy / dépendances

- Cahier des charges : Vente et CRM commerciaux dans la même phase 2 ; pas de « département CRM » au CDC.
- Rôles legacy `responsable_vente` → `manager` + département VENTE (035).
- Super_admin : CRM bloqué en opérationnel (`/vente` dans `SUPER_ADMIN_OPERATIONAL_BLOCKED_PREFIXES`).

---

## 2. Problèmes CRM détectés

| # | Problème | Gravité |
|---|----------|---------|
| P-C1 | **Double module shell** (`commerce` + `crm`) pour un seul département VENTE | **Haute** (UX + M2 rôles) |
| P-C2 | `ModuleId` `crm` listé dans `SUPER_ADMIN_FORBIDDEN_RAIL_MODULE_IDS` — correct pour rail, mais renforce la confusion « CRM = entité séparée » | Moyenne |
| P-C3 | Permission module `crm` ≠ clé département — risque de matrices RBAC « CRM seul » sans rattachement VENTE | **Haute** (M2) |
| P-C4 | `mapModuleToDepartment` sans mapping `crm` → VENTE | Moyenne (reporting gouvernance) |
| P-C5 | Vertical dashboard `crm` vs dept `vente` — double langage | Moyenne |
| P-C6 | Libellé rail « CRM » au même niveau que « Commerce » — **suggère un département** | **Haute** (organisationnel) |

**Aucun problème ne justifie un département CRM autonome** : les routes, la clé département dans `module-keys.ts` et le pont clients convergent vers Vente.

---

## 3. Analyse CRM indépendant vs sous-domaine Vente

### Option A — CRM département indépendant

| Critère | Évaluation |
|---------|------------|
| Cohérence ERP M1 | **Non** — duplique Vente (clients, devis, commandes, revenus) |
| Simplicité | **Non** — 2 départements, 2 managers, conflits ownership client |
| Ownership | **Ambigu** — qui possède le client ? la vente POS ? le pipeline ? |
| Navigation future | Sidebar 8+ départements + CRM = bruit |
| Permissions M2 | Matrice département `CRM` + conflit avec `VENTE` |
| Dette technique | **Augmente** — séparation déjà contredite par `/vente/crm` et `CRM_DEPARTMENT_KEY` |
| Scalabilité 30+ dept | Mauvais précédent (sous-modules commercial éclatés en départements) |

**Verdict Option A :** **rejetée** — non soutenable sans rupture majeure et incohérence avec l’existant technique.

### Option B — CRM sous-domaine Vente

| Critère | Évaluation |
|---------|------------|
| Cohérence ERP M1 | **Oui** — aligné carte officielle |
| Simplicité | **Oui** — un owner métier (Responsable Vente / manager VENTE) |
| Ownership | **Clair** — relation client → conversion → vente |
| Navigation future | Un module **Vente** avec sections Commerce + CRM (ou onglets) |
| Permissions M2 | `department_key = VENTE` + modules `clients`, `vente`, `crm` en granularité |
| Dette technique | **Réduit** — aligner shell sur ce que `module-keys.ts` dit déjà |
| Scalabilité | Pattern réutilisable : département + sous-modules (`module_key`) |

**Verdict Option B :** **retenue** — seule option cohérente avec le dépôt et la stratégie M1.

### Définition normative CRM (M1.5)

| Attribut | Valeur officielle |
|----------|-------------------|
| Nature organisationnelle | **Sous-domaine** du département **VENTE** |
| Périmètre | Leads, pipeline, opportunités, devis commerciaux, activités commerciales, prévisions, analytics vente |
| Hors CRM (reste Vente « Commerce ») | POS, catalogue produits, historique ventes exécutées, reçus — sous-domaine **Commerce** ou **Opérations vente** |
| Clé département | **`VENTE`** uniquement |
| Clé permission module | **`crm`** autorisée comme sous-module (pas comme `department_key`) |
| Préfixe URL canonique | **`/vente/crm/*`** (inchangé) |

---

## 4. Décision officielle CRM

> **Le CRM est un sous-domaine du département VENTE.**  
> Il n’existe pas de département `CRM`, de `department_key` CRM, ni de manager CRM au niveau organisationnel ERP.

**Interdictions après M1.5 (gouvernance) :**

- Créer `DEPARTMENT_KEYS.CRM` ou ligne `departments.key = 'CRM'`.
- Afficher CRM comme entrée rail **égale** à Vente / Finance / RH.
- Inviter un utilisateur avec `department_key = CRM`.

**Autorisé (technique, M2+) :**

- Conserver le dossier `modules/crm/` et `permissions.module_key = 'crm'`.
- Conserver les tables `crm_*` (nommage technique acceptable).

---

## 5. État Formation / Consultation (audit phase 3)

### 5.1 Routes

| Route | Comportement |
|-------|--------------|
| `/formation` | Redirect `coming-soon?module=formation` |
| `/formation/dashboard` | `DepartmentDashboardPage` avec `departmentKey="FORMATION"` |
| `/consultation` | Redirect `coming-soon?module=consultation` |
| `/consultation/dashboard` | `DepartmentDashboardPage` avec `departmentKey="CONSULTATION"` |

**Séparation historique encore active** dans les dashboards de supervision, malgré la décision fusion M1.

### 5.2 Référentiels

| Source | FORMATION | CONSULTATION |
|--------|-----------|--------------|
| `department-config.ts` | Entrée complète `/formation` | Entrée complète `/consultation` |
| `public.departments` (035) | Ligne active | Ligne active |
| `lib/constants/departments.ts` | Carte `/dept/formation` | Carte `/dept/consultation` |
| `DEPARTMENT_OPTIONS_UI` | Option invitation | Option invitation |
| `GOVERNED_ERP_ROLES` | `manager:formation` | **Absent** (déjà signal de fusion partielle) |
| `LEGACY_ROLE_ALIASES` | `responsable_formation` | `responsable_consultation` |
| Middleware | Préfixes protégés séparés | Idem |
| Super_admin cockpit | Carte formation | **Pas de carte consultation** (déjà 6 cartes sans fusion) |

### 5.3 Overlaps métier (fusion réelle)

| Zone | Formation | Consultation | Après fusion |
|------|-----------|--------------|--------------|
| Client / apprenant | Sessions, participants | Missions, livrables | Même département — parcours différents |
| Finance (`financial_transactions`) | `source_type = training` | `source_type = consultation` | **Sous-types métier**, pas départements |
| Archives gouvernance | Audit `?department=formation` | Pas d’entrée dédiée | Un filtre département **FORMATION** |
| Activity logs | `module_key: formation` | `module_key: consultation` | Mapper les deux → **FORMATION** |
| Executive snapshot | Domaines placeholder séparés | Idem | Un domaine **formation** élargi |

**La fusion organisationnelle est confirmée ; la séparation technique est legacy.**

---

## 6. Impacts fusion (analyse, pas implémentation)

- **Organisation :** un manager département, un périmètre RH/invitations, une carte `/dept`.
- **Consultation :** devient **sous-domaine** (comme CRM sous Vente) : missions, conseil, livrables.
- **Formation :** sous-domaine : programmes, sessions, certificats.
- **Rôles legacy :** `responsable_consultation` → même `department_key` que formation (manager).

---

## 7. Analyse clé canonique (phase 4)

### Option A — `department_key = FORMATION` (Consultation absorbée)

| Critère | Évaluation |
|---------|------------|
| Simplicité | **Forte** — une clé, un enregistrement `departments` survivant |
| Migrations SQL | Modérées : désactiver/fusionner ligne `CONSULTATION`, backfill profils |
| Routes | **`/formation/*`** racine ; `/consultation/*` → redirections (phase ultérieure) |
| Dette future | Faible si libellé UI = « Formation & Consultation » |
| Cohérence M1 | **Alignée** |
| Scalabilité | Clé courte stable pour 30+ départements |
| Permissions M2 | `manager:formation` déjà présent ; étendre description |
| UX future | Un module rail « Formation & Consultation » |

### Option B — `department_key = FORMATION_CONSULTATION`

| Critère | Évaluation |
|---------|------------|
| Simplicité | **Faible** — clé longue, atypique dans le référentiel (toutes les autres clés = un mot) |
| Migrations SQL | **Lourdes** : nouvelle clé, rename `FORMATION` existante, 2→1 ligne departments |
| Routes | Dilemme `/formation` vs `/formation-consultation` — coût URL |
| Dette future | Renommage anglais-français mixte ; maintenance TypeScript `DepartmentKey` union |
| Cohérence | Explicite mais **redondant** avec libellé métier |
| Permissions | Nouvelle clé `manager:formation_consultation` ou mapping fragile |
| UX | Clé technique peu lisible dans logs / exports |

**Comparaison honnête :** l’Option B n’apporte qu’une explicite **dans la clé machine**, déjà portée par le **libellé produit** et la documentation. Le coût de migration et la rupture des conventions (`VENTE`, `RH`, `LOGISTIQUE`) **ne sont pas justifiés**.

### Sous-domaines métier (indépendants de la clé département)

| Sous-domaine | Identifiant technique recommandé | Exemple |
|--------------|-----------------------------------|---------|
| Formation | `training` | `financial_transactions.source_type`, `module_key` |
| Consultation | `consultation` | idem — **pas** `department_key` |

---

## 8. Décision officielle clé Formation / Consultation

> **`department_key` canonique officiel = `FORMATION`.**  
> **CONSULTATION n’est plus une clé département ERP.**  
> Libellé produit officiel : **« Formation & Consultation »** (ou équivalent i18n).  
> Préfixe URL racine officiel : **`/formation`** (sous-arbres `/formation/consultation/*` ou équivalent en phase routing — décision routing hors M1.5).

**Interdictions après M1.5 :**

- Nouvelles invitations avec `department_key = CONSULTATION`.
- Nouvelle ligne active `departments.key = 'CONSULTATION'` (après migration : inactive ou supprimée).
- Carte `/dept/consultation` comme département autonome dans les registres officiels.

**Conservé explicitement :**

- `source_type` SQL `training` et `consultation`.
- `module_key` activity `formation` et `consultation` (mappés au département FORMATION).

---

## 9. Impacts migration (phase 5 — analyse uniquement)

### 9.1 CRM → alignement Vente (priorité M2)

| Zone | Impact estimé | Risque |
|------|---------------|--------|
| **Navigation shell** | Fusion `commerce` + `crm` sous module `vente` | Moyen — régression UX si mal ordonné |
| **`useActiveNav` / `ModuleId`** | Supprimer `crm` comme module top-level ; sous-segment interne | Moyen |
| **`mapModuleToDepartment`** | Ajouter `crm` → `VENTE` | Faible |
| **Permissions M2** | Règle : `crm` ⊆ utilisateurs `department_key = VENTE` | **Critique** si oublié |
| **SQL** | Aucune table `departments` CRM | Faible |
| **Dashboards** | `vertical: crm` peut rester ; `primaryDeptKey: vente` déjà présent | Faible |
| **Documentation / CDC** | Mise à jour libellés | Faible |
| **Tests anti-régression** | Interdire `DEPARTMENT_KEYS.CRM` | Faible |

**Coût global CRM :** **moyen** (surtout shell + RBAC M2). **Pas de migration SQL département.**

### 9.2 Fusion FORMATION / CONSULTATION

| Zone | Impact estimé | Risque |
|------|---------------|--------|
| **SQL `departments`** | Désactiver `CONSULTATION` ; backfill `profiles.department_id` | **Élevé** si profils en production |
| **`department-config.ts`** | Retirer `CONSULTATION` de `DepartmentKey` union (phase code) | Moyen |
| **`constants/departments.ts`** | Une carte ; fusion descriptions | Faible |
| **Routes** | Redirect `/consultation` → `/formation` ou sous-chemin | Moyen |
| **Middleware** | Retirer ou alias `/consultation` | Faible |
| **`DEPARTMENT_OPTIONS_UI`** | Une option « Formation & Consultation » | Faible |
| **Rôles gouvernés** | `manager:formation` couvre les deux ; retirer alias consultation distinct | Moyen |
| **Archives** | Filtre audit unique `department=formation` (+ rétrocompat consultation) | Faible |
| **Cockpit super_admin** | Une carte dept fusionnée | Faible |
| **Executive domains** | Fusion placeholder `consultation` → `formation` | Faible |
| **`financial_transactions`** | **Aucun changement requis** sur `source_type` | Faible |
| **035 migration backfill** | Rejouer logique `responsable_consultation` → FORMATION | Moyen en prod |

**Coût global fusion :** **moyen à élevé** (données profils + types TS). **Pas de changement schéma financier obligatoire.**

### 9.3 Ordre recommandé (hors M1.5, pour M2)

1. Verrouiller spec M1.5 (ce document).  
2. Migration SQL profils / departments (CONSULTATION → FORMATION).  
3. Alignement `department-config` + registre `/dept`.  
4. RBAC M2 avec règles CRM ⊆ VENTE et FORMATION unique.  
5. Refonte navigation Vente (Commerce + CRM).  
6. Redirects `/consultation`.

---

## 10. Risques restants

| Risque | Mitigation |
|--------|------------|
| Équipe continue de parler de « département CRM » | Glossaire officiel M1.5 + revue PR |
| M2 accorde CRM sans VENTE | Règle validation invite + tests |
| Profils CONSULTATION orphelins post-migration | Script backfill + audit SQL pré-prod |
| `source_type consultation` confondu avec dept | Documentation : sous-type financier uniquement |
| Réintroduction `FORMATION_CONSULTATION` par facilité | Rejet sauf revue architecture formelle |
| Pages `coming-soon` séparées | Unifier module param avant dev métier |

---

## 11. Liste complète des incohérences (post-audit M1.5)

| # | Incohérence | Décision M1.5 |
|---|-------------|---------------|
| I1 | Rail `crm` ≠ département officiel | Corriger en M2 (nav) ; **décision : sous-domaine Vente** |
| I2 | `CRM_DEPARTMENT_KEY = VENTE` vs UI | UI à aligner ; **code dept déjà correct** |
| I3 | `permissions.module_key = crm` | **Légitime** comme sous-module |
| I4 | `mapModuleToDepartment` sans `crm` | Corriger M2 |
| I5 | Deux lignes SQL departments FORMATION + CONSULTATION | **CONSULTATION à retirer** (migration) |
| I6 | Deux routes racine `/formation` et `/consultation` | **Une clé FORMATION** ; routes consultation en alias |
| I7 | `manager:consultation` absent de GOVERNED_ERP_ROLES | Cohérent avec fusion — formaliser |
| I8 | Cockpit 6 cartes dont formation seule | Fusionner affichage M2 |
| I9 | M1 dit fusion ; code sépare encore | **M1.5 verrouille clé** ; implémentation suivante |
| I10 | CDC phases 3–4 séparées | Mettre à jour CDC (hors M1.5) |

---

## 12. Confirmation officielle M1.5

| Question | Réponse officielle verrouillée |
|----------|-------------------------------|
| **CRM : département ou sous-domaine Vente ?** | **Sous-domaine Vente** (pas un département). |
| **Clé canonique Formation + Consultation ?** | **`FORMATION`** (Consultation = sous-domaine + sous-types techniques). |

| Critère | Statut |
|---------|--------|
| Ambiguïté CRM levée | **Oui** (décision) |
| Ambiguïté Formation/Consultation levée | **Oui** (décision) |
| Implémentation alignée | **Non** — volontairement hors périmètre M1.5 |
| Prêt pour Micro phase M2 (Rôles & Access) | **Oui**, sous réserve d’appliquer ce document comme contrainte normative |

---

## Annexe A — Matrice de lecture rapide (post-M1.5)

| Concept | Type organisationnel | Identifiant canonique |
|---------|---------------------|------------------------|
| Vente (commerce) | Département | `department_key = VENTE` |
| CRM | Sous-domaine Vente | URL `/vente/crm/*`, `module_key = crm` |
| Formation | Département | `department_key = FORMATION` |
| Consultation | Sous-domaine Formation | URL future sous `/formation/...`, `module_key = consultation`, `source_type = consultation` |
| Marketing | Département | `MARKETING` |
| Super Admin | Gouvernance | rôle `super_admin`, pas de `department_key` |

---

## Annexe B — Documents liés

- `docs/ERP_DEPARTMENTS_FOUNDATION_M1_REPORT.md`  
- `docs/SUPER_ADMIN_FINAL_LOCKDOWN_REPORT.md`  
- `modules/crm/constants/module-keys.ts`  
- `lib/departments/department-config.ts`  
- `supabase/sql/035_authorization_generic_roles_departments.sql`  
- `supabase/sql/049_crm_sales_domain_enterprise.sql`

---

*Micro phase M1.5 — verrouillage décisionnel. Aucune fonctionnalité, UI, permission ou sidebar métier implémentée. Prochaine étape normative : **M2 — Rôles & Access** en appliquant ces deux décisions comme contraintes non négociables.*
