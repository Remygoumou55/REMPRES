# RemPres ERP — Runtime Safety Program

Programme de stabilisation enterprise (12 phases).  
Périmètre audité: codebase `rempres-erp`, historique Git récent, transcript Cursor principal.

## Livrables (10 rapports)

1. [01-runtime-audit-report.md](./01-runtime-audit-report.md)
2. [02-mutation-safety-report.md](./02-mutation-safety-report.md)
3. [03-performance-audit.md](./03-performance-audit.md)
4. [04-realtime-audit.md](./04-realtime-audit.md)
5. [05-approval-governance-report.md](./05-approval-governance-report.md)
6. [06-inventory-safety-report.md](./06-inventory-safety-report.md)
7. [07-error-governance-report.md](./07-error-governance-report.md)
8. [08-cleanup-report.md](./08-cleanup-report.md)
9. [09-deduplication-report.md](./09-deduplication-report.md)
10. [10-architecture-validation-report.md](./10-architecture-validation-report.md)

## Correctifs runtime appliqués (lot 1)

| Domaine | Changement |
|---------|------------|
| Mutation governance | `lib/governance/runtime/mutation-guard.ts` |
| Platform/Automation actions | garde `requireAdminConsoleMutation` / `requireAutomationMutation` |
| Stock réception PO | suppression double update quantity (trigger DB seul) |
| Webhooks incoming | service role pour lookup + log delivery |
| Compteurs | RPC atomiques `092_runtime_safety.sql` |
| Approvals | exécution avant statut `approved`, reject gated `pending` |
| Realtime | debounce refetch notifications (800ms) |

## SQL à exécuter

1. `supabase/sql/092_runtime_safety.sql` (Supabase SQL Editor)

## Statut global

- **Stabilisation en cours** — fondations posées, phases 8–12 (cleanup massif, tests charge) restent planifiées.
- **Super Admin frozen** — aucune modification `ErpNavSidebar`, `SuperAdminCockpitClient`, `app/dashboard/page.tsx`.
