/**
 * lib/server/users.ts
 * Gestion des utilisateurs côté serveur — RemPres
 *
 * Utilise le client admin (service_role) pour :
 *   - Inviter des utilisateurs via Supabase Auth
 *   - Lister les utilisateurs avec leurs profils
 *   - Désactiver / réactiver des comptes
 *
 * IMPORTANT : ce fichier ne doit JAMAIS être importé dans un composant client.
 */

"use server";

import { getSupabaseAdmin, getSupabaseAdminConfigErrorMessage } from "@/lib/supabaseAdmin";
import { isSuperAdmin } from "@/lib/server/permissions";
import { logError, logInfo, logWarning } from "@/lib/logger";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { appConfig } from "@/lib/config";
import type { Json } from "@/types/database.types";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserListItem {
  id:              string;
  email:           string;
  full_name:       string | null;
  first_name:      string | null;
  last_name:       string | null;
  role_key:        string | null;
  role_label:      string | null;
  department_key:  string | null;
  is_active:       boolean;
  status:          "active" | "pending" | "inactive";
  invited_at:      string;
  last_sign_in_at: string | null;
}

export interface InviteUserInput {
  firstName:     string;
  lastName:      string;
  email:         string;
  roleKey:       string;
  departmentKey: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getRedirectUrl(): string {
  const base = appConfig.baseUrl.replace(/\/$/, "");
  return `${base}/auth/callback?type=invite`;
}

/** Préventif — même logique côté actions, garde ici pour les appels directs. */
const INVITE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ROLE_KEY = "employe";

type AppRoleKeyRow = { key: string };

function isAuthDuplicateMessage(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes("already")
    || m.includes("registered")
    || m.includes("exists")
    || m.includes("duplicate")
    || m.includes("unique")
    || m.includes("taken")
  );
}

/** Rôle : doit exister dans `app_roles` (sécurité + cohérence données). */
async function resolveAppRoleKey(
  admin: ReturnType<typeof getSupabaseAdmin>,
  roleRequested: string,
  ctx: Record<string, unknown>,
): Promise<{ ok: true; roleKey: string } | { ok: false; error: string }> {
  const trimmed = roleRequested.trim();
  const { data, error } = await admin
    .from("app_roles")
    .select("key")
    .eq("key", trimmed)
    .maybeSingle();

  if (error) {
    logError("APP_ROLE_LOOKUP", error, ctx);
    return { ok: false, error: "Impossible de valider le rôle. Réessayez." };
  }

  const key = (data as AppRoleKeyRow | null)?.key;
  if (!key) {
    logWarning("APP_ROLE_LOOKUP", "Clé absente dans app_roles (refus strict)", {
      ...ctx,
      roleRequested: trimmed,
    });
    return { ok: false, error: "Rôle invalide ou inconnu." };
  }
  return { ok: true, roleKey: key };
}

async function tryActivityLog(
  input: {
    actorUserId: string;
    moduleKey: string;
    actionKey: string;
    targetTable: string;
    targetId?: string | null;
    metadata?: Json;
  },
) {
  try {
    await insertActivityLog({
      actorUserId: input.actorUserId,
      moduleKey: input.moduleKey,
      actionKey: input.actionKey,
      targetTable: input.targetTable,
      targetId: input.targetId ?? null,
      metadata: input.metadata ?? {},
    });
  } catch (e) {
    logError("USERS_ACTIVITY_LOG", e, { op: input.actionKey, target: input.targetId });
  }
}

const AUTH_USERS_PAGE_SIZE = 1000;
/** Garde boucle liste Auth (max ~100 000 utilisateurs). */
const AUTH_USERS_MAX_PAGES = 100;

// ---------------------------------------------------------------------------
// listUsers — liste tous les utilisateurs (admin uniquement)
// Agrège plusieurs pages Auth (admin API paginée) pour scaler au-delà de 1000 comptes.
// ---------------------------------------------------------------------------

