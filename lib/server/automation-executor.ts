import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { createApprovalRequest } from "@/lib/server/approvals";
import { createNotification } from "@/lib/server/notifications";

export type TriggerContext = {
  amount_gnf?: number;
  department?: string;
  priority?: string;
  user_id?: string;
  entity_id?: string;
  entity_name?: string;
  [key: string]: unknown;
};

type RuleRow = Record<string, unknown>;

export async function executeRulesForTrigger(
  triggerType: string,
  context: TriggerContext = {},
): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    const { data: rules, error } = await supabase
      .from("automation_rules" as never)
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (error || !rules || rules.length === 0) return;

    await Promise.all(
      (rules as RuleRow[]).map((rule) => executeSingleRule(rule, context)),
    );
  } catch (err) {
    console.error("[AutomationEngine] Error fetching rules:", err);
  }
}

async function executeSingleRule(rule: RuleRow, context: TriggerContext): Promise<void> {
  let status: "success" | "failed" | "skipped" = "success";
  let errorMessage: string | null = null;

  try {
    if (rule.condition_type) {
      const conditionMet = evaluateCondition(
        String(rule.condition_type),
        (rule.condition_config as Record<string, unknown>) ?? {},
        context,
      );
      if (!conditionMet) {
        status = "skipped";
        return;
      }
    }

    await executeAction(
      String(rule.action_type),
      (rule.action_config as Record<string, unknown>) ?? {},
      context,
      String(rule.trigger_type),
      rule,
    );
    status = "success";
  } catch (err) {
    status = "failed";
    errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[AutomationEngine] Rule "${String(rule.name)}" failed:`, err);
  } finally {
    await logExecution(rule, context, status, errorMessage).catch(() => {});
    if (status === "success") {
      await updateExecutionStats(String(rule.id)).catch(() => {});
    }
  }
}

function evaluateCondition(
  conditionType: string,
  config: Record<string, unknown>,
  context: TriggerContext,
): boolean {
  try {
    switch (conditionType) {
      case "amount_threshold": {
        const threshold = Number(config.value ?? config.threshold ?? 0);
        const operator = String(config.operator ?? ">");
        const amount = Number(context.amount_gnf ?? 0);
        switch (operator) {
          case ">":
            return amount > threshold;
          case ">=":
            return amount >= threshold;
          case "<":
            return amount < threshold;
          case "<=":
            return amount <= threshold;
          case "=":
            return amount === threshold;
          default:
            return amount > threshold;
        }
      }
      case "department_filter": {
        const dept = String(config.value ?? "");
        return context.department === dept;
      }
      case "priority_filter": {
        const prio = String(config.value ?? "");
        return context.priority === prio;
      }
      default:
        return true;
    }
  } catch {
    return true;
  }
}

async function executeAction(
  actionType: string,
  config: Record<string, unknown>,
  context: TriggerContext,
  triggerType: string,
  rule: RuleRow,
): Promise<void> {
  switch (actionType) {
    case "notify_role": {
      const role = String(config.role ?? "");
      const messageTemplate = String(
        config.message ?? "Une règle automation a été déclenchée.",
      );

      const message = messageTemplate
        .replace(
          "{amount}",
          context.amount_gnf
            ? `${new Intl.NumberFormat("fr-FR").format(context.amount_gnf)} GNF`
            : "",
        )
        .replace("{entity}", String(context.entity_name ?? ""))
        .replace("{department}", String(context.department ?? ""));

      if (!role) throw new Error("notify_role: role is required");

      const supabase = getSupabaseServerClient();
      const { data: users } = await supabase
        .from("profiles")
        .select("id")
        .eq("role_key", role)
        .is("deleted_at", null);

      if (!users || users.length === 0) return;

      await Promise.all(
        users.map((u) =>
          createNotification({
            userId: String(u.id),
            type: "info",
            title: `Automation — ${getTriggerLabel(triggerType)}`,
            message,
            actionUrl: "/admin/automation/history",
          }).catch(() => {}),
        ),
      );
      break;
    }

    case "create_approval": {
      const title = String(config.title ?? "Approbation requise");
      const requesterId = String(
        context.user_id ?? rule.created_by ?? "",
      ).trim();
      if (!requesterId) {
        throw new Error("create_approval: aucun utilisateur initiateur");
      }

      const description =
        `Déclenché automatiquement par la règle « ${String(rule.name ?? triggerType)} ».` +
        (context.entity_name ? ` Entité : ${context.entity_name}.` : "");

      const result = await createApprovalRequest({
        requestedBy: requesterId,
        requesterName: "Automation",
        requesterRole: "automation",
        requesterDept: "ADMINISTRATION",
        actionType: "automation.approval",
        module: "automation",
        targetId: context.entity_id,
        targetLabel: title,
        description,
        actionPayload: { triggerType, context, ruleId: rule.id },
        priority: "normal",
      });

      if (!result.success) {
        throw new Error(result.error ?? "Échec création approbation");
      }
      break;
    }

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

function getTriggerLabel(triggerType: string): string {
  const labels: Record<string, string> = {
    sale_validated: "Vente validée",
    stock_low: "Stock bas",
    lead_converted: "Lead converti",
    expense_submitted: "Dépense soumise",
    task_overdue: "Tâche en retard",
    employee_created: "Nouveau employé",
    purchase_order_confirmed: "Commande confirmée",
  };
  return labels[triggerType] ?? triggerType;
}

async function logExecution(
  rule: RuleRow,
  context: TriggerContext,
  status: string,
  errorMessage: string | null,
): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.from("automation_execution_logs" as never).insert({
    rule_id: rule.id as string,
    rule_name: String(rule.name ?? ""),
    trigger_type: String(rule.trigger_type ?? ""),
    action_type: String(rule.action_type ?? ""),
    status,
    error_message: errorMessage,
    context_data: context,
    executed_at: new Date().toISOString(),
  } as never);
}

async function updateExecutionStats(ruleId: string): Promise<void> {
  const supabase = getSupabaseServerClient();
  await supabase.rpc("increment_automation_rule_execution" as never, {
    p_rule_id: ruleId,
  } as never);
}
