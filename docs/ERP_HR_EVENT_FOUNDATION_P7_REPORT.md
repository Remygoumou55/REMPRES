# ERP HR Event Foundation — Rapport P7

**Version :** `hr-event-foundation-p7-v1`  
**Position ERP :** POST-P6.1 → ouverture domaine RH gouverné  
**Verdict foundation :** **READY**  
**Verdict activation métier :** **NOT READY** (volontaire — scope P7)

---

## 1. Contexte ERP

REMPRES ERP dispose d'une infrastructure mature :

- ERP Core (M1 → M3.75)
- Vente / CRM (B1 → P1)
- Finance events (B3 → P6.1)
- Approval (B3.1)
- Event Bus (B3.2)
- Notifications (P2 → P5)
- Automation (P6 → P6.1)

**P7** ouvre le **premier nouveau domaine métier** sur cette stack, sans rebuild parallèle.

---

## 2. État actuel (audit)

| Zone | État | Chemin |
|------|------|--------|
| Collaborateurs | Opérationnel | `modules/hr/employees/` |
| Contrats | Opérationnel + approval SQL | `modules/hr/contracts/` |
| Recrutement | Opérationnel + approval hire | `modules/hr/recruitment/` |
| Congés / présences | App-local | `app/(app)/rh/` |
| Bus ERP HR | **Absent avant P7** | — |
| Legacy alerts | `tryCreateAlert` actif | `contract-actions.ts`, `recruitment-actions.ts` |

**Gaps identifiés :** pas de `publishErpEvent`, pas de mutation-gate B3, dual clé `RH` / `rh`.

Livrable machine-readable : `lib/erp-core/events/foundation/hr-current-state-audit.ts`

---

## 3. Rappel — déjà fait (ne pas refaire)

- Event bus unique
- Notification bridges (CRM, approval, finance)
- Automation engine (read-safe)
- Finance write governance (P4.1)
- Bootstrap handlers idempotent

---

## 4. Gouvernance domaine RH

**Fichiers :**

- `lib/hr/governance/hr-domain-governance.ts` — `HR_DOMAIN_GOVERNANCE`, `HR_GOVERNANCE_MAP`
- `lib/hr/runtime/` — `HR_RUNTIME_FOUNDATION`, `HR_RUNTIME_DESIGN_MAP`, `hr-write-governance`

**Classification capacités :** active | planned | blocked | approval_ready

**Interdictions P7 :** payroll, ATS complet, bus parallèle, writes sauvages.

---

## 5. Taxonomie événements

Six types ajoutés à `OFFICIAL_ERP_EVENT_TYPES` (25 types officiels total) :

| Type | Priorité | Owner |
|------|----------|-------|
| `hr.employee.created` | normal | hr |
| `hr.employee.updated` | normal | hr |
| `hr.contract.created` | normal | hr |
| `hr.contract.expiring` | high | hr |
| `hr.leave.requested` | normal | hr |
| `hr.leave.approved` | normal | hr |

**Catalogue :** `erp-event-catalog-p7-v1` — tous `catalog_only`.

**Amendement :** `lib/erp-core/events/governance/hr-event-governance-amendment.ts`

---

## 6. Runtime design

Pattern **read-first, governed-write-ready** :

- SoT : `profiles`, `rh_employee_contracts`, `rh_leave_requests`
- Surfaces lecture actives
- Registry writes : **0 enabled** (P7.1)

`HR_RUNTIME_DESIGN_MAP` documente security, payload, ownership par surface.

---

## 7. Publishers

**Fichier :** `lib/erp-core/events/integrations/hr-events.ts`

| Publisher | Event |
|-----------|-------|
| `emitHrEmployeeCreated` | `hr.employee.created` |
| `emitHrEmployeeUpdated` | `hr.employee.updated` |
| `emitHrContractCreated` | `hr.contract.created` |
| `emitHrContractExpiring` | `hr.contract.expiring` |
| `emitHrLeaveRequested` | `hr.leave.requested` |
| `emitHrLeaveApproved` | `hr.leave.approved` |

**Design map :** `hr-publisher-design-map.ts` — `wirePhase: publisher_ready`

**Pattern :** publisher → bus → trace (`integration_publish_defaults`)

**Pas de wiring mutations P7.**

---

## 8. Notification readiness

`HR_NOTIFICATION_READINESS_MAP` — candidats minimum :

- `hr.contract.expiring` → remplace `rh_contract_renewal_due`
- `hr.leave.requested`
- `hr.leave.approved`

**Bridge :** `notification-hr-bridge` = **P7.2** (miroir finance P5).

---

## 9. Automation readiness

`HR_AUTOMATION_READINESS_MAP` :

- `hr.contract.expiring` → reminder candidate (read-safe)
- `hr.leave.approved` → post-approval candidate (read-safe)

**Pas de write auto. Pas de payroll auto.**

Activation règles = **P7.3**.

---

## 10. Security & approval

`HR_SECURITY_APPROVAL_MODEL` — matrice read | approval_ready | restricted.

- Payload bus : ids, status, dates — **pas de salaire / IBAN / médical**
- Contrats : activation via SQL trigger + `approval.request.*` existant
- Congés : `leave_request` approval + statut local