export async function listUsers(callerUserId: string): Promise<UserListItem[]> {
  if (!(await isSuperAdmin(callerUserId))) {
    throw new Error("Accès refusé.");
  }

  const configMsg = getSupabaseAdminConfigErrorMessage();
  if (configMsg) {
    logError("LIST_USERS", new Error(configMsg), { step: "config:env" });
    throw new Error(USERS_LIST_CONFIG_ERROR_CODE);
  }

  const admin = getSupabaseAdmin();

  type AuthAdminUser = {
    id: string;
    email?: string | null;
    email_confirmed_at?: string | null;
    created_at: string;
    last_sign_in_at?: string | null;
  };

  const authRows: AuthAdminUser[] = [];

  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });

    if (authError) {
      logError("LIST_USERS", authError, { page });
      throw new Error("Impossible de récupérer la liste des utilisateurs.");
    }

    const batch = (authData?.users ?? []) as AuthAdminUser[];
    authRows.push(...batch);
    if (batch.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }
  }

  // Récupérer les profils
  const { data: profilesRaw } = await admin
    .from("profiles")
    .select("id, first_name, last_name, role_key, department_key, is_active")
    .is("deleted_at", null);

  // Récupérer les libellés de rôle
  const { data: rolesRaw } = await admin
    .from("app_roles")
    .select("key, label");

  type ProfileRow = { id: string; first_name: string | null; last_name: string | null; role_key: string; department_key: string | null; is_active: boolean };
  type RoleRow    = { key: string; label: string };

  const profiles = (profilesRaw ?? []) as ProfileRow[];
  const roles    = (rolesRaw    ?? []) as RoleRow[];

  const profileMap  = new Map(profiles.map((p) => [p.id, p]));
  const roleMap     = new Map(roles.map((r) => [r.key, r.label]));

  return authRows.map((user) => {
    const profile = profileMap.get(user.id);
    const roleKey = profile?.role_key ?? null;

    let status: UserListItem["status"] = "pending";
    if (user.email_confirmed_at && profile?.is_active)  status = "active";
    else if (profile?.is_active === false)               status = "inactive";

    return {
      id:              user.id,
      email:           user.email ?? "",
      full_name:       profile
        ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || null
        : null,
      first_name:      profile?.first_name ?? null,
      last_name:       profile?.last_name  ?? null,
      role_key:        roleKey,
      role_label:      roleKey ? (roleMap.get(roleKey) ?? null) : null,
      department_key:  profile?.department_key ?? null,
      is_active:       profile?.is_active ?? true,
      status,
      invited_at:      user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    };
  });
}

// ---------------------------------------------------------------------------
// inviteUser — envoie une invitation par email
// (Auth admin + sync profil idempotente ; trigger handle_new_user_invite en base)
// ---------------------------------------------------------------------------

