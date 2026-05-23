# REMPRES ERP — Phase B3.1
# ERP Approval Engine Foundation — Rapport final

**Version :** `erp-approval-engine-b3.1-v1`  
**Date :** 2026-05-22  
**Mode :** fondation approval — **pas de build métier dept, pas de refonte Vente B1/B2 ni Finance B3 UI**  

---

## Synthèse exécutive

| Question | Verdict |
|----------|---------|
| Moteur central défini ? | **Oui** — `lib/erp-core/approval/` |
| `requiresApproval` exécutable ? | **Oui** — `assertErpMutationApprovalGate` |
| Production-ready global ? | **Partiel** — RLS approbateur = super_admin uniquement |
| Prêt mutations Finance finales ? | **Contrat prêt** — actions encore `enabled: false` |

> **ERP APPROVAL ENGINE est VALIDÉ comme fondation.**  
> **L’enforcement complet dépend** de l’extension RLS managers et de l’UI décision.

---

## 1. Audit global approval

### Existant avant B3.1

| Composant | Rôle | Dette |
|-----------|------|-------|
| `approval_requests` (036) | Persistance | Statuts DB limités |
| `lib/governance/approvals/*` | CRUD + workflow legacy | Non branché mutations B2.4 |
| `lib/approvals/approval-engine.ts` | Audit events + soft-pass | `ERP_APPROVAL_STRICT` off par défaut |
| `requiresApproval` registres Vente/Finance | Flag documentaire | **Non bloquant** |
| `/admin/approvals` | UI SA | OK supervision |

### Bypass identifiés (fermés B3.1)

- Conversion devis sans approval → **bloquée** si pas de demande `approved`
- Mutations CRM `requiresApproval: true` sans contexte → `crm:approval_context_required`

### Bypass restants

- Actions sans politique + `requiresApproval: false` → auto
- SA peut approuver via `/admin/approvals` — seul rôle DB update
- `lib/approvals` legacy parallèle (non supprimé — wrapper futur)

---

## 2. Domain model

**Contrat :** `lib/erp-core/approval/domain-model.ts`

| Type | Rôle |
|------|------|
| `ErpApprovalRequest` | Demande persistée + statut logique |
| `ErpApprovalDecision` | Résultat gate (required, granted, policy) |
| `ErpApprovalActor` | userId, role_key, department_key |
| `ErpApprovalRule` | Règle par mutationAction |
| `ErpApprovalPolicy` | Évaluation policy engine |
| `ErpApprovalScope` | dept + action + entity |

---

## 3. Lifecycle

**Statuts logiques :** draft → submitted → pending → approved | rejected | cancelled | expired  

**Mapping DB (036) :** pending, approved, rejected, expired  

| Logique | DB |
|---------|-----|
| submitted, pending | pending |
| approved | approved |
| rejected | rejected |
| cancelled, expired | expired |

**Fichier :** `lifecycle.ts` — `assertApprovalStatusTransition`

---

## 4. Security

**Alignement M2 :** `role_key` + `department_key` obligatoires pour soumission.

| Action | Qui |
|--------|-----|
| Soumettre | Opérateur du dept (pas SA) |
| Décider | **super_admin** (RLS 036 actuelle) |
| Supervision | Lecture SA |

**Dette S-A1 :** managers déclarés dans policies mais **pas** UPDATE RLS.

---

## 5. Policy engine

**Fichier :** `mutation-policies.ts` + `policy-engine.ts`

| Mutation | Politique |
|----------|-----------|
| `crm.quote.convert_sale` | governance_required |
| `finance.journal.post` | governance_required |
| `finance.expense.create/update` | threshold 500k GNF |

`evaluateMutationApprovalPolicy` — **seul point** d’évaluation (pas de if local métier).

---

## 6. Mutation gate integration

**Fichier :** `mutation-gate.ts` — `assertErpMutationApprovalGate`

**Pipeline :**
1. Policy engine  
2. `assertCanSubmitApprovalRequest`  
3. `getActiveApprovalForAction`  
4. Si approved → OK  
5. Si pending → `ApprovalRequiredError`  
6. Sinon → `createApprovalRequest` + alerte + audit → `ApprovalRequiredError`  

**Branchements minimaux :**
- `crm-write-governance.ts` — gate si `requiresApproval`  
- `quote-sale-conversion.ts` — contexte `crm_quote` + montant  
- `finance-write-governance.ts` — gate prêt (actions disabled)  

---

## 7. Audit & traceability

- `recordApprovalEngineAudit` → `governance_audit_events` (category approval)  
- `approval_requests.payload_snapshot` — montant + metadata  
- Alertes `approval_request_created`  

---

## 8. Cross-department compatibility

| Dept | Soumission | Politiques | Gate |
|------|------------|------------|------|
| Vente/CRM | ✅ | ✅ convert_sale | ✅ branché |
| Finance | ✅ | ✅ journal/expense | ✅ prêt |
| RH | ✅ | À étendre | Contrat OK |
| Logistique/Marketing | ✅ | À étendre | Contrat OK |

Format action : `{domain}.{entity}.{verb}` (B2.4).

---

## 9. Risk matrix

| ID | Risque | Impact | Mitigation |
|----|--------|--------|------------|
| R-A1 | Managers ne peuvent pas approuver (RLS) | Haute | Migration RLS dept managers |
| R-A2 | Double moteur `lib/approvals` + erp-core | Moyenne | Déléguer legacy → erp-core |
| R-A3 | UX utilisateur : erreur sans lien /admin/approvals | Moyenne | Message + lien UI |
| R-A4 | Pending bloque indéfiniment | Moyenne | Expiration job (futur) |
| R-A5 | Strict mode env off | Faible | Documenter `ERP_APPROVAL_STRICT` |

---

## 10. Dette · Legacy · Listes · Verdict

### Dette restante

- RLS approbateurs dept managers  
- UI self-service demandeur (statut pending)  
- Expiration automatique `pending` → `expired`  
- Fusion `lib/approvals` → `lib/erp-core/approval`  
- Activer mutations Finance avec contexte approval  

### Legacy (conservé)

- `lib/governance/approvals/workflow.ts` — réutilisé par gate  
- `lib/approvals/approval-engine.ts` — audit events  
- Table 036 sans migration statuts étendus  

### Incohérences

1. Statuts logiques > statuts DB  
2. Deux chemins policy (audit types vs mutation policies)  
3. `requiresApproval` finance journal sans implémentation métier  

### Problèmes ouverts

- O-A1 : RLS manager approval  
- O-A2 : Notification demandeur  
- O-A3 : Escalade SLA  

### Verdict final

| Critère | Évaluation |
|---------|------------|
| Cohérent | ✅ |
| Sécurisé | ⚠️ Partiel (soumission forte, décision SA-only) |
| Gouverné | ✅ |
| Traçable | ✅ |
| Scalable | ✅ |
| Réutilisable | ✅ |
| Production | ⚠️ **Fondation oui — exploitation métier partielle** |

---

## Fichiers livrés

```
lib/erp-core/approval/
  version.ts, domain-model.ts, lifecycle.ts, security.ts
  mutation-policies.ts, policy-engine.ts, mutation-gate.ts
  audit-trace.ts, index.ts
tests/unit/b3-1-approval-engine.test.ts
```

**Flux utilisateur convert devis :**  
1. Clic « → Vente » → création `approval_requests` (pending)  
2. Super admin approuve sur `/admin/approvals`  
3. Nouvelle tentative conversion → exécution RPC  

---

*Fin B3.1 — Approval Engine Foundation.*
