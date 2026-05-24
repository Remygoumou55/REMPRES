"use server";

import { approveRequest, rejectRequest } from "@/lib/server/approvals";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

async function assertSuperAdminUser(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isSuperAdmin(user.id))) redirect("/access-denied");
  return user.id;
}

export async function approveRequestAction(
  requestId: string,
  comment?: string,
): Promise<{ success?: boolean; error?: string }> {
  const userId = await assertSuperAdminUser();
  const result = await approveRequest(requestId, userId, comment);
  revalidatePath("/actions/approbations");
  return result;
}

export async function rejectRequestAction(
  requestId: string,
  comment: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!comment?.trim()) {
    return { error: "La raison du rejet est obligatoire" };
  }
  const userId = await assertSuperAdminUser();
  const result = await rejectRequest(requestId, userId, comment);
  revalidatePath("/actions/approbations");
  return result;
}
