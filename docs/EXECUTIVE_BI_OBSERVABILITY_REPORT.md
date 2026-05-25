# EXECUTIVE + BI + OBSERVABILITY HUB — Bloc 3 Étape 6

## 1. Contexte

Mission : hub d'intelligence exécutive ERP-grade (pas dashboard décoratif). Super Admin inchangé.

État amont : Operations ACTIVE, 64 types événements catalogue `erp-event-catalog-bloc3-ops-v1`.

## 2. Executive cockpit

- Route : `/dashboard/executive` (inchangée, enrichie)
- Snapshot : `executive-read-placeholder.ts` — **7/7 domaines live** (`placeholder: false`)
- Finance : revenus, dépenses, marge + **chart tendance 6 mois**
- Consultation : KPIs Operations (`erp_ops_*`)
- Marketing / Formation : proxies CRM + profils RH
- Événement : `executive.snapshot.refreshed`

## 3. BI + KPI governance

- SQL : `erp_bi_kpi_definitions`, `erp_bi_kpi_snapshots`
- Registry TS : `lib/executive/runtime/bi-kpi-registry.ts` (ONE KPI TRUTH)
- Engine : `executive-bi-engine.ts` — agrégation + seuils + persist snapshots
- UI : `/dashboard/executive/intelligence`
- Événement : `analytics.snapshot.computed`, `executive.kpi.threshold_exceeded`

## 4. Forecast

- SQL : `erp_executive_forecasts`
- Service : `executive-forecast-service.ts` — run-rate revenus, trésorerie, pipeline, charge ops
- UI : `/dashboard/executive/forecast`
- Événement : `executive.forecast.generated`

## 5. Observability hub

- Pages : `/admin/observability`, `/incidents`, `/health` (module `ObservabilityOperationalWorkspace`)
- Digest : `observability-hub-digest.ts` — DB incidents + health + bus
- Console technique : `/erp/observability` (inchangée)
- Événements : `observability.hub.refreshed`, `observability.health.degraded`

## 6. Alerting

- SQL : `erp_executive_signals`
- Service : `executive-alerting-service.ts` — seuils KPI + marge négative
- Événement : `executive.signal.raised`

## 7. Cross-domain intelligence

- Service : `executive-cross-domain-intelligence.ts`
- Corrélations : Sales↔Finance, CRM↔Ops, Supply↔Ops, RH↔Ops
- UI : section Intelligence exécutive

## 8. Performance

- Snapshot : `Promise.all` requêtes count/aggregate parallèles
- Cache 10 min `erp_analytics_snapshots`
- Chart revenus : 6 requêtes mensuelles séquentielles (acceptable P8 ; optimisable MV 061)

## 9. Matrix

| AREA | EXPECTED | RESULT |
|------|----------|--------|
| Cockpit | 7 domaines live | PASS |
| BI | registry + engine | PASS |
| Forecast | 4 métriques persistées | PASS |
| Observability | admin hub pages | PASS |
| Alerting | signals + events | PASS |
| Cross-domain | 4 insights | PASS |
| Events | 9 nouveaux types | PASS |
| Super Admin | Inchangé | PASS |

## 10. Dette restante

- MV `061` non alignée au contrat `ExecutiveGlobalSnapshot` (refresh SQL optionnel)
- `analytics.report.generated` / `observability.incident.escalated` : catalogue_only
- Pages observability secondaires (anomalies, traces) : NAV sans page (404 si clic)
- Module permissions `observability` : accès admin/super_admin en layout

## 11. Verdict

**EXEC_INTELLIGENCE_ACTIVE**

Catalogue : `erp-event-catalog-bloc3-executive-v1` — **73 types**. Prérequis : migration `065_executive_bi_observability_domain.sql`.
