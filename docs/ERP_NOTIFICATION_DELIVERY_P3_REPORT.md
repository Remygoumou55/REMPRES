# REMPRES ERP — Phase P3
# Notification delivery in_app + retrait alerts approval

**Version :** `erp-notification-delivery-p3-v1`  
**Date :** 2026-05-22  

---

## Synthèse

| Question | Verdict |
|----------|---------|
| Delivery in_app via bus ? | **Oui** — `governance_alerts` |
| Alerts approval directs retirés ? | **Oui** — mutation-gate + admin/approvals |
| HR / workflow legacy alerts ? | **Conservés** — hors P3 |
| Désactivation possible ? | **Oui** — `ERP_NOTIFICATION_IN_APP_DELIVERY=false` |

---

## Flux P3

```
Event publish → bridge handler
  → recordNotificationBridgeProjection (trace)
  → deliverInAppNotification
      → tryEmitGovernanceAlert → governance_alerts (in_app UI)
```

## Retraits `tryCreateAlert` (progressif)

| Fichier | Avant | Après |
|---------|-------|-------|
| `mutation-gate.ts` | alert direct | **bus only** (`approval.request.created`) |
| `admin/approvals/actions.ts` | approve/reject alerts | **bus only** |
| `workflow.ts` | alert | **inchangé** (legacy) |
| HR contracts/recruitment | alert | **inchangé** |

## Fichiers P3

- `delivery/in-app-notification-service.ts`
- `delivery/notification-delivery-config.ts`
- `handlers/notification-bridge-dispatch.ts`

## Prochaine étape

P3.1 — retirer alerts HR quand events RH sur bus ; ou UI centre notifications enrichi.

---
