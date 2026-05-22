# REMPRES ERP — Phase B2.4
# ERP Governance Standardization — Rapport final

**Produit :** RemPres ERP  
**Date :** 2026-05-22  
**Mode :** standardisation globale — **aucun build département, aucune modification B1/B2.0–B2.3**  
**Livrable code :** `lib/erp-core/governance/standard/*` (contrats normatifs)  
**Version standard :** `erp-governance-standard-b2.4-v1`  

---

## Synthèse exécutive

| Question | Verdict |
|----------|---------|
| Vente est-elle un **standard potentiel** ? | **Oui** — seul département avec runtime complet B2.0→B2.3 |
| L’ERP est-il **standardisé** aujourd’hui ? | **Non** — standard **défini** en B2.4, **appliqué** surtout à Vente |
| Prêt pour Finance / RH / Formation / Logistique sans dette ? | **Partiel** — contrat prêt, **migration obligatoire** avant build |
| Fragmentation future évitée ? | **Si** les futurs dept **obéissent** B2.4 — sinon **risque élevé** |

**Phrase normative :**  
> Vente n’est plus un pilote isolé : c’est la **référence d’implémentation** du **ERP Governance Standard**. Tout autre département doit **mapper** ses runtime sur les mêmes slots, pas réinventer.

---

# 1. Audit global (Phase 1)

## 1.1 Périmètre audité

| Zone | Fichiers / surfaces clés | État observé |
|------|--------------------------|--------------|
| **ERP Core M2** | `lib/server/permissions.ts`, `auth-operational-guards.ts`, `profiles.role_key` + `department_key` | **Stable** — identité non négociable |
| **ERP Core M3** | `erp-ux-architecture.ts`, `COCKPIT_ZONE_ORDER`, `FORBIDDEN_DEPT_COCKPIT_PATTERNS` | **Verrouillé** structurellement |
| **Super Admin** | `/dashboard`, `SuperAdminCockpitClient`, `getDashboardKpis` | **Finalisé** — surface **supervision globale**, pas modèle manager dept |
| **Vente Runtime** | `lib/vente/runtime/*` (10 modules) | **Complet** — lifecycle, KPI, security, mutation, orchestration, cockpit |
| **CRM (sous Vente)** | `modules/crm/*`, `crm-overview`, `crm-mutations` | **Opérationnel** B2.1/B2.2 — gouverné |
| **Cockpit manager** | `/vente/dashboard` → `getVenteCockpitPayload` | **Live** B2.3 |
| **Cockpit autres dept** | `*/dashboard` → `DepartmentDashboardPage` placeholder | **Non live** |
| **Supervision dept** | `/api/dept/[deptKey]/kpis` | **Hétérogène** — Vente aligné, Finance inline, RH cache, reste placeholder |
| **Governance transverse** | `lib/governance/*` (audit, approvals, alerts, aggregate-kpi) | **Existe** — pas unifié avec runtime dept |
| **SQL / RLS** | `049_crm_*`, `051_convert_crm_quote_*`, `034_lifecycle` | **Partiel** — lifecycle ventes OK ; CRM RLS sans `department_key` |

## 1.2 Patterns réels identifiés (positifs)

1. **Runtime package par domaine mature** — `lib/vente/runtime/` avec exports indexés.  
2. **Source KPI versionnée** — `metadata.source` explicite (`vente-commerce-runtime-v1`, etc.).  
3. **Filtre lifecycle ventes** — `lifecycle_status = validated` pour KPI opérationnels (B2.0).  
4. **Registre mutations** — `CRM_WRITE_ACTION_REGISTRY` + `assertCrmWriteActionAllowed`.  
5. **Orchestration contract-first** — plan + validation FK avant/après RPC.  
6. **Cockpit manager dédié** — payload unique, zones M3, pas `getDashboardKpis`.  
7. **SEC-1 applicatif** — `vente-runtime-security` (dept + module + pas de mutation SA).  

## 1.3 Duplications & chaos latent

