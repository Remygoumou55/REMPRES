#!/usr/bin/env node
/**
 * RemPres ERP — reset complet des données métier (Supabase service role).
 * Ne modifie pas le code applicatif : vide les tables métier uniquement.
 *
 * CONSERVÉ : profiles, app_roles, permissions, departments, currency_rates,
 *   expense_categories, crm_pipeline_stages, auth.users
 *
 * Usage:
 *   node scripts/reset-all-data.mjs              — données métier uniquement
 *   node scripts/reset-all-data.mjs --full         — métier + snapshots + comptes test (garde super_admin)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnvLocal() {
  const path = join(ROOT, ".env.local");
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* .env.local optional if env already set */
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requis (.env.local)");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Ordre FK-safe : enfants → parents */
const BUSINESS_TABLES = [
  // Devis Sprint 3
  "quote_items",
  "quotes",
  // CRM
  "crm_quote_lines",
  "crm_activities",
  "crm_forecast_snapshots",
  "crm_quotes",
  "crm_opportunities",
  "crm_leads",
  // Vente
  "sale_items",
  "sales_archive",
  "sales",
  "stock_movements",
  // Finance
  "finance_payment_allocations",
  "finance_ar_invoice_lines",
  "finance_ar_invoices",
  "finance_journal_lines",
  "finance_journal_batches",
  "finance_budget_lines",
  "finance_budgets",
  "finance_cashflow_daily",
  "financial_transactions",
  "expenses",
  "bank_reconciliations",
  "payslips",
  // Logistique
  "purchase_order_items",
  "purchase_orders",
  "inventory_lines",
  "inventory_sessions",
  "logistics_delivery_lines",
  "logistics_delivery_orders",
  "logistics_goods_receipt_lines",
  "logistics_goods_receipts",
  "logistics_stock_movements",
  "logistics_inventory_balances",
  "logistics_purchase_order_lines",
  "logistics_purchase_orders",
  "stock_movements_logistique",
  "stock_items",
  "simple_purchase_orders",
  "logistics_suppliers",
  "logistics_warehouses",
  // RH
  "performance_reviews",
  "rh_recruitment_onboarding",
  "rh_recruitment_history",
  "rh_recruitment_documents",
  "rh_recruitment_evaluations",
  "rh_recruitment_interviews",
  "rh_recruitment_candidates",
  "rh_contract_history",
  "rh_contract_documents",
  "rh_employee_contracts",
  "rh_employee_hierarchy",
  "rh_employee_history",
  "rh_employee_documents",
  "rh_leave_requests",
  "rh_attendance_events",
  "leave_requests",
  "attendance",
  "employees",
  // Formation & consultation
  "deliverables",
  "mission_phases",
  "appointments",
  "missions",
  "certificates",
  "enrollments",
  "trainees",
  "training_sessions",
  "trainings",
  // Marketing
  "leads",
  "campaigns",
  // Ops
  "erp_ops_task_history",
  "erp_ops_workflow_steps",
  "erp_ops_workflows",
  "erp_ops_deliveries",
  "erp_ops_tasks",
  "erp_ops_projects",
  // Platform / automation / observability runtime
  "webhook_deliveries",
  "webhooks",
  "automation_execution_logs",
  "automation_rules",
  "erp_automation_rule_executions",
  "erp_automation_escalations",
  "erp_automation_events",
  "erp_automation_workflow_runs",
  "erp_automation_schedules",
  "erp_platform_connector_logs",
  "erp_platform_connector_instances",
  "erp_platform_api_audit_log",
  "erp_platform_external_event_outbox",
  "erp_platform_partner_connections",
  "erp_platform_plugin_installations",
  "erp_analytics_snapshots",
  "erp_ai_assistant_events",
  "erp_ai_forecast_artifacts",
  "erp_ai_pipeline_runs",
  "erp_ai_recommendations",
  "erp_ai_insights",
  "erp_observability_predictions",
  "erp_observability_correlations",
  "erp_observability_trace_events",
  "erp_observability_anomalies",
  "erp_observability_incidents",
  "erp_observability_health_snapshots",
  "erp_compliance_export_manifests",
  "erp_compliance_legal_traces",
  "erp_compliance_risk_signals",
  "erp_compliance_snapshots",
  "erp_compliance_fiscal_locks",
  "erp_compliance_accounting_periods",
  "erp_infrastructure_jobs",
  "erp_cloud_operations_events",
  "erp_cloud_recovery_checkpoints",
  "erp_tenant_orchestration_events",
  "erp_tenant_recovery_checkpoints",
  "erp_tenant_analytics_snapshots",
  "erp_ecosystem_federation_events",
  "erp_governance_platform_operations_events",
  "erp_governance_maturity_snapshots",
  "erp_governance_technical_debt_entries",
  "erp_governance_board_topics",
  "erp_governance_architecture_decisions",
  "erp_resilience_platform_operations_events",
  "erp_resilience_metric_snapshots",
  "erp_resilience_validation_runs",
  "erp_resilience_scenarios",
  "erp_bi_kpi_snapshots",
  "erp_executive_forecasts",
  "erp_executive_signals",
  // Gouvernance transverse
  "governance_audit_events",
  "governance_alerts",
  "notifications",
  "approval_requests",
  "activity_logs",
  // Cœur vente (parents)
  "products",
  "clients",
  "product_categories",
  "logs",
];

const VERIFY_TABLES = [
  "clients",
  "products",
  "sales",
  "sale_items",
  "expenses",
  "quotes",
  "quote_items",
  "activity_logs",
  "employees",
  "trainings",
  "campaigns",
  "crm_leads",
];

