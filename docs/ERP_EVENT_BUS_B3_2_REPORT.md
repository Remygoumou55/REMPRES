# REMPRES ERP — Phase B3.2
# ERP Event Bus Foundation — Rapport final

**Version :** `erp-event-bus-b3.2-v1`  
**Date :** 2026-05-22  
**Mode :** fondation bus événementiel — **pas de notifications finales, pas d’automation, pas de workflow parallèle, pas de refonte B1/B2/B3.1**

---

## Synthèse exécutive

| Question | Verdict |
|----------|---------|
| Bus central unique ? | **Oui** — `lib/erp-core/events/` |
| Taxonomie `domain.entity.action` ? | **Oui** — catalogue officiel + pattern lock |
| Publish / subscribe in-process ? | **Oui** |
| Intégration B3.1 (approval + mutation) ? | **Oui** — `mutation-gate`, `/admin/approvals` |
| Intégration orchestration CRM quote→sale ? | **Oui** — `emitCrmQuoteConverted` post-RPC |
| Production-ready global ? | **Partiel** — bus process-local, pas de persistance événements dédiée |
| Prêt notifications / automation ? | **Contrat prêt** — handlers à brancher, pas de build métier |

> **ERP EVENT BUS est VALIDÉ comme fondation.**  
> **Toute notification, automation, cockpit refresh avancé et workflow externe doit passer par `publishOfficialErpEvent` / publishers d’intégration.**

---

## 1. Audit global événementiel

### 1.1 État avant B3.2

| Zone | Mécanisme actuel | Nature | Dette |
|------|------------------|--------|-------|
| Mutations CRM | `recordCrmGovernanceAudit` | Audit direct | Pas d’événement bus |
| Approval gate B3.1 | `recordApprovalEngineAudit` + `tryCreateAlert` | Side effects parallèles | Alertes ≠ événements |
| `/admin/approvals` | `decideApprovalRequest` + audit legacy | Impératif | Pas de chaîne événementielle |
| Quote→sale B2.2 | RPC `convert_crm_quote_to_sale` + orchestration assert | SQL + TS | Succès silencieux côté bus |
| Finance B3 | Registre write `enabled: false` | Pas de flux live | `finance.transaction.recorded` non émis |
| Cockpit Vente/Finance | Requêtes runtime KPI | Pull | Pas d’événement refresh |
| `lib/governance/alerts` | `tryCreateAlert` | Alerting ad hoc | Couplage UI/governance |
| `revalidatePath` | Next cache | Technique | Hors bus (acceptable) |
| `lib/approvals/approval-engine.ts` | Legacy soft-pass | Parallèle | Non migré |

### 1.2 Side effects identifiés (non supprimés — cartographiés)

- **Alerts** : créées dans `mutation-gate` (pending) et `admin/approvals` (approved/rejected) — restent en place ; le bus **ne les remplace pas** en B3.2.
- **Audit gouvernance** : CRM, approval engine, event bus (`category: event`) — triple traçabilité volontaire en fondation.
- **RPC orchestration** : reste SoT transactionnelle ; le bus **signale** le succès (`crm.quote.converted`, `runtime.orchestration.completed`).

### 1.3 Couplage restant (honnête)

| Couplage | Gravité | Mitigation B3.2 |
|----------|---------|-----------------|
| Modules importent publishers `integrations/*` | Moyenne | Publishers officiels = seule porte d’entrée publish |
| Pas de bus DB / queue | Faible (by design) | In-process ERP core |
| CRM mutations sans bus | Haute (legacy) | Migration progressive B3.3+ |
| Finance sans emit | Attendu | Slot `finance-events.ts` futur |
| `role_key` non vérifié à publish | Moyenne | `assertCanPublishEvent` minimal (acteur + dept) |

---

## 2. Domain model

**Fichier :** `lib/erp-core/events/event-contracts.ts`

| Type | Rôle |
|------|------|
| `ErpEventEnvelope` | Enveloppe normative (id, type, version, family, sensitivity, actor, entity, payload, correlation/causation) |
| `DomainEvent` | `family: "domain"` |
| `RuntimeEvent` | `family: "runtime"` |
| `MutationEvent` | `family: "mutation"` |
| `ApprovalEvent` | `family: "approval"` |
| `AuditEvent` | `family: "audit"` |
| `NotificationCandidateEvent` | `family: "notification_candidate"` (réservé futur) |
| `ErpEventHandler` | Consumer in-process |

