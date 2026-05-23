# ERP HR Expansion — Rapport P9

**Version :** `hr-p9-expansion-v1`  
**Position ERP :** POST-P8 (bus observable) → RH expansion gouvernée  
**Verdict :** **READY**  
**Catalogue :** `erp-event-catalog-p9-v1` — **30 types** officiels, **11 events HR actifs**

---

## 1. Contexte

Après P7 (foundation), P7.1–P7.3 (wiring, bridge, automation) et P8 (observability), le domaine RH disposait encore de :

- `hr.employee.created` en `catalog_only`
- alertes legacy `tryCreateAlert` sur contrats et recrutement
- pas d’events lifecycle contrat (`submitted`, `expired`, `terminated`, `renewed`)
- pas d’event `hr.recruitment.hire_submitted`

**P9** complète l’expansion RH sur le **bus existant** — sans rebuild, observable via P8.

---

## 2. Taxonomie P9 (+5 types)

| Type | Usage |
|------|--------|
| `hr.contract.submitted` | Soumission approbation contrat |
| `hr.contract.expired` | Statut expiré |
| `hr.contract.terminated` | Statut terminé |
| `hr.contract.renewed` | Renouvellement date fin |
| `hr.recruitment.hire_submitted` | Embauche soumise approbation |

**Activé :** `hr.employee.created` — rattachement onboarding (candidat embauché → profil).

---

## 3. Mutations & services

| Service | Actions |
|---------|---------|
| `hr-contract-lifecycle-mutations.ts` | submit, transition status, renew |
| `hr-recruitment-mutations.ts` | hire submit, domain link + employee.created |

**Write registry P9 :** 10 actions enabled (`hr-write-registry.ts`).

**Actions allégées :** `contract-actions.ts`, `recruitment-actions.ts` — plus de `tryCreateAlert` direct.

---

## 4. Notification bridge

Templates bridge actifs P9 :

- `hr.contract.submitted` → approvers
- `hr.contract.expired` / `terminated` / `renewed` → department
- `hr.recruitment.hire_submitted` → approvers
- `hr.employee.created` → department (onboarding)

Définitions : `definitions.ts` + `in-app-notification-service.ts` TEMPLATE map.

---

## 5. Legacy retiré

| Ancien mécanisme | Remplacement |
|------------------|--------------|
| `tryCreateAlert rh_contract_pending_approval` | `hr.contract.submitted` + bridge |
| `tryCreateAlert rh_contract_expired/terminated` | `hr.contract.expired/terminated` |
| `tryCreateAlert rh_contract_renewed` | `hr.contract.renewed` |
| `tryCreateAlert rh_recruitment_hire_pending` | `hr.recruitment.hire_submitted` |

Coexistence : `hr-legacy-coexistence-p9-v1` — statut `retire_after_handler`.

---

## 6. Gouvernance

- `HR_DOMAIN_GOVERNANCE` → `p9-v1`, `hr_event_bus` **active**
- Catalogue `erp-event-catalog-p9-v1`
- Audit : `hr-p9-expansion-audit.ts`
- Readiness : `hr-p9-readiness-validation.ts` → **READY**

---

## 7. Tests

`tests/unit/p9-hr-expansion.test.ts` — 7 tests (taxonomie, catalogue, registry, bridge, publish, readiness).

Compteurs globaux mis à jour : 30 types officiels dans tests catalogue/taxonomie.

---

## 8. Limites & suite

| Hors scope P9 | Phase |
|---------------|-------|
| `hr.attendance.*` | P10+ |
| Paie complète | blocked |
| Automation additionnelle lifecycle | optionnel P10 |
| Corrélation observability graphique | P11 |

**Priorité suivante :** P10 — autres domaines métiers sur bus gouverné.

---

*POST-P8 — Observe First — Expansion RH sans rebuild bus*
