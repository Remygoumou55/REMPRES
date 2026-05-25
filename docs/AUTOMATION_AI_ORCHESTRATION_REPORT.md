# AUTOMATION + AI ORCHESTRATION — Bloc 3 Étape 7

## 1 — Contexte

Mission : maturer le moteur automation P6 existant vers **ERP_AUTOMATION_ACTIVE**, sans chatbot cosmétique ni modification Super Admin.

Prérequis : POST-EXECUTIVE_HUB, catalogue executive **73 types**, moteur P6 (`automation-rule-engine`, `051_automation_engine.sql`).

## 2 — Automation engine

| Module | Statut | Détail |
|--------|--------|--------|
| Workflow | ACTIVE | `erp_automation_workflow_definitions` + runs + schedules |
| Rule | ACTIVE | `ERP_AUTOMATION_RULES` — **11 règles actives** (5 P6/P7 + 6 Bloc 3) |
| Action | ACTIVE | `automation-action-handlers.ts` — handlers read-safe |
| Execution | ACTIVE | `automation-rule-engine.ts` v bloc3 — emit bus + cooldown |
| History | ACTIVE | Ring buffer + `erp_automation_rule_executions` (066) |

## 3 — Rule engine + gouvernance

- Version : `erp-automation-governance-bloc3-v1`
- Cartographie : `AUTOMATION_GOVERNANCE_MAP` (priorité, cooldown, runtimeScope)
- Règles bloquées/planned conservées (journal auto-post, notify sales)
- UI : `/admin/automation/governance`

## 4 — Triggers + event orchestration

Sources actives : RH, Finance, CRM, Supply, Operations, Executive, Observability.

| Trigger | Règle | Action |
|---------|-------|--------|
| `crm.deal.won` | cross_domain | trace chaîne CRM→Finance→Ops→Executive |
| `supply.purchase.requested` | triage | workflow `bloc3.supply_purchase_chain` |
| `executive.kpi.threshold_exceeded` | alert | candidat alerting |
| `executive.signal.raised` | triage | + AI decision support |
| `ops.task.created` | triage | refresh board ops |
| `observability.health.degraded` | escalation | chaîne observability→executive |

Bridge : `automation-orchestration-bridge.ts` → `automation.cross_domain.orchestrated`.

## 5 — AI orchestration

**Pas de chatbot.** Pipeline structuré :

- `ai-decision-support-orchestration.ts` — recommandations `erp_ai_recommendations` avec confiance + `source_refs`
- `ai-orchestration-bridge.ts` — écoute seuils finance, signaux executive, santé obs, échecs règles
- Événements : `automation.ai.recommendation.generated`, `automation.ai.decision_support.emitted`

## 6 — Observability

- `erp_automation_rule_executions` — historique SQL
- Ring buffer 200 entrées (runtime)
- Métriques cockpit : succès / échecs / taux 24h
- Bus append-only : `erp_automation_events`

## 7 — Cockpit

Routes **nouvelles** (zone non-SA) :

- `/admin/automation` — hub KPI + traces
- `/admin/automation/workflows`
- `/admin/automation/runs`
- `/admin/automation/schedules`
- `/admin/automation/events`
- `/admin/automation/analytics`
- `/admin/automation/governance`

## 8 — Performance

- Handlers read-safe (`write_forbidden: true` metadata)
- Émission bus `awaitDispatch: false` (integration publish)
- Persistance rule executions best-effort (non bloquante)
- Pas de règles sur événements `automation.*` (anti-boucle)

## 9 — Matrix validation

| AREA | EXPECTED | RESULT |
|------|----------|--------|
| Workflow engine | SQL + tick | PASS |
| Rules | 11 active | PASS |
| Triggers | cross-domain bridge | PASS |
| AI | recommendations + confidence | PASS |
| Observability | rule_executions + metrics | PASS |
| Cockpit | /admin/automation | PASS |
| Events | 82 catalog | PASS |
| Super Admin | unchanged | PASS |

## 10 — Dette restante

- `automation.workflow.started/completed` : catalog actif, émission workflow tick à renforcer
- `erp_automation_rule_executions` : nécessite migration `066` en base distante
- Recommandations AI : revue humaine obligatoire (status `pending`)
- Pas de mutation auto cross-domain (by design gouvernance)

## 11 — Verdict

**AUTOMATION_DOMAIN_ACTIVE**

Catalogue : `erp-event-catalog-bloc3-automation-v1` — **82 types**.

Migration : `066_automation_ai_domain_enterprise.sql`.

Super Admin : **non modifié**.
