# Audit des tables dupliquées — RemPres ERP

**Date :** 26 mai 2026

Ce document résulte d’un audit code + schémas SQL (`069`, `042`, `048`, `070`, `071`, `049`) et des usages applicatifs. **Aucune table n’a été supprimée ni fusionnée.**

---

## Paire 1 — Employés RH

### Table canonique : `employees`

| Colonne | Type |
|---------|------|
| `id` | uuid PK |
| `first_name`, `last_name` | text |
| `email`, `phone`, `address` | text nullable |
| `position`, `department` | text |
| `hire_date` | date |
| `salary_gnf` | numeric |
| `contract_type` | text (cdi/cdd/stage/freelance) |
| `is_active` | boolean |
| `user_id` | uuid → auth.users (optionnel) |
| `notes` | text |
| `created_by`, `created_at`, `updated_at`, `deleted_at` | audit |

**Utilisée par :**

- `lib/server/rh.ts` — CRUD collaborateurs, congés, présences, dashboard RH
- `lib/server/payslips.ts` — bulletins de paie
- `app/(app)/rh/collaborateurs/**` — UI responsable RH
- `modules/hr/server/services/hr-employee-mutations.ts` — mutations métier
- `lib/server/suppressions.ts` — archivage

**Rôle :** état courant du collaborateur (fiche RH opérationnelle, indépendante de `auth.users` pour le personnel sans compte système).

### Table « redondante » analysée : `rh_employee_history`

| Colonne | Type |
|---------|------|
| `id` | uuid PK |
| `employee_id` | uuid (réf. événements liés au collaborateur) |
| `event_type`, `event_label` | text |
| `payload` | jsonb |
| `created_by`, `created_at` | audit |

**Utilisée par :**

- `modules/hr/employees/server/repositories/history-repository.ts` — timeline
- `modules/hr/employees/server/actions/employee-actions.ts` — insert événements
- `modules/hr/server/services/hr-employee-mutations.ts` — insert événements
- `app/api/rh/employees/[employeeId]/history/route.ts`

**Redondance :** **aucune.** Ce n’est pas un miroir de `employees` : c’est un **journal d’événements** (insert-only métier + fusion avec `activity_logs`). Pas de colonnes `salary_gnf`, `position`, etc. dupliquées en tant que source de vérité.

### Verdict — Paire 1

| Élément | Décision |
|---------|----------|
| Stratégie | **A — Conserver les deux tables** |
| Canonique | `employees` (état courant) |
| Complémentaire | `rh_employee_history` (audit / timeline) |
| Code | **Aucune redirection** — comportement correct |
| SQL | Commentaires de gouvernance uniquement (`080`) |

---

## Paire 2 — Stock Logistique

### Table canonique (périmètre articles logistique) : `stock_items`

| Colonne | Type |
|---------|------|
| `id` | uuid PK |
| `name`, `sku`, `category` | text |
| `unit` | text |
| `quantity`, `min_quantity` | numeric |
| `unit_price_gnf` | numeric |
| `warehouse_id` | uuid → `logistics_warehouses` |
| `description` | text |
| `created_by`, `created_at`, `updated_at`, `deleted_at` | audit |

**Schéma :** `070_logistique_records_schema.sql`

**Utilisée par :**

- `lib/server/logistique.ts` — articles, mouvements `stock_movements_logistique`
- `lib/server/inventory.ts` — inventaire périodique (snapshot)
- `app/(app)/logistique/articles/**`, `mouvements/**`, `inventaire/**`
- `lib/server/approvals.ts` — suppressions

**Rôle :** catalogue **supply** autonome (SKU logistique pas forcément lié au catalogue vente `products`).

### Table analysée : `logistics_inventory_balances`

| Colonne | Type |
|---------|------|
| `warehouse_id`, `product_id` | uuid (PK composite) |
| `qty_on_hand` | integer |
| `updated_at` | timestamptz |

**FK :** `product_id` → **`products.id`** (catalogue vente), pas `stock_items`.

**Schéma :** `048_logistics_domain_enterprise.sql` — alimentée par `logistics_stock_movements` (trigger `trg_logistics_movements_apply_balance`).

**Utilisée par :**

- `modules/logistics/server/repositories/logistics-stock-repository.ts`
- `app/(app)/logistique/stock/page.tsx` — stock multi-sites catalogue
- `modules/logistics/server/services/logistics-analytics-service.ts`
- `modules/executive-dashboard/**` — KPIs exécutifs
- `lib/logistics/governance/logistics-domain-governance.ts` — SoT domaine enterprise

