# FINANCE_TRANSACTION_REPORT

**Verdict :** ACTIVE

## Modules

| Module | Fichier |
|--------|---------|
| Expense | `finance-expense-mutations.ts` → `financial_transactions` |
| Transaction bus | `finance-transaction-mutations.ts` |
| Journal | `finance-journal-mutations.ts` → RPC `post_finance_journal_batch` |

## Events

- `finance.transaction.recorded`
- `finance.transaction.updated`
- `finance.payment.recorded`

## Status / history

- Dépenses : statut gouverné + historique via `governance_audit_events`
- Journal : lots `draft` → `submitted` → `posted` / `void`
