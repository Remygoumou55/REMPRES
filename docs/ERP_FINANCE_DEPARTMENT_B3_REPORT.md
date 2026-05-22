# ERP Finance — Phase B3 (standard B2.4)

**Phase :** B3 — Premier département hors Vente conforme `erp-governance-standard-b2.4-v1`  
**Statut :** Livré (runtime + cockpit + API dept)  
**Prérequis :** B2.4 standard · M3 cockpit · `finance-overview` existant  

---

## Objectif

Construire **Finance** sur le **même modèle runtime** que Vente, sans modifier B2.0–B2.3 Vente :

- Package `lib/finance/runtime/`
- Cockpit manager live `/finance/dashboard`
- API supervision `/api/dept/finance/kpis` dérivée du SoT (plus de requêtes `sales` inline)

---

## Slots B2.4 implémentés

| Slot | Fichier |
|------|---------|
| Règles agrégation | `finance-transaction-rules.ts` |
| KPI trésorerie SoT | `finance-treasury-kpis.ts` → `getFinanceCfoData` |
| KPI enterprise SoT | `finance-enterprise-kpis.ts` |
| Sécurité SEC-1 app | `finance-runtime-security.ts` |
| Registre mutations | `finance-write-governance.ts` (actions **disabled**) |
| Façade KPI | `finance-kpi-runtime.ts` |
| Cockpit payload | `finance-cockpit-payload.ts` |
| UI cockpit | `FinanceCockpitClient.tsx` |

**Référence standard :** `lib/erp-core/governance/standard/finance-reference-implementation.ts`

---

## Sources KPI

| ID | Rôle |
|----|------|
| `finance-treasury-runtime-v1` | CA net, dépenses, résultat, chart 7j (FT) |
| `finance-enterprise-runtime-v1` | Journal, AR, paiements |
| `finance-runtime-kpi-bundle-v1` | Façade bundle |
| `finance-cockpit-runtime-v1` | Cockpit manager |

**Règle net vente :** via `financial_transactions` (cohérent `finance-overview`, annulations exclues).

---

## Surfaces

| Route | Comportement |
|-------|----------------|
| `/finance/dashboard` | Cockpit manager **live** |
| `/finance` | Pilotage CFO existant (filtres, inchangé) |
| `/finance/enterprise` | Hub comptable (inchangé) |
| `/api/dept/finance/kpis` | `buildDeptFinanceKpiPayload` |

---

## Hors périmètre B3

- Activation registre mutations (dépenses, journal, factures)
- Orchestration RPC Finance
- SQL SEC-1 dept-aware Finance
- Remplacement `/finance` CFO par cockpit

---

## Dette résiduelle Finance

- CA ventes : SoT **finance-treasury** (FT) ≠ **vente-commerce** (sales table) — écart acceptable si FT alimenté par `record_financial_transaction` ; à monitorer.
- `recordFinanceGovernanceAudit` : `department_key` historique `finance` minuscule — alignement futur.

---

## Tests

`tests/unit/b3-finance-runtime.test.ts`

---

*Finance B3 — obey B2.4.*