---

## 11. Coexistence legacy

`HR_COEXISTENCE_STRATEGY` :

- Conserver `tryCreateAlert` jusqu'à bridge P7.2
- Conserver SQL sync contrat/hire
- Ordre : taxonomy P7 → publishers P7 → mutations P7.1 → bridge P7.2

---

## 12. Readiness validation

| Check | Statut |
|-------|--------|
| Taxonomie 6 types | PASS |
| Ownership / security | PASS |
| Publishers design | PASS |
| Runtime foundation | PASS |
| Notification readiness | PASS |
| Automation readiness | PASS |
| Writes disabled | PASS |

**Verdict P7 foundation : READY**  
**Verdict wiring production : NOT READY** (P7.1+)

Source : `hr-event-readiness-validation.ts`

---

## 13. Risques

| Risque | Mitigation |
|--------|------------|
| Dual clé RH/rh | `HR_DEPARTMENT_KEY` bus + doc approvals |
| Double alertes (legacy + bridge) | Coexistence plan + retire condition |
| Scope creep payroll | `blocked` dans governance map |
| Events sauvages | Naming lock + catalog_only |

---

## 14. Dette technique

1. Wiring mutation-gate sur HR actions
2. Remplacement `tryCreateAlert` par bridge
3. Scheduled evaluator `hr.contract.expiring`
4. Unification clés département dans `rh-foundation.ts`
5. Events recrutement (`hr.recruitment.*`) — P9+

---

## 15. Prochaines priorités

| Phase | Objectif |
|-------|----------|
| ~~**P7.1**~~ | ~~Enable registry + wire leave/contract/employee mutations~~ **FAIT** |
| ~~**P7.2**~~ | ~~`notification-hr-bridge` + alert types~~ **FAIT** |
| ~~**P7.3**~~ | ~~Automation + `hr.contract.expiring`~~ **FAIT** |
| **P8** | Observability / Bus UI |
| **P9** | Expansion RH complète |

---

## 18. Addendum P7.1 — Mutation wiring (POST-P7)

**Catalogue :** `erp-event-catalog-p7-1-v1`

**Writes activés (5) :** `hr.contract.create`, `hr.leave.request`, `hr.leave.status_update`, `hr.employee.role_update`, `hr.employee.manager_update`

**Events actifs (4) :** `hr.contract.created`, `hr.leave.requested`, `hr.leave.approved`, `hr.employee.updated`

**Services :**
- `modules/hr/server/services/hr-leave-mutations.ts`
- `modules/hr/server/services/hr-contract-mutations.ts`
- `modules/hr/server/services/hr-employee-mutations.ts`

**Flux :** gate → write DB → `emitHr*` + `recordHrGovernanceAudit` (parallèle)

**Verdict mutation wiring :** **READY**

---

## 19. Addendum P7.2 — Notification bridge

**Bootstrap :** `erp-event-handlers-bootstrap-p7-2-v1`

**Handler :** `notification-hr-bridge` — pattern `hr.*`, scope `RH`

**Templates actifs :**
- `hr.leave.requested` → `hr_leave_requested` (approvers)
- `hr.leave.approved` → `hr_leave_approved` (department)
- `hr.contract.expiring` → `hr_contract_expiring` (department, émission P7.3)

**Verdict notification bridge :** **READY**

---

## 20. Addendum P7.3 — Contract expiring + automation

**Catalogue :** `erp-event-catalog-p7-3-v1`

**Évaluateur :** `lib/hr/runtime/hr-contract-expiry-evaluator.ts`  
Déclenché sur `getContractDomainSnapshot()` (fire-and-forget) + transition manuelle `renewal_due`.

**Règles automation actives :**
- `hr.contract.expiring.reminder` → trace (notification via bridge P7.2)
- `hr.leave.approved.post` → candidat calendrier RH (read-safe)

**Legacy :** `tryCreateAlert rh_contract_renewal_due` retiré → `emitHrContractExpiring`

**Verdict automation RH :** **READY**

---

## 16. Fichiers livrés P7

```
lib/hr/governance/
lib/hr/runtime/
lib/erp-core/events/integrations/hr-events.ts
lib/erp-core/events/governance/hr-*.ts
lib/erp-core/events/foundation/hr-*.ts
lib/erp-core/events/event-taxonomy.ts (amendé)
lib/erp-core/events/governance/event-catalog-governance.ts (p7-v1)
tests/unit/p7-hr-event-foundation.test.ts
docs/ERP_HR_EVENT_FOUNDATION_P7_REPORT.md
```

---

## 17. Critères validation P7

| Critère | Statut |
|---------|--------|
| Audit RH | ✔ |
| Gouvernance RH | ✔ |
| Taxonomie RH | ✔ |
| Runtime foundation | ✔ |
| Publishers définis | ✔ |
| Notification readiness | ✔ |
| Automation readiness | ✔ |
| Security model | ✔ |
| Coexistence | ✔ |
| Readiness validée | ✔ |
| Rapport final | ✔ |
| Sans rebuild / chaos | ✔ |

**P7 HR Event Foundation — VALIDÉ.**
