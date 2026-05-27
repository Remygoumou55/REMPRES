# 04 — Realtime Audit

## Implémentations actives

- `hooks/useRealtimeNotifications.ts` — notifications + compteurs SA
- `hooks/useRealtimeList.ts` — listes live (vente, ops)
- `hooks/usePresence.ts` — présence utilisateurs
- `components/governance/approvals/ApprovalsRealtimeBridge.tsx`
- Publications SQL: `077`, `081`, `083`

## Risques identifiés

- Duplicate subscriptions si composants montés plusieurs fois (vérifier cleanup — présent via `removeChannel`)
- Flooding: refetch complet sur tables larges (mitigé debounce)
- Desync UI: optimistic updates ops — OK si rollback local

## Realtime Governance Layer (lot 1)

- `lib/governance/runtime/debounce.ts` — utilitaire partagé

## Recommandations lot 2

- Throttle global par channel key
- Filtrer events par `department_key` / `user_id` quand possible
- Métriques: connexions actives, events/min
