"use server";

import { revalidatePath } from "next/cache";
import {
  guardErrorMessage,
  requireAutomationMutation,
} from "@/lib/governance/runtime/mutation-guard";
import {
  createRule,
  deleteRule,
  toggleRule,
  updateRule,
} from "@/lib/server/automation";

type RuleInput = Omit<Parameters<typeof createRule>[0], "created_by">;

export async function createRuleAction(
  input: RuleInput,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireAutomationMutation();
    const result = await createRule({ ...input, created_by: session.userId });
    revalidatePath("/admin/automation/rules");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function updateRuleAction(
  id: string,
  input: Parameters<typeof updateRule>[1],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAutomationMutation();
    const result = await updateRule(id, input);
    revalidatePath("/admin/automation/rules");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function toggleRuleAction(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAutomationMutation();
    const result = await toggleRule(id, isActive);
    revalidatePath("/admin/automation/rules");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function deleteRuleAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAutomationMutation();
    const result = await deleteRule(id);
    revalidatePath("/admin/automation/rules");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}
