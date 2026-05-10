import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database.types";
import type { InfrastructureJobRow } from "@/modules/infrastructure/types";

const RULE_DRAFT_IN_LOCKED = "finance.draft_journal_in_locked_calendar";

export async function executeComplianceRiskScan(
  admin: SupabaseClient<Database>,
  _job: InfrastructureJobRow,
): Promise<void> {
  const { data: drafts, error } = await admin
    .from("finance_journal_batches")
    .select("id, booking_date")
    .eq("status", "draft")
    .limit(400);

  if (error) throw new Error(error.message);

  for (const row of drafts ?? []) {
    const { data: permitted, error: rpcErr } = await admin.rpc(
      "compliance_booking_date_permits_journal_post",
      { p_booking_date: row.booking_date },
    );

    if (rpcErr) throw new Error(rpcErr.message);
    if (permitted === true) continue;

    const { data: existing } = await admin
      .from("erp_compliance_risk_signals")
      .select("id")
      .eq("rule_key", RULE_DRAFT_IN_LOCKED)
      .eq("entity_type", "finance_journal_batch")
      .eq("entity_id", row.id)
      .eq("status", "open")
      .maybeSingle();

    if (existing?.id) continue;

    const { error: insErr } = await admin.from("erp_compliance_risk_signals").insert({
      rule_key: RULE_DRAFT_IN_LOCKED,
      severity: "high",
      domain_key: "finance",
      entity_type: "finance_journal_batch",
      entity_id: row.id,
      status: "open",
      metadata: { booking_date: row.booking_date } as Json,
    });

    if (insErr) {
      if (insErr.code === "23505") continue;
      throw new Error(insErr.message);
    }
  }
}
