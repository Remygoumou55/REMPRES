"use server";

import { revalidatePath } from "next/cache";
import {
  guardErrorMessage,
  requireAdminConsoleMutation,
} from "@/lib/governance/runtime/mutation-guard";
import { createApi, deleteApi, pingApi, updateApi } from "@/lib/server/platform";

export async function createApiAction(
  input: Omit<Parameters<typeof createApi>[0], "created_by">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const session = await requireAdminConsoleMutation();
    const result = await createApi({ ...input, created_by: session.userId });
    if (result.success) revalidatePath("/admin/platform/apis");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function updateApiAction(
  id: string,
  input: Parameters<typeof updateApi>[1],
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await updateApi(id, input);
    if (result.success) revalidatePath("/admin/platform/apis");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function deleteApiAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminConsoleMutation();
    const result = await deleteApi(id);
    if (result.success) revalidatePath("/admin/platform/apis");
    return result;
  } catch (err) {
    return { success: false, error: guardErrorMessage(err) };
  }
}

export async function pingApiAction(endpointUrl: string): Promise<{
  reachable: boolean;
  latency_ms: number | null;
  status_code: number | null;
  error?: string;
}> {
  try {
    await requireAdminConsoleMutation();
    return pingApi(endpointUrl);
  } catch (err) {
    return {
      reachable: false,
      latency_ms: null,
      status_code: null,
      error: guardErrorMessage(err),
    };
  }
}
