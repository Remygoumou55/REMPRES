"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createApi, deleteApi, pingApi, updateApi } from "@/lib/server/platform";

export async function createApiAction(
  input: Omit<Parameters<typeof createApi>[0], "created_by">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifie." };
  const result = await createApi({ ...input, created_by: user.id });
  if (result.success) revalidatePath("/admin/platform/apis");
  return result;
}

export async function updateApiAction(
  id: string,
  input: Parameters<typeof updateApi>[1],
): Promise<{ success: boolean; error?: string }> {
  const result = await updateApi(id, input);
  if (result.success) revalidatePath("/admin/platform/apis");
  return result;
}

export async function deleteApiAction(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await deleteApi(id);
  if (result.success) revalidatePath("/admin/platform/apis");
  return result;
}

export async function pingApiAction(endpointUrl: string): Promise<{
  reachable: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error?: string;
}> {
  return pingApi(endpointUrl);
}
