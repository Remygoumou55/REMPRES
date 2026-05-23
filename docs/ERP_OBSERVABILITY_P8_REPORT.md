# ERP Bus Observability — Rapport P8

**Version :** `erp-observability-p8-v1`  
**Position ERP :** POST-P7.3 → Multi-domain Governed ERP  
**Verdict foundation :** **READY**  
**Verdict activation UI/API :** **READY** (read-only, gouverné)  
**Rebuild bus :** **INTERDIT — non effectué**

---

## 1. Contexte ERP

REMPRES ERP est un ERP multi-départements enterprise-grade, **post-prototype**, avec architecture stabilisée :

| Couche | Référence |
|--------|-----------|
| ERP Core | M1 → M3.75 |
| Vente / CRM | B1 → P1 |
| Finance | B3 → P6.1 |
| Approval | B3.1 |
| Event Bus | B3.2 |
| Notifications | P2 → P5 |
| Automation | P6 → P6.1 |
| RH | P7 → P7.3 |

**P8** n’ajoute **aucun domaine métier**. Il ajoute **visibilité, traçabilité et pilotage** sur l’activité bus déjà existante : events, handlers, notifications, automation.

Principe directeur : **Observe First** — pas de rebuild Kafka/RabbitMQ, pas de websocket platform, pas de monitoring infra parallèle.

---

## 2. Rappel — déjà fait (ne pas refaire)

Infrastructure existante réutilisée intégralement :

- `publishErpEvent` — bus in-process unique
- `event-registry` + bootstrap handlers (CRM, approval, finance, HR, automation)
- Catalogue officiel `erp-event-catalog-p7-3-v1` — **25 types** officiels
- `appendEventTrace` — ring buffer lifecycle (500 entrées)
- `notification-bridge-log` — projections P2–P7.2 (ring 200)
- `automation-trace-log` — traces P6/P7.3 (ring 200)
- Governance audit optionnel à la publication
- Modules métier : Finance runtime, CRM events, RH events (5 actifs catalogue P7.3)

**Interdictions respectées P8 :** pas de nouveau bus, pas de queue externe, pas de refonte notification/automation stack.

---

## 3. Audit observabilité (Phase 1)

Livrable machine-readable : `lib/erp-core/observability/foundation/erp-observability-audit.ts`  
Version : `erp-observability-audit-p8-v1`

### 3.1 Visibilité existante (avant unification P8)

| ID | Zone | Finding | Location |
|----|------|---------|----------|
| O1 | event_bus | Traces publish/dispatch/handler via `appendEventTrace` | `event-traceability.ts` |
| O2 | handlers | Registre handlers listable après bootstrap | `event-registry.ts` |
| O3 | notifications | Ring buffer projections bridge | `notification-bridge-log.ts` |
| O4 | automation | Ring buffer traces engine | `automation-trace-log.ts` |

### 3.2 Gaps comblés par P8

| ID | Gap | Action P8 |
|----|-----|-----------|
| O5 | Pas de vue ERP bus unifiée | `app/(app)/erp/observability/` |
| O6 | Pas d’API GET observability | `api/erp/observability/*` |
| O7 | Traces non filtrées par rôle | `OBSERVABILITY_SECURITY_MODEL` + `filterByObservabilityScope` |

### 3.3 Dette, bruit et limites (documentées — hors scope P8)

| ID | Catégorie | Finding |
|----|-----------|---------|
| O8 | limit | Ring buffers in-memory — perdu au restart |
| O9 | debt/noise | Deux namespaces : `modules/observability` (platform) vs `lib/erp-core/observability` (ERP bus) |
| O10 | limit | Pas de corrélation graphique events ↔ notifications ↔ automation (P11+) |

**Synthèse audit :** 4 zones visibles, 3 gaps, rebuild interdit, point d’entrée unifié = `getErpObservabilitySnapshot`.

---

## 4. Modèle de gouvernance observabilité (Phase 2)

