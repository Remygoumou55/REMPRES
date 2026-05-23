# REMPRES ERP — Phase P6.1
# Finance Threshold Event Emission — Rapport

**Version :** `finance-threshold-evaluator-p6-1-v1`  
**Date :** 2026-05-22  

---

## Synthèse

| Question | Verdict |
|----------|---------|
| `emitFinanceThresholdExceeded` branché ? | **Oui** |
| Point d'entrée KPI | `getFinanceRuntimeKpiBundle` |
| Anti-spam émission | Cooldown 5 min / seuil |
| Chaîne bus → P5 → P6 | **Validée** |
| Writes auto | **Non** |

---

## Flux

```
getFinanceRuntimeKpiBundle(userId)
  → getFinanceTreasuryKpis (SoT FT)
  → evaluateAndEmitFinanceTreasuryThresholds (async)
       → emitFinanceThresholdExceeded
            → bus → notification-finance-bridge → governance_alerts
            → erp-automation-engine → automation trace
```

**Déclencheurs :** `/finance/dashboard`, `/api/dept/finance/kpis`, tout appel bundle KPI.

---

## Seuils officiels P6.1

| Clé | Métrique | Condition | Défaut |
|-----|----------|-----------|--------|
| `cfo_negative_profit_month` | profitMonth | &lt; 0 | toujours actif |
| `cfo_monthly_expenses_ceiling` | expensesMonth | &gt; seuil | 500M GNF (`FINANCE_THRESHOLD_MONTHLY_EXPENSES_GNF`) |
| `cfo_daily_expenses_ceiling` | expensesToday | &gt; seuil | 50M GNF (`FINANCE_THRESHOLD_DAILY_EXPENSES_GNF`) |

---

## Fichiers

- `lib/finance/runtime/finance-threshold-rules.ts`
- `lib/finance/runtime/finance-threshold-evaluator.ts`
- `lib/finance/runtime/finance-kpi-runtime.ts` (câblage)

---

## Suite — P7

RH event foundation.
