# FINANCE_AUDIT_REPORT

**Verdict :** ACTIVE

## Chain

`recordFinanceGovernanceAudit` → table `governance_audit_events`

## Covered writes

- Expense create/update
- Journal submit / post / reject
- Report generate (`REPORT_GENERATE`)

## Traceability

- `actorUserId` via session
- `beforeSnapshot` / `afterSnapshot` on mutations
- Approval history via `approval_requests` + SQL trigger 048
