# CRM + SALES OPERATIONALIZATION — Bloc 3 Étape 3

**Date :** 22 mai 2026  
**Verdict :** `ACTIVE`

**Super Admin :** zone gelée — inchangé.

---

## 1. Contexte

Post-Finance ACTIVE. Mission : domaine CRM + Sales opérationnel — lifecycle leads, pipeline/deals, gouvernance client, activités, analytics, bus événements.

---

## 2. Leads

| Capability | Implémentation |
|------------|----------------|
| Create | `createCrmLead` + `crm.lead.created` |
| Status | `updateCrmLeadStatus` + `crm.lead.updated` |
| Convert | `convertCrmLeadToClient` + `crm.lead.converted` |
| Ownership | `owner_id` = acteur à la création |

→ [`docs/crm-audit/CRM_LEAD_REPORT.md`](crm-audit/CRM_LEAD_REPORT.md)

---

## 3. Pipeline

Stages via `crm_pipeline_stages` ; deals = `crm_opportunities`.

| Event | Trigger |
|-------|---------|
| `crm.deal.created` | création opportunité |
| `crm.pipeline.updated` | changement étape |
| `crm.deal.won` / `crm.deal.lost` | étapes terminales |

→ [`docs/crm-audit/CRM_PIPELINE_REPORT.md`](crm-audit/CRM_PIPELINE_REPORT.md)

---

## 4. Governance

`lib/vente/governance/crm-domain-governance.ts` — ownership, write registry 10 actions actives, convert devis = approbation.

→ [`docs/crm-audit/CRM_GOVERNANCE_REPORT.md`](crm-audit/CRM_GOVERNANCE_REPORT.md)

---

## 5. Activities

UI : `/vente/crm/activities` — création + clôture.  
Events : `crm.activity.created`, `crm.activity.completed`.

→ [`docs/crm-audit/CRM_ACTIVITY_REPORT.md`](crm-audit/CRM_ACTIVITY_REPORT.md)

---

## 6. Analytics

`buildCrmOperationalAnalytics` — conversion, pipeline, win rate, CA ventes liées CRM.  
Forecast : `refreshCrmForecastSnapshot` → `crm_forecast_snapshots`.

→ [`docs/crm-audit/CRM_ANALYTICS_REPORT.md`](crm-audit/CRM_ANALYTICS_REPORT.md)

---

## 7. Events

Catalogue `erp-event-catalog-bloc3-crm-v1` — **47 types**, **14 CRM** (13+ actifs).

→ [`docs/crm-audit/CRM_EVENT_REPORT.md`](crm-audit/CRM_EVENT_REPORT.md)

---

## 8. Cockpit

| Surface | Route |
|---------|-------|
| Hub CRM | `/vente/crm` |
| Dept vente | `/dept/vente` |
| Visual | `/vente/crm/visual` |

KPIs live via `getCrmOperationalOverview` — pas de hardcode.

→ [`docs/crm-audit/CRM_OPERATIONS_REPORT.md`](crm-audit/CRM_OPERATIONS_REPORT.md)

---

## 9. Performance

- Analytics : `Promise.all` agrégations parallèles
- Overview : counts head + vue pondérée
- Events async parallèles aux audits

→ [`docs/crm-audit/CRM_PERFORMANCE_REPORT.md`](crm-audit/CRM_PERFORMANCE_REPORT.md)

---

## 10. Matrix

`tests/unit/crm-domain-maturity-matrix.test.ts` — **11 PASS**

→ [`docs/crm-audit/CRM_MATRIX_REPORT.md`](crm-audit/CRM_MATRIX_REPORT.md)

---

## 11. Dette restante

| ID | Item |
|----|------|
| C1 | Transfert ownership / territoire (UI dédiée) |
| C2 | Clients/orders CRM = ponts vers vente |
| C3 | Job cron snapshots (refresh manuel opérationnel) |

---

## 12. Verdict

### `ACTIVE`

lint + build PASS. CRM gouverné, traçable, event-driven, analytics live.

Validation → [`docs/crm-audit/CRM_VALIDATION_REPORT.md`](crm-audit/CRM_VALIDATION_REPORT.md)