| ID | Duplication / chaos | Sévérité | Départements touchés |
|----|---------------------|----------|----------------------|
| D-G1 | **3 surfaces KPI** : cockpit manager, hub CRM, API dept / SA dashboard | Haute | Vente |
| D-G2 | **2 chemins audit** : `governance_audit_events` (CRM hook) vs `lib/governance/audit/*` | Moyenne | Global |
| D-G3 | **2 modèles approval** : `requiresApproval` registre CRM vs `isSensitiveAction` audit-types | Moyenne | Global |
| D-G4 | Cockpit **placeholder** vs **live** selon dept | Haute | Finance, RH, Formation, … |
| D-G5 | API dept **inline queries** (Finance) vs **runtime façade** (Vente) | Haute | Finance vs Vente |
| D-G6 | `deleted_at` historique ventes vs `lifecycle_status` KPI | Moyenne | Vente |
| D-G7 | Hub `/vente/crm` KPI réels + lien vers cockpit | Faible | Vente (gouverné B1.3) |
| D-G8 | `DepartmentCockpitArchitecture` **non peuplé** dans `erp-ux-architecture.ts` (seulement sidebar) | Moyenne | Tous |

## 1.4 Dette gouvernance (audit honnête)

- **SEC-1 SQL** CRM sans `department_key` (049).  
- **`requiresApproval: true`** sur `QUOTE_CONVERT_SALE` **sans enforcement** bloquant.  
- **Finance KPI** : somme `sales` **sans** `lifecycle_status` ni règle net cancelled.  
- **Pas de `lib/{dept}/runtime/`** hors Vente.  
- **Registre mutation** nommé CRM-only — pas encore `ErpMutationRegistry` générique.  

---

# 2. Runtime standard (Phase 2)

## 2.1 Définition officielle

**Runtime ERP** = couche serveur **sans UI** qui centralise :

| Slot | Responsabilité | Référence Vente |
|------|----------------|-----------------|
| `lifecycle` | États officiels entités opérationnelles | `sales-lifecycle.ts` |
| `aggregation` | Règles net/brut, périodes, agrégats purs | `sale-kpi-aggregates.ts` |
| `domain_kpi` | **SoT** indicateurs par sous-domaine | `vente-commerce-kpis.ts`, `crm-overview` |
| `security` | Assert lecture/écriture dept + module | `vente-runtime-security.ts` |
| `mutation_governance` | Registre + porte d’entrée writes | `crm-write-governance.ts` |
| `orchestration_contract` | Plan steps + validation FK | `quote-sale-orchestration.ts` |
| `cockpit_payload` | Assemblage manager (dérivé domain_kpi) | `vente-cockpit-payload.ts` |

**Contrat :** `lib/erp-core/governance/standard/runtime-standard.ts`

## 2.2 Boundaries

- ✅ Import : `lib/server/*`, `types`, `modules/{domain}/server/services`  
- ❌ Import : `app/(app)/*`, composants React, actions UI sans passer par services  

## 2.3 Runtime lock (règles futures)

1. Tout nouveau dept **crée** `lib/{dept}/runtime/` (ou `lib/erp-core/runtime/{dept}/` si mutualisé).  
2. **Interdit** requêtes KPI inline dans `page.tsx` ou `route.ts` (sauf délégation à façade).  
3. Façade supervision `buildDept{X}KpiPayload` **dérive** du domain_kpi — règle `ERP_RUNTIME_SUPERVISION_RULE`.  

## 2.4 Écart Vente vs ERP

| Critère | Vente | ERP global |
|---------|-------|------------|
| Package runtime dédié | ✅ | ❌ (1/7 dept) |
| Index export | ✅ | N/A |
| Lifecycle documenté | ✅ ventes | ❌ autres entités |
| **Verdict runtime lock** | **LOCKED (référence)** | **STANDARD DEFINED, NOT DEPLOYED** |

---

# 3. KPI standard (Phase 3)

## 3.1 Règle d’or

> **1 KPI = 1 SoT = 1 définition de filtre = 1 `source` versionné**