export async function inviteUser(
  input: InviteUserInput,
  callerUserId: string,
): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  const emailForLog = (input.email ?? "").trim().toLowerCase();
  try {
    if (!(await isSuperAdmin(callerUserId))) {
      return {
        success: false,
        error: "Accès refusé. Seul un super administrateur peut inviter des utilisateurs.",
      };
    }

    const firstName = (input.firstName ?? "").trim();
    const lastName = (input.lastName ?? "").trim();
    const email = (input.email ?? "").trim().toLowerCase();
    const roleRequested = ((input.roleKey ?? DEFAULT_ROLE_KEY).trim() || DEFAULT_ROLE_KEY);

    if (!firstName || !lastName) {
      return { success: false, error: "Tous les champs obligatoires doivent être remplis." };
    }
    if (!email || !INVITE_EMAIL_RE.test(email)) {
      return { success: false, error: "Adresse e-mail invalide." };
    }

    const configMsg = getSupabaseAdminConfigErrorMessage();
    if (configMsg) {
      logError("INVITE_USER", new Error(configMsg), { email, step: "config:env" });
      return {
        success: false,
        error: "Configuration serveur incomplète (Supabase). Contactez l'administrateur.",
      };
    }

    const admin = getSupabaseAdmin();

    const { data: existingProfile, error: profLookupErr } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profLookupErr) {
      logError("INVITE_USER", profLookupErr, { email, step: "precheck:profile_by_email" });
      return { success: false, error: "Impossible de vérifier l'email. Réessayez." };
    }
    if (existingProfile) {
      return { success: false, error: "Un compte avec cet email existe déjà." };
    }

    const roleResolved = await resolveAppRoleKey(admin, roleRequested, {
      op: "invite",
      email,
      step: "precheck:role",
    });
    if (!roleResolved.ok) {
      return { success: false, error: roleResolved.error };
    }
    const roleKey = roleResolved.roleKey;

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role_key:       roleKey,
        first_name:     firstName,
        last_name:      lastName,
        department_key: input.departmentKey ?? null,
      },
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      if (isAuthDuplicateMessage(error.message)) {
        return { success: false, error: "Un compte avec cet email existe déjà." };
      }
      logError("INVITE_USER", error, {
        email,
        role: roleKey,
        step: "auth:inviteUserByEmail",
        code: (error as { code?: string }).code,
      });
      return {
        success: false,
        error: "L'invitation n'a pas pu être envoyée. Vérifiez l'email et réessayez.",
      };
    }

    if (!data?.user?.id) {
      logError("INVITE_USER", new Error("Missing data.user from inviteUserByEmail"), {
        email,
        step: "auth:inviteUserByEmail:empty_user",
      });
      return { success: false, error: "L'invitation n'a pas pu être envoyée. Veuillez réessayer." };
    }

    const userId = data.user.id;

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        first_name: firstName,
        last_name: lastName,
        role_key: roleKey,
        department_key: input.departmentKey ?? null,
        is_active: true,
        deleted_at: null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

    if (profileError) {
      logWarning("INVITE_USER", "Profile sync after invite (non-bloquant)", {
        email,
        userId,
        step: "profiles:upsert_safety",
        error: profileError.message,
        code: profileError.code,
      });
    }

    logInfo("INVITE_USER", `User invited: ${email}`, { role: roleKey, userId });
    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "create",
      targetTable: "profiles",
      targetId: userId,
      metadata: {
        summary: `Invitation envoyée (${email})`,
        role_key: roleKey,
      },
    });
    return { success: true, userId };
  } catch (e) {
    const isConfig =
      e instanceof Error
      && (e.message.includes("Required environment variable") || e.message.includes("getSupabaseAdmin"));
    if (isConfig) {
      logError("INVITE_USER", e, { email: emailForLog, step: "catch:config" });
      return {
        success: false,
        error: "Configuration serveur incomplète (Supabase). Contactez l'administrateur.",
      };
    }
    logError("INVITE_USER", e, { email: emailForLog, step: "catch:unexpected" });
    return { success: false, error: "L'invitation n'a pas pu être envoyée. Veuillez réessayer." };
  }
}

// ---------------------------------------------------------------------------
// resendInvite — renvoyer l'email d'invitation
// ---------------------------------------------------------------------------