**Namespace :** `lib/erp-core/observability/`  
**Version :** `observability-domain-governance-p8-v1`  
**Fichier :** `observability-domain-governance.ts`

### 4.1 Principes

- Scope : `erp_bus_in_process`
- Broker externe : **interdit**
- Opérations write (replay, kill, republish) : **interdites**
- Rétention : ring buffers mémoire (500 / 200 / 200)

### 4.2 Catalogue capacités (`OBSERVABILITY_GOVERNANCE_MAP`)

| ID | Label | Status | Owner | Visibilité |
|----|-------|--------|-------|------------|
| bus_event_traces | Lifecycle bus | active | event-traceability | scoped_by_role |
| handler_registry | Handlers in-process | active | event-registry | super_admin + observability |
| notification_bridge_log | Projections bridge | active | notification-bridge-log | scoped_by_role |
| automation_trace_log | Traces automation | active | automation-trace-log | scoped_by_role |
| observability_snapshot | Snapshot unifié | active | observability/runtime | API + UI read-only |
| bus_replay | Replay / kill switch | planned | governance | none (P11+) |
| external_telemetry | Kafka / Grafana / APM | **blocked** | governance | none |

---

## 5. Bus trace foundation (Phase 3)

**Architecture :** `lib/erp-core/observability/bus/`  
**Version :** `bus-trace-foundation-p8-v1`

### 5.1 Pattern

```
publishErpEvent → appendEventTrace (ring) → BUS_TRACE_MAP → read facade → snapshot
```

Pas de DB. Pas de queue. Pas de télémétrie externe. **Facade** sur `event-traceability.ts` — pas de duplication.

### 5.2 BUS_TRACE_MAP (4 phases lifecycle)

| Lifecycle (P8) | Source phase | Description |
|----------------|--------------|-------------|
| `event_published` | `published` | Post `assertCanPublishEvent` |
| `handler_invoked` | `dispatched` | Avant exécution handler |
| `handler_completed` | `handler_ok` | Handler OK |
| `handler_failed` | `handler_error` | Visible section failures |

**Fichiers :**

- `bus-trace-foundation.ts` — map + `mapEventTraceToBusTraceView`
- `bus-trace-read.ts` — `readRecentBusTraces`, `readBusTraceFailures`

---

## 6. Observability runtime (Phase 4)

**Architecture :** `lib/erp-core/observability/runtime/`  
**Version :** `observability-runtime-p8-v1`

### 6.1 Source of Truth

`getErpObservabilitySnapshot(scope, options?)` agrège :

1. Traces bus (via bus-trace-read)
2. Registre handlers (post `ensureErpEventHandlersBootstrapped`)
3. Logs notification bridge
4. Traces automation
5. Échecs handlers (filtrés)

### 6.2 Payload (`ErpObservabilitySnapshot`)

- `version`, `generatedAt`, `visibility` (roleClass, mode, allowedPrefixes)
- `bus` — busVersion, traceFoundation, catalogVersion, officialEventCount
- `handlers` — bootstrapVersion, count, registrations[]
- `recentEvents`, `recentNotifications`, `recentAutomation`, `failures`
- `summary` — compteurs

### 6.3 Sécurité runtime

- **Read-only** — aucun write, aucun control plane
- Filtrage par `ObservabilityVisibilityScope` via `filterByObservabilityScope`
- Ownership : module `lib/erp-core/observability/runtime`

---

## 7. Bus UI design (Phase 5)

**Route :** `/erp/observability`  
**Fichiers :** `app/(app)/erp/observability/page.tsx`, `ErpObservabilityPanels.tsx`  
**Design map :** `foundation/erp-bus-ui-design-map.ts`

### 7.1 Sections (6 — read-only)

| Section | Source données | Controls interdits |
|---------|----------------|-------------------|
| Synthèse bus | snapshot.summary | replay, kill, publish |
| Événements récents | recentEvents | replay, republish |
| Handlers actifs | handlers.registrations | register, unregister |
| Notifications | recentNotifications | direct tryCreateAlert |
| Automation | recentAutomation | auto_write, rule_edit |
| Échecs | failures | retry, skip |