**Contrat :** `lib/erp-core/governance/standard/kpi-standard.ts`

## 3.2 Sources Vente verrouillées (référence)

| Source ID | Owner | Consommateurs autorisés |
|-----------|-------|-------------------------|
| `vente-commerce-runtime-v1` | Commerce / ventes | cockpit (slice), dept API, `getDashboardKpis` (délégation) |
| `crm-operational-runtime-v1` | CRM | cockpit, hub CRM, bundle |
| `vente-runtime-kpi-bundle-v1` | Façade | pages nécessitant commerce+CRM |
| `vente-cockpit-runtime-v1` | Cockpit manager | `/vente/dashboard` uniquement |

## 3.3 Contrat payload

- Chaque agrégat expose `{ source, generatedAt }`.  
- `DeptKpiPayload.metadata.source` **doit** pointer vers domain_kpi (Vente ✅).  
- Pattern ID : `{dept}-{domain}-runtime-v{n}` (regex dans standard).  

## 3.4 Incohérences KPI détectées

| ID | Problème | Preuve |
|----|----------|--------|
| I-K1 | Finance dept API : CA brut `sales` sans lifecycle | `app/api/dept/[deptKey]/kpis/route.ts` case finance |
| I-K2 | Historique ventes filtre `deleted_at` pas lifecycle | `vente/historique/page.tsx` |
| I-K3 | Hub CRM affiche KPI hors cockpit (acceptable si sous-page) | `/vente/crm` |
| I-K4 | `getDashboardKpis` reste entrée SA — risque réutilisation cockpit | `dashboard-kpis.ts` |

## 3.5 KPI lock verdict

| Élément | Statut |
|---------|--------|
| Standard documenté | ✅ B2.4 |
| Vente conforme | ✅ B2.0–B2.3 |
| Finance / autres conformes | ❌ |
| **KPI STANDARD** | **READY FOR REUSE** |

---

# 4. Security standard (Phase 4)

## 4.1 Modèle officiel

**Contrat :** `lib/erp-core/governance/standard/security-standard.ts`

### Couches (ordre)

1. Session auth  
2. `role_key` → table `permissions`  
3. `department_key` scope opérationnel  
4. Module permissions (`canRead/Create/Update/Delete`)  
5. `assertOperationalMutationAllowed` (anti SA opérationnel)  
6. Domain runtime assert (ex. `assertCrmRuntimeWriteAccess`)  
7. SQL RLS  

### Règles non négociables

- `role_key` + `department_key` sur `profiles` — **obligatoire** pour opérationnel.  
- Supervision : lecture cross-dept **autorisée** ; mutation opérationnelle **interdite**.  
- Écriture CRM/Vente : dept **VENTE** + permission module — **SEC-1 app**.  

## 4.2 Écarts sécurité

| ID | Écart | Impact |
|----|-------|--------|
| S-1 | `user_has_crm_module_permission` sans dept | Cross-dept CRM si mauvais rôle |
| S-2 | SEC-1 uniquement dans `vente-runtime-security` | Autres dept sans assert symétrique |
| S-3 | API dept : contrôle `deptPermission.canRead` — pas runtime dept assert | Incohérence potentielle |
| S-4 | `requiresApproval` non bloquant | Mutations sensibles sans workflow |

## 4.3 Security lock verdict

| Critère | Statut |
|---------|--------|
| M2 identity | ✅ LOCKED |
| SEC-1 global | ⚠️ PARTIAL (Vente app + dette SQL) |
| **SECURITY STANDARD** | **DEFINED — ENFORCEMENT INCOMPLETE** |

---

# 5. Mutation governance standard (Phase 5)

## 5.1 Modèle registre

**Format action :** `{domain}.{entity}.{verb}` (ex. `crm.quote.convert_sale`)

**Entrée registre :**
```ts
{ enabled: boolean; requiresApproval: boolean; description: string }
```

