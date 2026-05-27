# 08 — Cleanup Report

## Dead code / legacy identifié

- Pages dashboard dept redirect-only (`*/dashboard/page.tsx`)
- Migrations SQL dupliquées approvals (`005` vs `062`)
- Modules enterprise coexistants documentés dans `080_unify_duplicate_tables.sql`

## Non supprimé (intentionnel)

- `/actions/approbations` — encore utilisé par notifications legacy
- `simple_purchase_orders` — flux achats actif
- Enterprise logistics — référence future

## Cleanup safe recommandé (lot 2+)

1. Redirect HTTP 308 legacy approvals → admin
2. Marquer `@deprecated` sur repositories enterprise non utilisés UI
3. Supprimer imports morts après analyse bundle

## Règle

Aucune suppression métier sans période de dépréciation + métriques usage.
