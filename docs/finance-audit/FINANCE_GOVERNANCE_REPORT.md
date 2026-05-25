# FINANCE_GOVERNANCE_REPORT

**Verdict :** ACTIVE

## Write registry

`lib/finance/runtime/finance-write-governance.ts`

| Action | Enabled | Approval |
|--------|---------|----------|
| EXPENSE_CREATE | yes | no |
| EXPENSE_UPDATE | yes | no |
| JOURNAL_SUBMIT_APPROVAL | yes | yes |
| JOURNAL_POST | yes | no |
| REPORT_GENERATE | yes | no |

## Authority

`assertFinanceWriteActionAllowed` — RBAC finance + dept scope.

## Domain governance

`lib/finance/governance/finance-domain-governance.ts`