**Pattern :** tables read-only — pas dashboard marketing, pas admin bus.

**Note navigation :** lien menu principal non ajouté P8 (accès direct URL ou intégration nav admin ultérieure).

---

## 8. API readiness (Phase 6)

**Map :** `foundation/observability-api-map.ts`  
**Helper :** `api/observability-request.ts` — `assertErpObservabilityReadAccess`

### 8.1 Endpoints GET uniquement

| Path | Scope réponse |
|------|---------------|
| `GET /api/erp/observability/snapshot` | `ErpObservabilitySnapshot` complet |
| `GET /api/erp/observability/events` | events + failures subset |
| `GET /api/erp/observability/handlers` | registre handlers |
| `GET /api/erp/observability/notifications` | bridge log |
| `GET /api/erp/observability/automation` | automation traces |

### 8.2 Règles API

- POST / DELETE / admin controls / replay : **interdits**
- Rate : session standard, `Cache-Control: no-store` sur snapshot
- Security : `assertErpObservabilityReadAccess` + scope filter

---

## 9. Security & visibility model (Phase 7)

**Fichiers :**

- `security/observability-security-model.ts` — pur (tests safe)
- `security/observability-security.ts` — async + permissions session

### 9.1 Matrice rôles (`OBSERVABILITY_SECURITY_MODEL`)

| Role | Préfixes events | Classification | API |
|------|-----------------|----------------|-----|
| super_admin | `*` | cross_domain | ✓ |
| platform_observability | `*` | cross_domain | ✓ |
| admin_console | `*` | cross_domain | ✓ |
| finance | `finance.*`, `approval.*` | restricted | ✓ |
| hr | `hr.*`, `approval.*` | restricted | ✓ |
| vente | `crm.*`, `approval.*` | restricted | ✓ |
| viewer | `approval.*` | public | ✗ |

Pas d’accès global pour rôles départementaux. Finance ne voit pas `hr.*`. RH ne voit pas `finance.*`.

---

## 10. Coexistence strategy (Phase 8)

**Fichier :** `foundation/observability-coexistence.ts`  
**Règle :** `coexistence_first`

