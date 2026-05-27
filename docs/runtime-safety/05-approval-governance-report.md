# 05 — Approval Governance Report

## Systèmes coexistants

| Surface | Fichier |
|---------|---------|
| Legacy | `/actions/approbations` — `lib/server/approvals.ts` |
| Admin | `/admin/approvals` — governance repository |
| SQL | `036`, `062`, `005` migrations (duplication historique) |

## Correctifs lot 1 (`lib/server/approvals.ts`)

- `approveRequest`: exécute l'action **avant** passage à `approved`
- Échec exécution → retour erreur, statut reste `pending`
- `rejectRequest`: vérifie `status === pending`

## Single Source Of Truth (cible)

1. Table canonique: `approval_requests`
2. Service canonique: `lib/server/approvals.ts` + couche governance read
3. UI canonique: `/admin/approvals` (redirect legacy)

## Actions sensibles recensées

Voir `lib/constants/sensitive-actions.ts` — delete sale, large expense, cancel formation, delete mission, etc.

## Prochaines étapes

- Déprécier surface legacy avec redirect permanent
- Statut `execution_failed` explicite en DB
- Notification unifiée vers `/admin/approvals`
