import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getRuleSummary } from "@/lib/constants/automation";

export type AutomationRule = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  condition_type: string | null;
  condition_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  is_active: boolean;
  execution_count: number;
  last_executed_at: string | null;
  created_at: string;
  summary: string;
};

export type AutomationLog = {
  id: string;
  rule_id: string;
  rule_name: string;
  trigger_type: string;
  action_type: string;
  status: "success" | "failed" | "skipped";
  error_message: string | null;
  executed_at: string;
};

type RuleRow = {
  id: string;
  name: string;
  description: string | null;
  trigger_type: string;
  trigger_config: Record<string, unknown> | null;
  condition_type: string | null;
  condition_config: Record<string, unknown> | null;
  action_type: string;
  action_config: Record<string, unknown> | null;
  is_active: boolean;
  execution_count: number | null;
  last_executed_at: string | null;
  created_at: string;
};

function mapRule(row: RuleRow): AutomationRule {
  const trigger_config = (row.trigger_config ?? {}) as Record<string, unknown>;
  const condition_config = (row.condition_config ?? {}) as Record<string, unknown>;
  const action_config = (row.action_config ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    trigger_type: row.trigger_type,
    trigger_config,
    condition_type: row.condition_type,
    condition_config,
    action_type: row.action_type,
    action_config,
    is_active: row.is_active,
    execution_count: Number(row.execution_count ?? 0),
    last_executed_at: row.last_executed_at,
    created_at: row.created_at,
    summary: getRuleSummary({
      trigger_type: row.trigger_type,
      condition_type: row.condition_type,
      action_type: row.action_type,
      action_config,
    }),
  };
}

export async function listRules(): Promise<{
  data: AutomationRule[];
  total: number;
  active_count: number;
}> {
  const supabase = getSupabaseServerClient();
  const { data, error, count } = await supabase
    .from("automation_rules" as never)
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return { data: [], total: 0, active_count: 0 };

  const rows = (data ?? []) as RuleRow[];
  const mapped = rows.map(mapRule);
  return {
    data: mapped,
    total: count ?? mapped.length,
    active_count: mapped.filter((r) => r.is_active).length,
  };
}

export async function getRuleById(id: string): Promise<AutomationRule | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("automation_rules" as never)
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) return null;
  return mapRule(data as RuleRow);
}

export async function createRule(input: {
  name: string;
  description?: string;
  trigger_type: string;
  trigger_config?: Record<string, unknown>;
  condition_type?: string | null;
  condition_config?: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
  created_by: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  const supabase = getSupabaseServerClient();
  const name = input.name.trim();
  if (!name) return { success: false, error: "Le nom est obligatoire." };
  if (!input.trigger_type) return { success: false, error: "Déclencheur requis." };
  if (!input.action_type) return { success: false, error: "Action requise." };

  const { data, error } = await supabase
    .from("automation_rules" as never)
    .insert({
      name,
      description: input.description?.trim() || null,
      trigger_type: input.trigger_type,
      trigger_config: input.trigger_config ?? {},
      condition_type: input.condition_type ?? null,
      condition_config: input.condition_config ?? {},
      action_type: input.action_type,
      action_config: input.action_config,
      is_active: false,
      created_by: input.created_by,
    } as never)
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, error: error?.message ?? "Création impossible." };
  }
  return { success: true, id: String((data as { id: string }).id) };
}

export async function updateRule(
  id: string,
  input: {
    name?: string;
    description?: string;
    trigger_type?: string;
    trigger_config?: Record<string, unknown>;
    condition_type?: string | null;
    condition_config?: Record<string, unknown>;
    action_type?: string;
    action_config?: Record<string, unknown>;
  },
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.description !== undefined) patch.description = input.description || null;
  if (input.trigger_type !== undefined) patch.trigger_type = input.trigger_type;
  if (input.trigger_config !== undefined) patch.trigger_config = input.trigger_config;
  if (input.condition_type !== undefined) patch.condition_type = input.condition_type;
  if (input.condition_config !== undefined) patch.condition_config = input.condition_config;
  if (input.action_type !== undefined) patch.action_type = input.action_type;
  if (input.action_config !== undefined) patch.action_config = input.action_config;

  const { error } = await supabase
    .from("automation_rules" as never)
    .update(patch as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function toggleRule(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("automation_rules" as never)
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("id", id)
    .is("deleted_at", null);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteRule(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServerClient();
  const { error } = await supabase
    .from("automation_rules" as never)
    .update({ deleted_at: new Date().toISOString(), is_active: false } as never)
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function listExecutionLogs(params?: {
  ruleId?: string;
  limit?: number;
}): Promise<AutomationLog[]> {
  const supabase = getSupabaseServerClient();
  const limit = params?.limit ?? 50;

  let query = supabase
    .from("automation_execution_logs" as never)
    .select("id,rule_id,rule_name,trigger_type,action_type,status,error_message,executed_at")
    .order("executed_at", { ascending: false })
    .limit(limit);

  if (params?.ruleId) query = query.eq("rule_id", params.ruleId);

  const { data, error } = await query;
  if (error) return [];

  return ((data ?? []) as AutomationLog[]).map((row) => ({
    ...row,
    status: row.status as AutomationLog["status"],
  }));
}
