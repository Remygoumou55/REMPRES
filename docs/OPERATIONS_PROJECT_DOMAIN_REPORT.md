# OPERATIONS + PROJECT DOMAIN — Bloc 3 Étape 5

## 1. Contexte

Mission : construire un domaine **Operations / Project** ERP-grade (pas kanban décoratif), gouverné, event-driven, sans modification Super Admin.

État amont : POST-BLOC2, RH/Finance/CRM/Supply actifs. Operations était absent (pas de tables `erp_ops_*`, pas d’événements `ops.*`).

## 2. Tasks (moteur de tâches)

- Tables : `erp_ops_tasks`, `erp_ops_task_history`
- Mutations : `createOpsTask`, `assignOpsTask`, `updateOpsTaskStatus`, `completeOpsTask`
- Ownership : `owner_user_id`, exécution `assignee_user_id`, clôture `completed_by`
- Événements : `ops.task.created`, `ops.task.assigned`, `ops.task.completed`
- UI : `/operations/tasks` + `OpsTaskCreateForm`, `OpsTaskRowActions`

## 3. Workflows

- Tables : `erp_ops_workflows`, `erp_ops_workflow_steps` (intake → execution → review → closure)
- Statuts : pending, active, review, approved, closed
- Mutations : `startOpsWorkflow`, `transitionOpsWorkflow`
- Événements : `ops.workflow.started`, `ops.workflow.approved`
- UI : `/operations/workflows` + transitions pilotables

## 4. Projects (gouvernance)

- Table : `erp_ops_projects` (owner, team JSON, budget_reference, statut)
- Mutations : `createOpsProject`, `updateOpsProjectStatus`
- Événement : `ops.project.created`
- UI : `/operations/projects`

## 5. Delivery (exécution)

- Table : `erp_ops_deliveries` (progression %, issue, delay)
- Mutations : `createOpsDelivery`, `updateOpsDeliveryProgress`, `completeOpsDelivery`, `reportOpsDeliveryDelay`
- Événements : `ops.delivery.completed`, `ops.execution.delayed`
- UI : `/operations/delivery`

## 6. Orchestration cross-domain

Handler `ops-orchestration-bridge` :

| Source | Action Operations |
|--------|-------------------|
| `crm.deal.won` | Tâche de suivi deal (idempotent par opportunité) |
| `supply.inventory.received` | Projet + workflow + jalon livraison |
| `approval.request.approved` | Avance workflow lié (`approval_request_id`) |

## 7. Events (bus)

- Catalogue : `erp-event-catalog-bloc3-ops-v1` — **64 types** (+9 `ops.*`)
- Publishers : `lib/erp-core/events/integrations/ops-events.ts`
- Bridge notifications : `notification-ops-bridge`
- Bootstrap : `erp-event-handlers-bootstrap-bloc3-ops-v1`

## 8. Cockpit

- Hub : `/operations`
- Cockpit KPI : `/operations/dashboard`
- Dept consultation : `buildDeptConsultationKpiPayload` — **placeholder: false**
- Reporting : `/operations/reporting` + `ops.report.generated`

## 9. Performance

- Overview / analytics : requêtes `count` head + limit listes (80/60)
- KPI dept : `Promise.all` overview + analytics
- Pas de chargement SA / sidebar modifié

## 10. Matrix (résumé)

| AREA | EXPECTED | RESULT |
|------|----------|--------|
| Tasks | CRUD gouverné + history | PASS |
| Workflows | Transitions + steps | PASS |
| Projects | Owner + budget ref | PASS |
| Delivery | Progress + delay | PASS |
| Orchestration | 3 triggers | PASS |
| Events | 9 ops.* wired | PASS |
| Cockpit | KPI live | PASS |
| Super Admin | Inchangé | PASS |

## 11. Dette restante

- Lien explicite workflow ↔ `approval_requests` à la création (aujourd’hui avance si `approval_request_id` déjà renseigné)
- Entrée menu sidebar volontairement absente (SA gelé ; accès URL `/operations`)
- Migration SQL `064` à appliquer sur l’instance Supabase cible

## 12. Verdict

**ACTIVE**

Le domaine Operations est opérationnel : schéma, RLS module `operations`, mutations gouvernées, bus `ops.*`, orchestration CRM/Supply/Approval, cockpit et tests matrice. Prérequis runtime : permissions `operations` + migration `064_ops_project_domain_enterprise.sql` appliquée.