**Lifecycle :** `publish` → trace `published` → audit optionnel → `dispatch` → handlers → trace `handler_ok` / `handler_error`.

**Version bus :** `erp-event-bus-b3.2-v1` (`version.ts`).

---

## 3. Taxonomie et naming lock

**Fichier :** `lib/erp-core/events/event-taxonomy.ts`

- Pattern : `^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]+$`
- Convention : **`domain.entity.action`**

### Catalogue officiel (B3.2)

| Constante | Type | Family | Sensitivity | Owner |
|-----------|------|--------|-------------|-------|
| `approval.request.created` | approval | approval | internal | approval-engine |
| `approval.request.approved` | approval | approval | internal | approval-engine |
| `approval.request.rejected` | approval | approval | internal | approval-engine |
| `approval.gate.granted` | approval | approval | internal | approval-engine |
| `mutation.blocked.pending` | mutation | mutation | internal | mutation-gate |
| `crm.quote.convert_requested` | mutation | mutation | internal | vente-crm |
| `crm.quote.converted` | domain | domain | internal | vente-crm |
| `finance.transaction.recorded` | domain | domain | restricted | finance |
| `system.audit.recorded` | audit | audit | restricted | governance |
| `runtime.orchestration.completed` | runtime | runtime | internal | runtime |
| `runtime.orchestration.failed` | runtime | runtime | internal | runtime |

**Extension :** amendement catalogue uniquement (pas de types libres en production).

---

## 4. Bus core

| Fichier | Rôle |
|---------|------|
| `event-bus.ts` | `publishErpEvent`, `publishOfficialErpEvent` |
| `event-registry.ts` | `registerErpEventHandler`, patterns `approval.*` |
| `event-dispatcher.ts` | Dispatch + filtre subscribe |
| `event-security.ts` | Publish/subscribe guards (acteur, dept, sensitivity) |
| `event-traceability.ts` | Ring buffer 500 + `governance_audit_events` |
| `integrations/approval-events.ts` | Publishers approval |
| `integrations/crm-events.ts` | Publishers CRM / orchestration |
| `governance/standard/event-bus-reference.ts` | Cartographie slots B2.4 |

**Non livré (volontaire) :** Kafka, WebSocket, messaging distribué, second bus.

---

## 5. Sécurité événementielle

**Alignement :** M2 (`actorUserId`) + B2.4 (`departmentKey`) + B3.1 (scope mutation).

| Règle | Implémentation |
|-------|----------------|
| Publish sans acteur | Interdit si `sensitivity !== public` |
| Publish restricted cross-dept | Interdit si dept acteur ≠ dept événement |
| Subscribe | `assertCanSubscribe` — sensitivity + `departmentScope` |
| Supervision | Traces + audit `category: event` (SA via RLS audit existant) |

**Limite connue :** `role_key` non injecté dans le contexte publish/subscribe — à renforcer B3.2.1 (permissions profile).

---

## 6. Intégration approval + mutation

### Chaîne cible (quote convert)

```
mutation.blocked.pending  →  approval.request.created
        ↓ (SA approve)
approval.request.approved  →  approval.gate.granted
        ↓ (retry mutation)
crm.quote.converted  +  runtime.orchestration.completed
```

### Points de câblage

| Emplacement | Événements |
|-------------|------------|
| `lib/erp-core/approval/mutation-gate.ts` | `approval.request.created`, `approval.gate.granted`, `mutation.blocked.pending` |
| `app/(app)/admin/approvals/actions.ts` | `approval.request.approved`, `approval.request.rejected` |
| `modules/crm/.../quote-sale-conversion.ts` | `crm.quote.converted` (+ runtime completed via publisher) |

**Non fait :** `emitCrmQuoteConvertRequested` avant gate (optionnel B3.2.1).

---

## 7. Traçabilité et audit

| Couche | Contenu |
|--------|---------|
| Ring buffer | `getRecentEventTraces()` — phases published / dispatched / handler_* |
| Persistance | `persistEventBusAudit` → `governance_audit_events` (`category: event`, `action_type: erp_event_published`) |
| Correlation | `correlationId` / `causationId` sur enveloppe |

**Forensic :** suffisant pour fondation ; pas de table `erp_events` dédiée.

---

## 8. Future readiness (notifications / automation)

| Capacité | Statut |
|----------|--------|
| Handler registration | **Prêt** — `registerErpEventHandler({ pattern, consumerKey, handler })` |
| Notification candidates | **Type réservé** — pas d’émission B3.2 |
| Cockpit refresh | **Non branché** — consommateur futur sur `crm.*` / `runtime.*` |
| Automation rules | **Non branché** — moteur externe à B3.2 |
| Idempotence consumers | **Non défini** — dette B3.3 |
| Dead letter / retry | **Non** — handler_error trace seulement |