| Source | Status P8 | Traitement |
|--------|-----------|------------|
| event-traceability ring | unified_read | SoT bus — pas duplication |
| notification-bridge-log | unified_read | Section snapshot |
| automation-trace-log | unified_read | Section snapshot |
| modules/observability | platform_separate | `/admin/observability` inchangé |
| governance_audit_events DB | legacy_parallel | Audit persist publish — hors ring |
| lib/monitoring/* | platform_separate | Perf API — hors ERP bus UI |

**Point d’entrée unifié :** `getErpObservabilitySnapshot`  
**Interdit :** second bus parallèle, broker externe, websocket stream P8

**Ordre migration :** snapshot runtime → GET API → UI read-only → P11 replay optionnel

---

## 11. Readiness validation (Phase 9)

**Fichier :** `foundation/observability-readiness-validation.ts`

| Check | Label | Résultat |
|-------|-------|----------|
| P8-1 | Trace foundation — 4 phases | ✓ |
| P8-2 | Runtime snapshot défini | ✓ |
| P8-3 | UI design — 6 sections | ✓ |
| P8-4 | API — 5 GET endpoints | ✓ |
| P8-5 | Security matrix — 5+ rôles | ✓ |
| P8-6 | Coexistence — legacy préservé | ✓ |
| P8-7 | Governance — pas rebuild bus | ✓ |

### Verdict

| Dimension | Verdict |
|-----------|---------|
| **overall** | **READY** |
| foundation | READY |
| uiActivation | READY |
| apiActivation | READY |
| blockers | *(aucun)* |

---

## 12. Tests

**Fichier :** `tests/unit/p8-erp-observability.test.ts` — **7 tests**

Couverture :

- BUS_TRACE_MAP (4 phases)
- Filtrage scope finance vs hr
- Structure snapshot + handlers bootstrap
- Publication event → traces bus
- Readiness verdict READY
- API map ≥ 5 endpoints GET

Commande : `npx vitest run tests/unit/p8-erp-observability.test.ts`

---

## 13. Arborescence livrables P8

```
lib/erp-core/observability/
├── index.ts
├── observability-domain-governance.ts
├── bus/
│   ├── bus-trace-foundation.ts
│   └── bus-trace-read.ts
├── runtime/
│   └── observability-runtime.ts
├── security/
│   ├── observability-security-model.ts
│   └── observability-security.ts
├── api/
│   └── observability-request.ts
└── foundation/
    ├── erp-observability-audit.ts
    ├── observability-api-map.ts
    ├── observability-coexistence.ts
    ├── erp-bus-ui-design-map.ts
    └── observability-readiness-validation.ts

app/(app)/erp/observability/
├── page.tsx
└── ErpObservabilityPanels.tsx

app/api/erp/observability/
├── snapshot/route.ts
├── events/route.ts
├── handlers/route.ts
├── notifications/route.ts
└── automation/route.ts
```

---

## 14. Risques

| Risque | Mitigation P8 |
|--------|---------------|
| Perte traces au restart | Documenté — ring in-memory ; P11 persistence si besoin |
| Fuite cross-domain via API | Scope filter + assert access par rôle |
| Confusion platform vs ERP observability | Coexistence documentée — namespaces séparés |
| Scope creep (replay, analytics) | Capacités `planned` / `blocked` dans governance map |
| Charge mémoire rings | Limites 500/200 — pas d’accumulation illimitée |

---

## 15. Dette technique

1. **Rétention volatile** — pas de persistence DB traces P8
2. **Corrélation** — pas de lien eventId → notification → automation dans une vue graph (O10)
3. **Navigation** — route `/erp/observability` sans entrée menu sidebar
4. **Viewer** — lecture approval.* uniquement, API bloquée (by design)
5. **Dual namespace observability** — fusion platform/ERP non planifiée P8

---

## 16. Limites P8

- Pas analytics BI
- Pas monitoring infra (Grafana replacement interdit)
- Pas realtime websocket
- Pas replay / kill switch / republish
- Pas contrôles admin bus depuis UI
- Handlers registry : lecture seule — pas unregister UI
- Snapshot : point-in-time — pas historique long terme

---

## 17. Prochaines priorités

| Phase | Objectif |
|-------|----------|
| **P9** | RH Expansion (mutations, catalogue, automation additionnelles) |
| **P10** | Autres domaines métiers sur bus gouverné |
| **P11** | Observability avancée : replay, corrélation, analytics, persistence traces *(si nécessaire)* |

**Améliorations optionnelles post-P8 :**

- Lien navigation super_admin → `/erp/observability`
- Export snapshot JSON côté UI
- Métriques agrégées (compteurs par domaine sur fenêtre glissante)

---

## 18. Synthèse exécutive

| Critère validation P8 | Statut |
|------------------------|--------|
| Audit produit | ✓ |
| Governance model défini | ✓ |
| Trace foundation créée | ✓ |
| Runtime snapshot défini | ✓ |
| UI design + page | ✓ |
| API readiness + routes GET | ✓ |
| Security model défini | ✓ |
| Coexistence définie | ✓ |
| Readiness validée | ✓ **READY** |
| Rapport final | ✓ (ce document) |
| Sans rebuild bus | ✓ |
| Sans système parallèle | ✓ |

**REMPRES P8** transforme le bus ERP de **invisible** à **governed visibility** : un opérateur mature peut voir, tracer et auditer l’activité events/handlers/notifications/automation **sans reconstruire l’infrastructure existante**.

---

*Généré : POST-P7.3 — ERP Observability Phase P8 — Observe First*
