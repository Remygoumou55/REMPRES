"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
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
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await createRule({ ...input, created_by: user.id });
  revalidatePath("/admin/automation/rules");
  return result;
}

export async function updateRuleAction(
  id: string,
  input: Parameters<typeof updateRule>[1],
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await updateRule(id, input);
  revalidatePath("/admin/automation/rules");
  return result;
}

export async function toggleRuleAction(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await toggleRule(id, isActive);
  revalidatePath("/admin/automation/rules");
  return result;
}

export async function deleteRuleAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await deleteRule(id);
  revalidatePath("/admin/automation/rules");
  return result;
}