**Pipeline obligatoire :**
1. `assertOperationalMutationAllowed`  
2. `assertDomainRuntimeWriteAccess`  
3. `assertMutationActionAllowedInRegistry`  
4. Service mutation  
5. `recordGovernanceAudit`  
6. `revalidateScopes`  

**Contrat :** `lib/erp-core/governance/standard/mutation-standard.ts`

## 5.2 Référence Vente

- Registre : `CRM_WRITE_ACTION_REGISTRY` (10 actions, toutes enabled post B2.2).  
- Implémentation : `crm-mutations.ts` + `quote-sale-conversion.ts`.  
- Audit : `recordCrmGovernanceAudit` → `governance_audit_events`.  

## 5.3 Interdictions

- Insert/Update direct depuis page sans gate.  
- Server action sans registre.  
- Flag `requiresApproval` sans enforcement.  

## 5.4 Mutation lock verdict

| Critère | Vente | Global |
|---------|-------|--------|
| Registre explicite | ✅ CRM | ❌ autres domaines |
| Gate unique | ✅ | ❌ |
| Approval effectif | ⚠️ | ❌ |
| **MUTATION STANDARD** | **REFERENCE LOCKED** | **NOT GENERALIZED** |

---

# 6. Orchestration standard (Phase 6)

## 6.1 Contrat

**Contrat :** `lib/erp-core/governance/standard/orchestration-standard.ts`

Capacités requises :
- Pré-validation état  
- Transaction atomique (RPC PL/pgSQL recommandé)  
- FK bidirectionnelles cohérentes  
- Post-assert (`assertQuoteSaleOrchestrationReady`)  
- Audit gouvernance post-succès  

## 6.2 Référence quote→sale

| Couche | Artefact |
|--------|----------|
| Contrat TS | `quote-sale-orchestration.ts` (`b2.0-v1`) |
| RPC | `051_crm_quote_convert_sale_orchestration.sql` |
| Service | `quote-sale-conversion.ts` |

## 6.3 Interdictions

- Multi-update client sans transaction  
- Orchestration dans composant UI  
- FK mono-directionnelle  

## 6.4 Orchestration lock verdict

**ORCHESTRATION STANDARD : READY** (1 cas référence complet ; généralisation à documenter par workflow Finance/RH).

---

# 7. Cockpit & dashboard standard (Phase 7)

## 7.1 Distinction surfaces

| Surface | Rôle | Route type | Données |
|---------|------|------------|---------|
| **Manager cockpit** | Pilotage quotidien | `/{dept}/dashboard` | `get{Dept}CockpitPayload` |
| **Supervision dept** | SA / admin | `/dept/{dept}`, API | `buildDept{Dept}KpiPayload` |
| **Super Admin** | Gouvernance plateforme | `/dashboard` | `getDashboardKpis` + governance |

**Cockpit ≠ opérationnel.** Cockpit = **pilotage**.

## 7.2 Zones M3 (ordre locké)

`context_header → kpi_primary → alerts → charts → recent_activity → quick_actions`

**Contrat :** `lib/erp-core/governance/standard/cockpit-standard.ts`

## 7.3 État par département

| Dept | Cockpit manager | Conformité B2.4 |
|------|-----------------|-----------------|
| **VENTE** | `VenteCockpitClient` live | ✅ Référence |
| Finance | Placeholder | ❌ |
| RH | Placeholder | ❌ |
| Formation | Placeholder | ❌ |
| Consultation | Placeholder | ❌ |
| Marketing | Placeholder | ❌ |
| Logistique | Placeholder | ❌ |
| Super Admin | `SuperAdminCockpitClient` | ✅ (surface distincte) |

## 7.4 Cockpit lock verdict

**COCKPIT STANDARD : DEFINED** — **1 département conforme (Vente)**.

---

# 8. Cross-department compatibility (Phase 8)

## 8.1 Matrice réutilisation

