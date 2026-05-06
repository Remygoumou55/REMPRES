"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import {
  inviteUser,
  resendInvite,
  updateUserRole,
  updateUserAdmin,
  deleteUserAdmin,
  deactivateUser,
  reactivateUser,
  type InviteUserInput,
  type UpdateUserAdminInput,
} from "@/lib/server/users";
import { normalizeDepartmentKey } from "@/lib/departments/department-config";
import { err, type SafeResult } from "@/lib/server/safe-result";

// ---------------------------------------------------------------------------
// Récupérer l'userId courant (helper interne)
// ---------------------------------------------------------------------------

async function getCurrentUserId(): Promise<string> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user.id;
}

// ---------------------------------------------------------------------------
// inviteUserAction — inviter un nouvel utilisateur
// ---------------------------------------------------------------------------

export async function inviteUserAction(
  formData: FormData,
): Promise<SafeResult<{ userId: string }>> {
  const callerId = await getCurrentUserId();

  const deptRaw = (formData.get("departmentKey") as string | null)?.trim() ?? "";
  const input: InviteUserInput = {
    firstName:     (formData.get("firstName")     as string ?? "").trim(),
    lastName:      (formData.get("lastName")      as string ?? "").trim(),
    email:         (formData.get("email")          as string ?? "").trim().toLowerCase(),
    roleKey:       (formData.get("roleKey")        as string ?? "agent"),
    departmentKey: deptRaw ? normalizeDepartmentKey(deptRaw) : null,
  };

  if (!input.firstName || !input.lastName || !input.email) {
    return err("Tous les champs obligatoires doivent être remplis.");
  }

  return inviteUser(input, callerId);
}

// ---------------------------------------------------------------------------
// resendInviteAction — renvoyer une invitation
// ---------------------------------------------------------------------------

export async function resendInviteAction(
  userId: string,
): Promise<SafeResult<null>> {
  const callerId = await getCurrentUserId();
  return resendInvite(userId, callerId);
}

// ---------------------------------------------------------------------------
// updateUserRoleAction — changer le rôle
// ---------------------------------------------------------------------------

export async function updateUserRoleAction(
  userId: string,
  newRoleKey: string,
): Promise<SafeResult<null>> {
  const callerId = await getCurrentUserId();
  return updateUserRole(userId, newRoleKey, callerId);
}

// ---------------------------------------------------------------------------
// deactivateUserAction — bloquer un compte
// ---------------------------------------------------------------------------

export async function deactivateUserAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const callerId = await getCurrentUserId();
  return deactivateUser(userId, callerId);
}

// ---------------------------------------------------------------------------
// reactivateUserAction — débloquer un compte
// ---------------------------------------------------------------------------

export async function reactivateUserAction(
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  const callerId = await getCurrentUserId();
  return reactivateUser(userId, callerId);
}

export async function updateUserAdminAction(
  userId: string,
  input: UpdateUserAdminInput,
): Promise<SafeResult<null>> {
  const callerId = await getCurrentUserId();
  return updateUserAdmin(userId, input, callerId);
}

export async function deleteUserAdminAction(
  userId: string,
): Promise<SafeResult<null>> {
  const callerId = await getCurrentUserId();
  return deleteUserAdmin(userId, callerId);
}
