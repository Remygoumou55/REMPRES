-- =============================================
-- RemPres ERP — Gouvernance tables « dupliquées »
-- Date: 2026-05-26
-- =============================================
-- Audit: docs/DUPLICATE_TABLES_AUDIT.md
--
-- Aucune table supprimée. Aucune vue de fusion (modèles métier distincts).
-- Ce script documente la source de vérité via COMMENT ON TABLE (idempotent).
--
-- Run in Supabase SQL Editor if governance comments are needed.
-- If audit concludes no merge → comments only (this file).

-- ─── Pair 1: rh_employee_history ─────────────────────────────
-- Canonical (état courant): employees
-- rh_employee_history: journal d'événements RH (NON redondant)
-- Status: KEPT — audit log, do not merge into employees

COMMENT ON TABLE public.employees IS
  'RH — Source de vérité fiche collaborateur (état courant). Voir docs/DUPLICATE_TABLES_AUDIT.md § Paire 1.';

COMMENT ON TABLE public.rh_employee_history IS
  'RH — Journal événements / timeline (complément de employees, pas un doublon). Ne pas utiliser comme état courant.';

-- ─── Pair 2: logistics_inventory_balances vs stock_items ─────
-- stock_items: articles supply autonomes (070_logistique_records_schema)
-- logistics_inventory_balances: positions entrepôt × products catalogue vente (048)
-- Status: SEPARATE DOMAINS — do not redirect queries between them

COMMENT ON TABLE public.stock_items IS
  'Logistique supply — Articles autonomes (SKU logistique). Mouvements: stock_movements_logistique. Distinct de logistics_inventory_balances.';

COMMENT ON TABLE public.logistics_inventory_balances IS
  'Logistique enterprise — Stock multi-sites par entrepôt et produit catalogue (products.id). Mouvements: logistics_stock_movements. Distinct de stock_items.';

-- ─── Pair 3: crm_leads vs leads (marketing) ──────────────────
-- crm_leads: pipeline commercial /vente/crm
-- leads: réponses campagnes marketing (campaign_id)
-- Status: SEPARATE CONCERNS — not duplicates

COMMENT ON TABLE public.crm_leads IS
  'CRM Vente — Prospects pipeline commercial (B2B). Canonique module CRM. Distinct de public.leads (marketing).';

COMMENT ON TABLE public.leads IS
  'Marketing — Leads campagnes acquisition (table leads). Canonique module Marketing. Distinct de crm_leads.';

-- ► Safe to re-run: COMMENT ON TABLE is replaced on each execution.