| Standard slot | Finance | RH | Formation | Logistique | Marketing |
|---------------|---------|-----|-----------|------------|-----------|
| Runtime package | Requis | Requis | Requis | Requis | Requis |
| domain_kpi | Trésorerie, dépenses | Effectifs, congés | Sessions, certifs | Stock, OTIF | Campagnes |
| mutation_registry | Dépenses, validation | Contrats, congés | Inscriptions | Mouvements | Campagnes |
| orchestration | Paiement↔vente | Embauche↔profil | Certif↔session | Réception↔stock | — |
| cockpit_payload | Oui | Oui (RH cache partiel) | Oui | Oui | Oui |
| SEC-1 symétrique | Requis | Requis | Requis | Requis | Requis |

## 8.2 Extensibilité

- ✅ **Modulaire** : sous-domaines (CRM⊂Vente) mappables via `domain` dans source KPI.  
- ✅ **DeptKpiPayload** : contrat API supervision déjà neutre (`lib/dept/kpi-contract.ts`).  
- ⚠️ **Rigide si** les dept copient le pattern Finance (inline route) au lieu du runtime.  
- ⚠️ **Subdomain** : nécessite amendement standard (version `v2`) — pas de hack UI.  

## 8.3 Verdict scalabilité

**ERP SCALABILITY : GOOD CONTRACT / PARTIAL ENFORCEMENT**

---

# 9. Risk matrix (Phase 9)

| ID | Risque | Prob. | Impact | Mitigation B2.4+ |
|----|--------|-------|--------|------------------|
| R-1 | Nouveau dept bypass runtime → KPI faux | Haute | Critique | CI test + revue obligatoire `lib/{dept}/runtime` |
| R-2 | Finance build sur API inline sales bruts | Moyenne | Haute | Migrer vers `finance-runtime` + lifecycle aligné |
| R-3 | SEC-1 SQL sans dept → fuite CRM | Moyenne | Haute | Migration RLS `department_key` |
| R-4 | `requiresApproval` décoratif | Moyenne | Moyenne | Brancher `governance/approvals/workflow` |
| R-5 | Double audit path | Faible | Moyenne | Unifier `recordCrmGovernanceAudit` → repository |
| R-6 | Cockpit placeholder perçu comme bug | Haute | Moyenne | Badge « données à venir » ou prioriser 1 dept |
| R-7 | Historique `deleted_at` vs lifecycle | Moyenne | Moyenne | Aligner listes sur `lifecycle_status` |
| R-8 | Hub CRM confondu avec homepage | Faible | Faible | B1.3 déjà gouverné — garder lien cockpit |
| R-9 | Orchestration sans RPC pour Finance | Moyenne | Haute | Exiger pattern 051 pour écritures multi-tables |
| R-10 | Standard Vente-only non lu | Moyenne | Critique | Import `@/lib/erp-core/governance/standard` en CI |

---

# 10. Dette restante · Legacy · Listes · Verdict final

## 10.1 Dette restante (priorisée)

| P0 | Item |
|----|------|
| P0-1 | Généraliser registre mutation → `ErpMutationRegistry` par dept |
| P0-2 | SEC-1 SQL aligné `department_key` (CRM + futurs modules) |
| P0-3 | Interdire KPI inline dans `app/api/dept/*/kpis` (façade runtime only) |
| P1 | Enforcement `requiresApproval` |
| P1 | Aligner historique ventes sur lifecycle |
| P1 | Peupler `DepartmentCockpitArchitecture` dans `erp-ux-architecture.ts` |
| P2 | Unifier chemins audit |
| P2 | Cockpit live Finance/RH (build dept, pas B2.4) |

## 10.2 Legacy restant

- `DepartmentCockpitPlaceholder` — **légitime** pour dept non migrés.  
- `getDashboardKpis` — **légitime** pour SA, **interdit** pour manager dept.  
- `constants/departments.ts` route `vente` → `/dept/vente` — supervision, pas cockpit.  
- `DashboardClient` — legacy redirect métiers.  
- `deleted_at` sur `sales` — compat schéma, pas SoT KPI.  

## 10.3 Incohérences détectées (liste complète)

