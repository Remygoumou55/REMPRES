"use server";

import { revalidatePath } from "next/cache";
import {
  guardErrorMessage,
  requireAdminConsoleMutation,
} from "@/lib/governance/runtime/mutation-guard";
import {
  createConnector,
  deleteConnector,
  toggleConnector,
  updateConnector,
} from "@/lib/server/platform";

export async function createConnectorAction(
  input: Omit<Parameters<typeof createConnector>[0], "created_by">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireAdminConsoleMutation();
    const result = await createConnector({ ...input, created_by: session.userId });
    if (result.success) revalidatePath("/admin/platform/connectors");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function updateConnectorAction(
  id: string,
  input: Parameters<typeof updateConnector>[1],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await updateConnector(id, input);
    if (result.success) revalidatePath("/admin/platform/connectors");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function deleteConnectorAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await deleteConnector(id);
    if (result.success) revalidatePath("/admin/platform/connectors");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function toggleConnectorAction(
  id: string,
  newStatus: "active" | "inactive",
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await toggleConnector(id, newStatus);
    if (result.success) revalidatePath("/admin/platform/connectors");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}
