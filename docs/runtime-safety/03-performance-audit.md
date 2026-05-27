# 03 — Performance Audit

## Points chauds

| Zone | Observation | Priorité |
|------|-------------|----------|
| Realtime super admin | Refetch count sur chaque event `*` | Moyenne — debounce 800ms ajouté |
| Listes ERP | Multiples pages `force-dynamic` | Acceptable gouvernance |
| Exports RH/Finance | Jusqu'à 1000 lignes en mémoire | Moyenne |
| `dispatchOutgoingWebhook` | N appels fetch parallèles | Basse (async) |

## Optimisations appliquées (lot 1)

- Debounce refetch notifications realtime (`hooks/useRealtimeNotifications.ts`)

## Optimisations recommandées (lot 2)

- Pagination stricte sur historiques volumineux
- Index SQL review sur `approval_requests.status`, `webhook_deliveries.delivered_at`
- Réduire subscriptions `event: *` → `INSERT`/`UPDATE` ciblés
- Streaming exports CSV

## Objectif

ERP fluide sous charge: latence P95 actions < 500ms, pas de rerender storm realtime.
