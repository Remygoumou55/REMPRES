# FINANCE_MATRIX_REPORT

| AREA | EXPECTED | ACTUAL | RESULT |
|------|----------|--------|--------|
| Transactions | FT + journal mutations | services present | PASS |
| Governance | write registry enabled | JOURNAL_POST active | PASS |
| Approval | journal submit + SQL 048 | trigger + actions | PASS |
| Audit | governance_audit_events | recordFinanceGovernanceAudit | PASS |
| Reporting | live buildFinanceOperationalReport | enterprise/reporting | PASS |
| Events | 11 finance / 10 active | catalog bloc3-finance-v1 | PASS |
| Cockpit | dept + CFO live | placeholder false | PASS |
| Performance | parallel fetch | Promise.all reporting | PASS |

**Test file :** `tests/unit/finance-domain-maturity-matrix.test.ts` — 13 PASS