**Verdict readiness :** **Oui pour branchement** — **Non pour production notification/automation.**

---

## 9. Matrice des risques

| ID | Risque | Impact | Probabilité | Mitigation |
|----|--------|--------|-------------|------------|
| R1 | Bus in-process perdu au restart | Moyen | Certain | Accepté fondation ; persistance future optionnelle |
| R2 | Double alerting (alert + event) | Faible | Élevée | Unifier consommateurs B4+ |
| R3 | CRM mutations sans bus | Élevé | Élevée | Migration publisher par action |
| R4 | `role_key` absent publish | Moyen | Moyenne | Enrichir `ErpEventPublishContext` |
| R5 | Types hors catalogue en dev | Moyen | Faible | `publishOfficialErpEvent` obligatoire prod |
| R6 | Handler_error silencieux métier | Élevé | Moyenne | Monitoring + DLQ B3.3 |
| R7 | Finance restricted sans emit | Faible | N/A | Attendu tant que writes disabled |
| R8 | Legacy `lib/approvals` parallèle | Moyen | Faible | Dépréciation documentée |

---

## 10. Dette restante

1. Publishers pour toutes mutations CRM (`crm-mutations.ts`).
2. `integrations/finance-events.ts` + emit sur écritures Finance actives.
3. `emitCrmQuoteConvertRequested` au début du parcours convert.
4. Enrichissement sécurité `role_key` (M2 profile dans publish/subscribe).
5. Table ou export persistant événements (si conformité légale exige).
6. Déprécier / wrapper `lib/approvals/approval-engine.ts` vers bus.
7. Consommateur notification (phase ultérieure — **interdit B3.2**).

---

## 11. Legacy restant

- `tryCreateAlert` direct (mutation-gate, approvals, HR, etc.)
- `recordCrmGovernanceAudit` sans événement (sauf convert)
- `lib/governance/approvals/workflow.ts` audit parallèle
- `revalidatePath` ad hoc (technique Next — hors domaine événementiel)
- Aucun handler métier enregistré par défaut (bus vide côté consumers)

---

## 12. Incohérences connues

| # | Incohérence | Sévérité |
|---|-------------|----------|
| I1 | Alert + Event pour même fait approval | Faible |
| I2 | Audit CRM + Event bus sur convert seulement | Moyenne |
| I3 | Catégorie audit `event` ajoutée TS/DB types — filtre UI mis à jour | Résolu B3.2 |
| I4 | `finance.transaction.recorded` déclaré jamais émis | Attendu |
| I5 | Managers policy B3.1 vs RLS SA-only approve | Hors B3.2 (B3.1) |

---

## 13. Problèmes ouverts

1. Stratégie migration complète CRM → bus (par action ou par module).
2. Politique : alerts deviennent-elles des handlers `notification_candidate` ?
3. Exposition traces bus à UI admin (cockpit événements).
4. Correlation standard entre `approval_requests.id` et `governance_audit_events`.
5. Tests e2e publish → handler (actuellement unit in-process).

---

## 14. Tests

**Fichier :** `tests/unit/b3-2-event-bus.test.ts` (5 tests)

- Version + taxonomie + pattern invalide
- Publish + subscribe + trace `published`
- Wiring statique mutation-gate, admin approvals, quote conversion

**Commande :** `npx vitest run tests/unit/b3-2-event-bus.test.ts`

---

## 15. Verdict final

| Critère | Statut |
|---------|--------|
| Cohérent (un bus, un catalogue) | **Oui** |
| Sécurisé (fondation) | **Partiel** — role_key à compléter |
| Traçable | **Oui** — ring + audit event |
| Scalable (ERP monolith in-process) | **Oui** — limites process documentées |
| Non couplé modules | **En progrès** — publishers d’intégration, legacy audit/alert reste |
| Réutilisable | **Oui** |
| Production globale | **Non** — fondation validée, consommateurs métier absents |

### Verdict

# ERP EVENT BUS — **FONDATION VALIDÉE (B3.2)**

Prêt pour : branchement notifications, automation, audit runtime avancé, sync modules — **via bus uniquement**.

Non prêt pour : remplacement complet alerts/audit legacy, production notification/automation sans phase dédiée.

---

*Rapport généré — Phase B3.2 strict event foundation mode.*