1. I-K1 — Finance KPI sans lifecycle  
2. I-K2 — Historique ventes `deleted_at`  
3. I-C1 — Cockpit entry sans data (autres dept)  
4. I-C2 — Placeholder quick actions URLs (autres dept)  
5. D-G1 — Triple surface KPI Vente  
6. D-G4 — Cockpit live vs placeholder  
7. D-G5 — API dept inline vs runtime façade  
8. S-1 — CRM RLS sans department_key  
9. S-4 — Approval non enforced  
10. D-G2 — Dual audit paths  
11. D-G3 — Dual approval models  
12. D-G8 — Cockpit architecture spec vide par dept  
13. I-C3 — `departments` route vs `/vente/dashboard` confusion  
14. W-L3 — SQL CRM permission sans dept (B1.5)  

## 10.4 Risques futurs (liste complète)

1. Fragmentation runtime par dept  
2. KPI contradictoires cross-dept (ex. CA Finance ≠ CA Vente)  
3. Mutations non auditées hors registre  
4. Orchestrations locales fragiles  
5. Cockpit CRM comme homepage  
6. Super Admin mutations opérationnelles (bloqué app — maintenir)  
7. Copie du pattern Finance inline  
8. Oubli versioning `source` sur nouveaux KPI  
9. Tests CI sans contrat B2.4  
10. Subdomain sans amendement standard  

## 10.5 Problèmes ouverts (liste complète)

| ID | Problème | Owner phase |
|----|----------|-------------|
| O-1 | SEC-1 SQL CRM | Migration SQL |
| O-2 | Approval QUOTE_CONVERT | Workflow governance |
| O-3 | Finance runtime absent | Finance B3+ |
| O-4 | Cockpit placeholder 6 dept | Par dept build |
| O-5 | Historique lifecycle | Vente maintenance |
| O-6 | Registre mutation global | ERP core |
| O-7 | Triple nav CRM | UX cleanup |
| O-8 | Activities CRM UI | B2.x CRM |

## 10.6 Verdict final — ERP Governance Standard

| Critère | Évaluation |
|---------|------------|
| Cohérent | ✅ **Oui** — contrat B2.4 aligné M1–M3 + Vente B2.x |
| Réutilisable | ✅ **Oui** — slots + références Vente documentés |
| Scalable | ⚠️ **Oui sous conditions** — pas si bypass runtime |
| Sécurisé | ⚠️ **Partiel** — M2 OK, SEC-1 incomplet global |
| Non fragmenté | ❌ **Non encore** — 1/7 dept runtime complet |
| Enterprise-grade | ⚠️ **En progression** — référence Vente solide |
| Prêt futurs départements | ✅ **Standard prêt** · ❌ **Plateforme pas homogène** |

### Formulation officielle

> **ERP GOVERNANCE STANDARD `erp-governance-standard-b2.4-v1` est VALIDÉ comme contrat.**  
> **Vente est CERTIFIÉE référence d’implémentation.**  
> **L’ERP dans son ensemble N’EST PAS encore standardisé opérationnellement.**

**Prochaine action autorisée :** build département **sous contrat B2.4** (ex. Finance B3) — **pas** de modification rétroactive B2.0–B2.3 sans phase dédiée.

---

## Annexes

### A. Fichiers standard B2.4

```
lib/erp-core/governance/standard/
  standard-version.ts
  runtime-standard.ts
  kpi-standard.ts
  security-standard.ts
  mutation-standard.ts
  orchestration-standard.ts
  cockpit-standard.ts
  vente-reference-implementation.ts
  index.ts
```

### B. Import officiel pour futurs builds

```ts
import {
  ERP_GOVERNANCE_STANDARD_VERSION,
  VENTE_ERP_STANDARD_SLOTS,
} from "@/lib/erp-core/governance/standard";
```

### C. Tests CI

`tests/unit/b2-4-erp-governance-standard.test.ts`

---

*Fin du rapport B2.4 — Standardisation ERP globale. Aucun rebuild Vente. Aucun build Finance/RH dans cette phase.*
