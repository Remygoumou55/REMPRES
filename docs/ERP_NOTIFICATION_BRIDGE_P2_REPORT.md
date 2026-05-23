# REMPRES ERP — Phase P2
# Notification Bridge CRM (read-only) — Rapport

**Version :** `notification-bridge-p2.1-v1`  
**Date :** 2026-05-22  
**Mode :** bridge CRM + approval — **P3 delivery in_app actif** (trace + `governance_alerts`)

---

## Synthèse

| Question | Verdict |
|----------|---------|
| Handler `crm.*` enregistré ? | **Oui** — P2 |
| Handler `approval.*` enregistré ? | **Oui** — P2.1 |
| Delivery notifications ? | **Oui** — P3 via `governance_alerts` |
| Legacy `tryCreateAlert` approval ? | **Retiré** (mutation-gate, admin/approvals) |
| Legacy HR / workflow ? | **Conservé** |
| Bootstrap auto au publish ? | **Oui** (crm + approval) |
| P2 / P2.1 / P3 validés ? | **Oui** |

---

## Architecture

```
publishErpEvent
  → ensureErpEventHandlersBootstrapped()
  → dispatchErpEvent
      → notification-crm-bridge (crm.*, scope VENTE)
      → notification-approval-bridge (approval.*, scope global)
          → map*ToNotificationCandidate
          → recordNotificationBridgeProjection
          → appendNotificationBridgeLog (ring 200)
```

## Fichiers

| Fichier | Rôle |
|---------|------|
| `handlers/notification-crm-bridge.ts` | Mapper + handler CRM |
| `handlers/notification-approval-bridge.ts` | Mapper + handler approval (P2.1) |
| `handlers/notification-bridge-log.ts` | Ring buffer + `recordNotificationBridgeProjection` |
| `bootstrap/register-default-handlers.ts` | Bootstrap idempotent p2.1 |

## Événements mappés

### CRM (`crm.*`)

- `crm.lead.created`, `crm.quote.created`, `crm.quote.status_updated`
- `crm.quote.convert_requested`, `crm.quote.converted`

### Approval (`approval.*`)

- `approval.request.created` → scope `super_admin`, priority high
- `approval.request.approved` → scope `actor`
- `approval.request.rejected` → scope `actor`
- `approval.gate.granted` → scope `actor`

**Hors scope P2.1 :** `mutation.blocked.pending` (prefix `mutation.*`) — bridge dédié futur si besoin.

## Prochaine étape

**P3** — delivery in_app via `ErpNotificationService` + retrait progressif `tryCreateAlert`.

---

*Foundation First — observer avant de livrer.*
