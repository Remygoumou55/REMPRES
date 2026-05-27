"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
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
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await createWebhook({ ...input, created_by: user.id });
  if (result.success) revalidatePath("/admin/platform/webhooks");
  return result;
}

export async function updateWebhookAction(
  id: string,
  input: Parameters<typeof updateWebhook>[1],
): Promise<{ success: boolean; error?: string }> {
  const result = await updateWebhook(id, input);
  if (result.success) revalidatePath("/admin/platform/webhooks");
  return result;
}

export async function deleteWebhookAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const result = await deleteWebhook(id);
  if (result.success) revalidatePath("/admin/platform/webhooks");
  return result;
}

export async function toggleWebhookAction(
  id: string,
  isActive: boolean,
): Promise<{ success: boolean; error?: string }> {
  const result = await toggleWebhook(id, isActive);
  if (result.success) revalidatePath("/admin/platform/webhooks");
  return result;
}

export async function listDeliveriesAction(
  webhookId: string,
  limit = 10,
): Promise<WebhookDelivery[]> {
  return listDeliveries(webhookId, limit);
}