**Redondance :** **aucune fusion possible sans migration de données.** Modèles différents :

| | `stock_items` | `logistics_inventory_balances` |
|--|---------------|--------------------------------|
| Entité | Article logistique autonome | Position stock par entrepôt × produit vente |
| Clé | `id` | `(warehouse_id, product_id)` |
| Quantité | `quantity` | `qty_on_hand` |
| Mouvements | `stock_movements_logistique` | `logistics_stock_movements` |
| UI | `/logistique/articles` | `/logistique/stock` |

### Verdict — Paire 2

| Élément | Décision |
|---------|----------|
| Stratégie | **B — Ne pas fusionner** |
| Action code | **Aucune redirection** de `logistics_inventory_balances` vers `stock_items` |
| Future | Pont optionnel `stock_items` ↔ `products` (hors périmètre) — voir `LOGISTICS_CAPABILITY_STATUS.saleStockBridge: planned` |
| SQL | Commentaires `COMMENT ON TABLE` uniquement |

---

## Paire 3 — Leads

### Table canonique CRM : `crm_leads`

| Colonne | Type |
|---------|------|
| `id` | uuid |
| `status` | new / contacted / qualified / converted / lost |
| `source`, `company_name` | text |
| `contact_first_name`, `contact_last_name` | text |
| `email`, `phone` | text |
| `estimated_value_gnf`, `currency` | numeric / text |
| `owner_id`, `converted_client_id` | uuid |
| `notes`, `metadata`, `lost_reason` | text / jsonb |
| `created_by`, `created_at`, `updated_at`, `deleted_at` | audit |

**Schéma :** `049_crm_sales_domain_enterprise.sql`

**Utilisée par :**

- `modules/crm/server/repositories/crm-leads-repository.ts`
- `modules/crm/server/services/crm-mutations.ts`, `crm-analytics-service.ts`
- `lib/server/sales-analytics.ts` — taux conversion
- `app/(app)/vente/crm/**`
- `modules/executive-dashboard/**`

**Rôle :** pipeline commercial B2B (prospects → clients vente).

### Table canonique Marketing : `leads` (module marketing)

| Colonne | Type |
|---------|------|
| `id` | uuid |
| `first_name`, `last_name` | text |
| `email`, `phone`, `company` | text |
| `source` | campaign / referral / website / … |
| `campaign_id` | uuid → `campaigns` |
| `status` | new … converted / lost (incl. `proposal`) |
| `estimated_value_gnf` | numeric |
| `converted_client_id`, `converted_at` | conversion |
| `created_by`, `created_at`, `updated_at`, `deleted_at` | audit |

**Schéma :** `071_marketing_schema.sql` — explicitement **indépendant de `crm_leads`**.

**Utilisée par :**

- `lib/server/marketing.ts` — campagnes + leads marketing
- `app/(app)/marketing/leads/**`

**Rôle :** réponses campagnes d’acquisition (B2C / marketing), qualification avant transfert vers vente.

### Verdict — Paire 3

| Élément | Décision |
|---------|----------|
| Stratégie | **A (cas métier distincts)** — **pas des doublons** |
| Code | **Aucune fusion** — conserver `crm_leads` et `leads` |
| Documentation | Commentaires dans `marketing.ts` et `crm-leads-repository.ts` |

---

## Plan d’action (réalisé)

| # | Action | Fichiers |
|---|--------|----------|
| 1 | Rapport d’audit | `docs/DUPLICATE_TABLES_AUDIT.md` |
| 2 | Commentaires SQL gouvernance | `supabase/sql/080_unify_duplicate_tables.sql` |
| 3 | Marqueurs `@deprecated` / documentation | `lib/server/logistique.ts`, `lib/server/marketing.ts`, repositories CRM/logistics/history |
| 4 | Clarification types | `lib/types/rh.ts`, `lib/types/logistique.ts`, `lib/types/marketing.ts` |
| 5 | **Non fait (volontaire)** | DROP TABLE, vues de fusion trompeuses, redirection requêtes |

---

## Instructions opérationnelles

Exécuter dans le **Supabase SQL Editor** (optionnel, idempotent) :

`supabase/sql/080_unify_duplicate_tables.sql`

Si les commentaires sont déjà appliqués, réexécuter le fichier est sans risque.

**Aucune vue de compatibilité `_v` n’a été créée** : les paires auditées ne sont pas des sous-ensembles colonne-à-colonne ; une vue unifierait des modèles incompatibles et masquerait des bugs.
