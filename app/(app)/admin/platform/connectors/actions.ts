"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  createConnector,
  deleteConnector,
  toggleConnector,
  updateConnector,
} from "@/lib/server/platform";

export async function createConnectorAction(
  input: Omit<Parameters<typeof createConnector>[0], "created_by">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifie." };
  const result = await createConnector({ ...input, created_by: user.id });
  if (result.success) revalidatePath("/admin/platform/connectors");
  return result;
}

export async function updateConnectorAction(
  id: string,
  input: Parameters<typeof updateConnector>[1],
): Promise<{ success: boolean; error?: string }> {
  const result = await updateConnector(id, input);
  if (result.success) revalidatePath("/admin/platform/connectors");
  return result;
}

export async function deleteConnectorAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await deleteConnector(id);
  if (result.success) revalidatePath("/admin/platform/connectors");
  return result;
}

export async function toggleConnectorAction(
  id: string,
  newStatus: "active" | "inactive",
): Promise<{ success: boolean; error?: string }> {
  const result = await toggleConnector(id, newStatus);
  if (result.success) revalidatePath("/admin/platform/connectors");
  return result;
}
