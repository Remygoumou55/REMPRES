# PLATFORM + MARKETPLACE + ECOSYSTEM — Bloc 3 Étape 8

## 1 — Contexte

Mission : maturer la plateforme ERP extensible (056/057 existants) vers **ERP_PLATFORM_ACTIVE**, sans marketplace décorative ni modification Super Admin.

Prérequis : POST-AUTOMATION_DOMAIN, catalogue automation **82 types**, SQL `056` + `057`.

## 2 — APIs

| Module | Statut | Détail |
|--------|--------|--------|
| Registry | ACTIVE | `erp_platform_api_registry` + `PLATFORM_API_GOVERNANCE_REGISTRY` |
| Auth | ACTIVE | session / api_key / oauth2 / mutual_tls |
| Rate limits | ACTIVE | `api-invocation-guard.ts` in-process |
| Audit | ACTIVE | `erp_platform_api_audit_log` append-only |
| Lifecycle | ACTIVE | draft → active → deprecated → retired |

## 3 — Integrations

Framework : `erp_platform_integration_definitions` — 6 catégories (banking, payment, email, calendar, cloud, third_party).

Service : `integration-framework-service.ts` — `connectPlatformIntegration` tenant-scoped.

## 4 — Connectors

Engine : `connector-engine-service.ts` — health probe, retry, logs `erp_platform_connector_logs`.

Instances : `erp_platform_connector_instances` — états disconnected → connected → degraded.

UI : `/admin/platform/connectors`

## 5 — Plugins

Architecture : catalog `erp_platform_catalog_plugins` + installations `erp_platform_plugin_installations`.

Lifecycle : `plugin-lifecycle-service.ts` — activate + bus `platform.plugin.installed`.

Manifest / permissions : JSON manifest + risk_tier gouverné.

## 6 — Marketplace

Foundation : listings seedés (connecteurs + sandbox dev), `marketplace-catalog-service.ts`.

Discovery : `/admin/platform/marketplace` — par kind, risk tier.

## 7 — Developer ecosystem

Registry : `developer-ecosystem-registry.ts` — SDK strategy, onboarding, sandbox `rempres.dev.sandbox`.

UI : `/admin/platform/sdk`

## 8 — Observability

Métriques : APIs actives, connecteurs OK/dégradés, échecs 24h, invocations API.

UI : `/admin/platform/observability`

## 9 — Performance

- Rate limit in-memory (pas de DB par requête)
- Audit / logs best-effort async
- Pages admin SSR ciblées (pas de hydration lourde marketplace)

## 10 — Matrix validation

| AREA | EXPECTED | RESULT |
|------|----------|--------|
| API governance | registry + guard | PASS |
| Integrations | 6 definitions | PASS |
| Connectors | engine + logs | PASS |
| Plugins | catalog + lifecycle | PASS |
| Marketplace | listed catalog | PASS |
| Developer | sandbox guide | PASS |
| Cockpit | /admin/platform | PASS |
| Events | 91 catalog | PASS |
| Super Admin | unchanged | PASS |

## 11 — Dette restante

- Pages nav secondaires (workflows, billing, recovery) : liens présents, contenu minimal / à venir
- OAuth2 / mTLS : gouvernés au registry, wiring runtime partenaire phase ultérieure
- `067` à appliquer en base distante pour tables API/connectors
- Install marketplace one-click : flow gouverné manuel (operator) par design

## 12 — Verdict

**PLATFORM_DOMAIN_ACTIVE**

Catalogue : `erp-event-catalog-bloc3-platform-v1` — **91 types**.

Migration : `067_platform_marketplace_ecosystem.sql`.

Super Admin : **non modifié**.
