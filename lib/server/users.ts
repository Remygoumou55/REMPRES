"use server";

import { getSupabaseAdmin, getSupabaseAdminConfigErrorMessage } from "@/lib/supabaseAdmin";
import { isSuperAdmin } from "@/lib/server/permissions";
import { logError, logInfo, logWarning } from "@/lib/logger";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { appConfig } from "@/lib/config";
import type { Json } from "@/types/database.types";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";

// -------------------------
// TYPES
// -------------------------

export interface InviteUserInput {
  firstName: string;
  lastName: string;
  email: string;
  roleKey: string;
  departmentKey: string | null;
}

const DEFAULT_ROLE_KEY = "employe";

// -------------------------
// HELPER REDIRECT (FIX CRITIQUE)
// -------------------------

function getRedirectUrl(): string {
  return "https://rempres.com/auth/callback"; // ✅ FIX FINAL
}

// -------------------------
// INVITE USER (FIX COMPLET)
// -------------------------

export async function inviteUser(
  input: InviteUserInput,
  callerUserId: string
): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  try {
    // 🔐 SECURITY
    if (!(await isSuperAdmin(callerUserId))) {
      return { success: false, error: "Accès refusé" };
    }

    const configMsg = getSupabaseAdminConfigErrorMessage();
    if (configMsg) {
      return { success: false, error: "Configuration serveur manquante" };
    }

    const admin = getSupabaseAdmin();

    const email = input.email.trim().toLowerCase();
    const firstName = input.firstName.trim();
    const lastName = input.lastName.trim();
    const roleKey = input.roleKey || DEFAULT_ROLE_KEY;

    // -------------------------
    // 🚨 INVITATION (FIX PRINCIPAL)
    // -------------------------

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: getRedirectUrl(), // ✅ FIX ICI
      data: {
        first_name: firstName,
        last_name: lastName,
        role_key: roleKey,
        department_key: input.departmentKey,
      },
    });

    if (error) {
      console.error("[INVITE_USER_ERROR]", {
        email,
        error: error.message,
      });

      if (error.message?.toLowerCase().includes("already")) {
        return { success: false, error: "Utilisateur déjà existant" };
      }

      return { success: false, error: "Erreur lors de l'invitation" };
    }

    if (!data?.user?.id) {
      return { success: false, error: "Erreur création utilisateur" };
    }

    const userId = data.user.id;

    // -------------------------
    // 🧠 SYNC PROFILE (IMPORTANT)
    // -------------------------

    await admin.from("profiles").upsert({
      id: userId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role_key: roleKey,
      department_key: input.departmentKey,
      is_active: true,
    });

    logInfo("INVITE_USER", "User invited", { email });

    return { success: true, userId };
  } catch (e) {
    console.error("[INVITE_USER_FATAL]", e);
    return { success: false, error: "Erreur serveur" };
  }
}

// -------------------------
// RESEND INVITE (FIX AUSSI)
// -------------------------

export async function resendInvite(
  userId: string,
  callerUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!(await isSuperAdmin(callerUserId))) {
      return { success: false, error: "Accès refusé" };
    }

    const admin = getSupabaseAdmin();

    const { data: userData } = await admin.auth.admin.getUserById(userId);

    if (!userData?.user?.email) {
      return { success: false, error: "Utilisateur introuvable" };
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(
      userData.user.email,
      {
        redirectTo: getRedirectUrl(), // ✅ FIX ICI AUSSI
      }
    );

    if (error) {
      return { success: false, error: "Erreur resend invite" };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: "Erreur serveur" };
  }
}