export async function resendInvite(
  userId: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isSuperAdmin(callerUserId))) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    const admin = getSupabaseAdmin();

    // Récupérer l'email de l'utilisateur
    const { data: userData, error: fetchError } = await admin.auth.admin.getUserById(userId);
    if (fetchError || !userData.user.email) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    // Récupérer le profil pour les métadonnées (peut manquer : trigger ou migration)
    const { data: profile, error: profileReadErr } = await admin
      .from("profiles")
      .select("role_key, first_name, last_name, department_key")
      .eq("id", userId)
      .maybeSingle();

    if (profileReadErr) {
      logError("RESEND_INVITE_PROFILE", profileReadErr, { userId });
    }

    const { error } = await admin.auth.admin.inviteUserByEmail(userData.user.email, {
      data: {
        role_key:       profile?.role_key       ?? "employe",
        first_name:     profile?.first_name     ?? "",
        last_name:      profile?.last_name      ?? "",
        department_key: profile?.department_key ?? null,
      },
      redirectTo: getRedirectUrl(),
    });

    if (error) {
      logError("RESEND_INVITE", error, { userId });
      return { success: false, error: "Impossible de renvoyer l'invitation." };
    }

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Invitation renvoyée" },
    });
    return { success: true };
  } catch (e) {
    logError("RESEND_INVITE", e, { userId });
    return { success: false, error: "Impossible de renvoyer l'invitation. Veuillez réessayer." };
  }
}

// ---------------------------------------------------------------------------
// updateUserRole — changer le rôle d'un utilisateur
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  newRoleKey: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isSuperAdmin(callerUserId))) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    const configMsg = getSupabaseAdminConfigErrorMessage();
    if (configMsg) {
      logError("UPDATE_USER_ROLE", new Error(configMsg), { userId, step: "config:env" });
      return {
        success: false,
        error: "Configuration serveur incomplète (Supabase). Contactez l'administrateur.",
      };
    }

    const admin = getSupabaseAdmin();

    const roleResolved = await resolveAppRoleKey(admin, newRoleKey, {
      op: "update_user_role",
      userId,
      step: "validate_role_key",
    });
    if (!roleResolved.ok) {
      return { success: false, error: roleResolved.error };
    }

    const { error } = await admin
      .from("profiles")
      .update({ role_key: roleResolved.roleKey, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      logError("UPDATE_USER_ROLE", error, { userId, newRoleKey: roleResolved.roleKey });
      return { success: false, error: "Impossible de mettre à jour le rôle." };
    }

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Rôle modifié", new_role: roleResolved.roleKey },
    });
    return { success: true };
  } catch (e) {
    logError("UPDATE_USER_ROLE", e, { userId, newRoleKey });
    return { success: false, error: "Impossible de mettre à jour le rôle." };
  }
}

// ---------------------------------------------------------------------------
// deactivateUser — désactiver / bloquer un compte
// ---------------------------------------------------------------------------

export async function deactivateUser(
  userId: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isSuperAdmin(callerUserId))) {
    return { success: false, error: "Accès refusé." };
  }

  if (userId === callerUserId) {
    return { success: false, error: "Vous ne pouvez pas bloquer votre propre compte." };
  }

  try {
    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("profiles")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      logError("DEACTIVATE_USER", error, { userId });
      return { success: false, error: "Impossible de bloquer le compte." };
    }

    logInfo("BLOCK_USER", `User blocked: ${userId}`, { by: callerUserId });
    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Compte désactivé", op: "deactivate" },
    });
    return { success: true };
  } catch (e) {
    logError("DEACTIVATE_USER", e, { userId });
    return { success: false, error: "Impossible de bloquer le compte." };
  }
}

// ---------------------------------------------------------------------------
// reactivateUser — débloquer / réactiver un compte
// ---------------------------------------------------------------------------

export async function reactivateUser(
  userId: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!(await isSuperAdmin(callerUserId))) {
    return { success: false, error: "Accès refusé." };
  }

  try {
    const admin = getSupabaseAdmin();

    const { error } = await admin
      .from("profiles")
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      logError("REACTIVATE_USER", error, { userId });
      return { success: false, error: "Impossible de débloquer le compte." };
    }

    logInfo("UNBLOCK_USER", `User unblocked: ${userId}`, { by: callerUserId });
    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Compte réactivé", op: "reactivate" },
    });
    return { success: true };
  } catch (e) {
    logError("REACTIVATE_USER", e, { userId });
    return { success: false, error: "Impossible de débloquer le compte." };
  }
}
