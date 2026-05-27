"use server";

import { revalidatePath } from "next/cache";
import {
  guardErrorMessage,
  requireAdminConsoleMutation,
  requireAuthenticatedSession,
} from "@/lib/governance/runtime/mutation-guard";
import {
  createWebhook,
  deleteWebhook,
  listDeliveries,
  toggleWebhook,
  updateWebhook,
} from "@/lib/server/webhooks";
import type { WebhookDelivery } from "@/lib/server/webhooks";

export async function createWebhookAction(
  input: Omit<Parameters<typeof createWebhook>[0], "created_by">,
): Promise<{
  success: boolean;
  id?: string;
  secret_token?: string;
  error?: string;
}> {
  try {
    const session = await requireAdminConsoleMutation();
    const result = await createWebhook({ ...input, created_by: session.userId });
    if (result.success) revalidatePath("/admin/platform/webhooks");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function updateWebhookAction(
  id: string,
  input: Parameters<typeof updateWebhook>[1],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await updateWebhook(id, input);
    if (result.success) revalidatePath("/admin/platform/webhooks");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function deleteWebhookAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await deleteWebhook(id);
    if (result.success) revalidatePath("/admin/platform/webhooks");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function toggleWebhookAction(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await toggleWebhook(id, isActive);
    if (result.success) revalidatePath("/admin/platform/webhooks");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function listDeliveriesAction(
  webhookId: string,
  limit = 10,
): Promise<WebhookDelivery[]> {
  try {
    await requireAuthenticatedSession();
    return listDeliveries(webhookId, limit);
  } catch {
    return [];
  }
}
