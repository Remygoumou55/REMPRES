# FINANCE_REPORTING_REPORT

**Verdict :** ACTIVE

## Service

`buildFinanceOperationalReport` — données live :

- P&L (revenue, profit, margin)
- Dépenses par catégorie
- Cashflow série
- Balance summary (trial balance)

## UI

`/finance/enterprise/reporting` — SSR, pas de mock.

## Event

`finance.report.generated` on `generateFinanceOperationalReport`.
