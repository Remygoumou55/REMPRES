# 02 — Mutation Safety Report

## Unified Mutation Governance Layer

Nouveau module: `lib/governance/runtime/mutation-guard.ts`

| Fonction | Usage |
|----------|-------|
| `requireAuthenticatedSession()` | lecture authentifiée |
| `requireAdminConsoleMutation()` | platform APIs/connectors/webhooks |
| `requireAutomationMutation()` | automation rules |
| `guardErrorMessage()` | réponses action normalisées |

## Actions corrigées (lot 1)

- `app/(app)/admin/platform/apis/actions.ts`
- `app/(app)/admin/platform/connectors/actions.ts`
- `app/(app)/admin/platform/webhooks/actions.ts`
- `app/(app)/admin/automation/rules/actions.ts`

## Pattern départemental existant (à généraliser)

- `lib/logistics/runtime/logistics-runtime-security.ts`
- `lib/operations/runtime/operations-runtime-security.ts`
- `lib/server/*-access.ts` (assert*Write)

## Checklist mutation enterprise

- [x] Auth session obligatoire sur mutations admin platform/automation
- [ ] Validation Zod systématique sur toutes actions
- [ ] Audit log (`tryLogAuditEvent`) sur mutations critiques restantes
- [ ] Idempotency keys sur webhooks/automation sortants

## Interdictions respectées

Pas de bypass middleware, pas de mutation silencieuse sur approbations (lot 1).
