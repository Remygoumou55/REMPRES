# 01 — Runtime Audit Report

## Périmètre

- 48+ server actions (`app/**/actions.ts`)
- Routes API (`app/api/**`)
- Services `lib/server/**`, `modules/**`
- SQL migrations `supabase/sql/**`
- Realtime hooks (`hooks/useRealtime*.ts`)

## Synthèse exécutive

| Zone | Maturité | Risque principal |
|------|----------|------------------|
| Vente / Finance / RH | Élevée | Actions sensibles partiellement gouvernées |
| Formation / Marketing | Bonne | KPI API placeholder |
| Logistique | Bonne | Double flux commandes + stock |
| Operations | Élevée | Realtime actif, charge à surveiller |
| Platform / Automation / Webhooks | Avancée | Auth action-level incomplète (corrigée lot 1) |
| Gouvernance | Bonne | Double surface approbations |

## Mutations dangereuses identifiées (avant lot 1)

- Platform APIs/Connectors/Webhooks: update/delete sans garde rôle
- Automation rules: auth sans opérateur automation
- Réception commande: double incrément stock
- Approbation: statut `approved` avant exécution side-effect

## Routes instables potentielles

- `/api/dept/[deptKey]/kpis` — placeholders Formation/Marketing
- Platform CRUD — dépendance schéma `erp_platform_*` vs colonnes CRUD récentes

## Silent failures

- `automation-executor`: fire-and-forget (by design) mais logs console only
- `logger.persistServerLog`: non implémenté

## Recommandation

Poursuivre lot 2: unification approvals + réconciliation schéma platform + tests concurrence stock.