const PRESERVE_TABLES = [
  "profiles",
  "app_roles",
  "permissions",
  "departments",
  "currency_rates",
];

const EXTRA_SNAPSHOT_TABLES = [
  "erp_analytics_snapshots",
  "erp_tenant_analytics_snapshots",
  "erp_bi_kpi_snapshots",
  "erp_executive_forecasts",
  "erp_executive_signals",
  "logistics_inventory_balances",
  "finance_cashflow_daily",
  "erp_compliance_fiscal_locks",
  "erp_compliance_snapshots",
];

const FULL_MODE = process.argv.includes("--full");

function isRootProfile(profile) {
  const role = String(profile.role_key ?? "").trim().toLowerCase();
  const auth = String(profile.system_authority ?? "").trim().toUpperCase();
  return role === "super_admin" || auth === "ROOT";
}

async function clearTable(table) {
  const filters = [
    () => supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000"),
    () => supabase.from(table).delete().gte("id", 0),
    () => supabase.from(table).delete().not("id", "is", null),
    () => supabase.from(table).delete().gte("created_at", "1970-01-01T00:00:00Z"),
  ];

  for (const run of filters) {
    const { error, count } = await run();
    if (!error) {
      return { ok: true, deleted: count ?? "?" };
    }
    const code = error.code ?? "";
    const msg = error.message ?? "";
    if (code === "42P01" || msg.includes("does not exist") || msg.includes("Could not find")) {
      return { ok: true, skipped: true, reason: "table absente" };
    }
    if (code === "42703" || msg.includes("column") || msg.includes("42703")) {
      continue;
    }
    return { ok: false, error: msg };
  }
  return { ok: false, error: "aucun filtre delete applicable" };
}

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) return null;
  return count ?? 0;
}

async function purgeTestUsers() {
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, role_key, system_authority, department_key");
  if (error) {
    return { ok: false, error: error.message };
  }

  const toRemove = (profiles ?? []).filter((p) => !isRootProfile(p));
  let removed = 0;
  for (const profile of toRemove) {
    const { error: authErr } = await supabase.auth.admin.deleteUser(profile.id);
    if (authErr) {
      console.log(`  ⚠️  auth delete ${profile.email}: ${authErr.message}`);
      await supabase.from("profiles").delete().eq("id", profile.id);
    } else {
      removed++;
      console.log(`  ✓ compte supprimé: ${profile.email} (${profile.department_key ?? "—"})`);
    }
  }
  return { ok: true, removed, kept: (profiles ?? []).length - removed };
}

async function main() {
  console.log(
    FULL_MODE
      ? "🔄 RemPres ERP — reset COMPLET (données + comptes test)\n"
      : "🔄 RemPres ERP — reset données métier\n",
  );

  let cleared = 0;
  let skipped = 0;
  let failed = 0;

  const allTables = [...BUSINESS_TABLES, ...(FULL_MODE ? EXTRA_SNAPSHOT_TABLES : [])];

  for (const table of allTables) {
    const result = await clearTable(table);
    if (result.skipped) {
      skipped++;
      continue;
    }
    if (!result.ok) {
      console.log(`  ⚠️  ${table}: ${result.error}`);
      failed++;
      continue;
    }
    cleared++;
    process.stdout.write(`  ✓ ${table}\n`);
  }

  const logsAfter = await countTable("activity_logs");
  if (logsAfter && logsAfter > 0) {
    await supabase.from("activity_logs").delete().gte("created_at", "1970-01-01T00:00:00Z");
    console.log(`\n  ↻ activity_logs forcé (était ${logsAfter})`);
  }

  if (FULL_MODE) {
    console.log("\n── Comptes utilisateurs (mode --full) ──");
    const userResult = await purgeTestUsers();
    if (!userResult.ok) {
      console.log(`  ⚠️  ${userResult.error}`);
      failed++;
    } else {
      console.log(`  Conservés: ${userResult.kept} (super_admin) · Supprimés: ${userResult.removed}`);
    }
  }

  console.log("\n── Vérification ──");
  let businessRemaining = 0;
  for (const table of VERIFY_TABLES) {
    const n = await countTable(table);
    if (n === null) continue;
    const status = n === 0 ? "OK" : "NON VIDE";
    if (n > 0) businessRemaining += n;
    console.log(`  ${table}: ${n} lignes — ${status}`);
  }

  const { count: formationProfiles } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("department_key", "FORMATION")
    .is("deleted_at", null);
  console.log(
    `  profiles FORMATION (cockpit): ${formationProfiles ?? "?"} — ${
      (formationProfiles ?? 0) === 0 ? "OK" : "NON VIDE (comptes dept)"
    }`,
  );

  for (const table of PRESERVE_TABLES) {
    const n = await countTable(table);
    if (n !== null) {
      console.log(`  ${table} (conservé): ${n} lignes`);
    }
  }

  console.log("\n── Bilan ──");
  console.log(`  Tables vidées: ${cleared}`);
  console.log(`  Tables absentes (ignorées): ${skipped}`);
  console.log(`  Erreurs: ${failed}`);

  const formationOk = (formationProfiles ?? 0) === 0;
  if (businessRemaining === 0 && failed === 0 && formationOk) {
    console.log("\n✅ RESET RÉUSSI — Application prête pour un contrôle à zéro.");
    console.log("   Rafraîchissez le cockpit (Ctrl+Shift+R) pour vider le cache navigateur.");
    process.exit(0);
  }
  if (businessRemaining > 0) {
    console.log(
      `\n⚠️  ${businessRemaining} lignes métier restantes — exécuter supabase/sql/999_reset_all_data.sql dans le SQL Editor Supabase pour finaliser.`,
    );
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
