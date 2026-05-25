# FINANCE_EVENT_REPORT

**Verdict :** ACTIVE

## Catalogue

Version : `erp-event-catalog-bloc3-finance-v1`  
**11 types finance**, **10 actifs**.

## Bloc 3 additions

- `finance.transaction.updated`
- `finance.approval.requested` / `approved` / `rejected`
- `finance.report.generated`

## Integrations

`lib/erp-core/events/integrations/finance-events.ts`  
Bridge : `notification-finance-bridge.ts`

## catalog_only

- `finance.transaction.failed` (émission code, pas notification active)
