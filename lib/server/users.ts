"use server";

import { revalidateUtilisateurs } from "@/lib/cache/revalidation-map";
import { validateInviteRoleDepartment } from "@/lib/auth/permissions";
import { hasSystemRootAuthority, SYSTEM_AUTHORITY } from "@/lib/auth/system-authority";
import { isSuperAdminRoleKey } from "@/lib/auth/roles";
import {
  assertRootMutationAllowed,
  coerceRootProfilePatch,
  RootProtectionError,
  type ProfileAuthoritySnapshot,
} from "@/lib/governance/runtime/root-protection";
import { normalizeDepartmentKey } from "@/lib/departments/department-config";
import { getSupabaseAdmin, getSupabaseAdminConfigErrorMessage } from "@/lib/supabaseAdmin";
import { isSuperAdmin } from "@/lib/server/permissions";
import { logError, logInfo, logWarning } from "@/lib/logger";
import { insertActivityLog } from "@/lib/server/insert-activity-log";
import { ok, err, type SafeResult } from "@/lib/server/safe-result";
import type { Json } from "@/types/database.types";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";
import { AUDIT_EVENT_TYPES } from "@/lib/audit/audit-events";
import { tryLogAuditEvent } from "@/lib/audit/audit-logger";
import { assertApprovalOrThrow } from "@/lib/approvals/approval-engine";

async function revalidateUsersAfterMutation() {
  await revalidateUtilisateurs();
}

async function loadProfileAuthoritySnapshot(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
): Promise<ProfileAuthoritySnapshot | null> {
  const { data, error } = await admin
    .from("profiles")
    .select("id, role_key, system_authority, is_active, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data as ProfileAuthoritySnapshot;
}

function rootProtectionErrorMessage(err: unknown): string {
  if (err instanceof RootProtectionError) return err.message;
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("ROOT_PROTECTION")) {
    return "Mutation refusée : protection du dernier compte root de la plateforme.";
  }
  return "Mutation refusée par la protection root.";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UserListItem {
  id: string;
  email: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role_key: string | null;
  role_label: string | null;
  department_key: string | null;
  is_active: boolean;
  status: "active" | "pending" | "inactive";
  invited_at: string;
  last_sign_in_at: string | null;
}

export interface InviteUserInput {
  firstName: string;
  lastName: string;
  email: string;
  roleKey: string;
  departmentKey: string | null;
}

export interface UpdateUserAdminInput {
  firstName: string;
  lastName: string;
  roleKey: string;
  departmentKey: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** True si l’URL ne doit pas être utilisée comme redirectTo dans les e-mails d’invitation. */
function isLocalOrLoopbackOrigin(url: string): boolean {
  const s = url.trim().toLowerCase();
  if (!s) return true;
  try {
    const u = new URL(s.includes("://") ? s : `https://${s}`);
    const h = u.hostname;
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
  } catch {
    return /localhost|127\.0\.0\.1|\[::1\]/.test(s);
  }
}

/**
 * URL absolue pour `inviteUserByEmail(..., { redirectTo })` — mails jamais avec localhost.
 * `?type=invite` requis par `app/auth/callback/page.tsx` pour `/auth/set-password`.
 */
function getInviteRedirectUrl(): string {
  let base =
    process.env.NEXT_PUBLIC_APP_URL?.trim()
    || process.env.NEXT_PUBLIC_SITE_URL?.trim()
    || "";

  if (!base && process.env.VERCEL_URL?.trim()) {
    const host = process.env.VERCEL_URL.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
    base = host ? `https://${host}` : "";
  }

  base = base.replace(/\/$/, "");

  const fallback = "https://rempres.com";
  if (!base || isLocalOrLoopbackOrigin(base)) {
    base = fallback;
  }

  return `${base.replace(/\/$/, "")}/auth/callback?type=invite`;
}

const INVITE_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_ROLE_KEY = "agent";

function normalizeInviteDepartmentKey(raw: string | null | undefined): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  return normalizeDepartmentKey(s);
}

/** Email d’invitation : trim + minuscules (source unique pour Auth + profiles). */
function normalizeInviteEmail(raw: unknown): string {
  return String(raw ?? "").trim().toLowerCase();
}

/**
 * Crée ou met à jour le profil après invite — idempotent, filet si le trigger DB échoue.
 * Sans ignoreDuplicates : mise à jour sur conflit `id` pour aligner nom, rôle, e-mail.
 */
async function syncProfileAfterInvite(
  admin: ReturnType<typeof getSupabaseAdmin>,
  params: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    roleKey: string;
    departmentKey: string | null;
  },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const row = {
    id: params.userId,
    email: params.email,
    first_name: params.firstName,
    last_name: params.lastName,
    role_key: params.roleKey,
    department_key: params.departmentKey,
    system_authority: isSuperAdminRoleKey(params.roleKey)
      ? SYSTEM_AUTHORITY.SUPER_ADMIN
      : SYSTEM_AUTHORITY.NONE,
    is_active: true,
    deleted_at: null as null,
  };

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const { error: upsertError } = await admin.from("profiles").upsert(row, { onConflict: "id" });

    if (upsertError) {
      logError("INVITE_USER", upsertError, {
        userId: params.userId,
        email: params.email,
        step: "profiles:upsert",
        attempt,
      });
      if (attempt === maxAttempts) {
        return {
          ok: false,
          error:
            "Le compte a été créé mais le profil n’a pas pu être enregistré. Réessayez ou contactez le support.",
        };
      }
      continue;
    }

    const { data: check, error: checkError } = await admin
      .from("profiles")
      .select("id")
      .eq("id", params.userId)
      .maybeSingle();

    if (checkError) {
      logError("INVITE_USER", checkError, {
        userId: params.userId,
        step: "profiles:verify",
        attempt,
      });
      if (attempt === maxAttempts) {
        return {
          ok: false,
          error:
            "Le compte a été créé mais la vérification du profil a échoué. Réessayez ou contactez le support.",
        };
      }
      continue;
    }

    if (check?.id) {
      return { ok: true };
    }

    logWarning("INVITE_USER", "Profil absent après upsert — nouvelle tentative", {
      userId: params.userId,
      attempt,
    });
    if (attempt === maxAttempts) {
      return {
        ok: false,
        error:
          "Le compte a été créé mais le profil est introuvable. Réessayez ou contactez le support.",
      };
    }
  }

  return { ok: false, error: "Synchronisation du profil impossible." };
}

type AppRoleKeyRow = { key: string };

const AUTH_USERS_PAGE_SIZE = 1000;
const AUTH_USERS_MAX_PAGES = 100;

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

/** True si une entrée Auth existe avec cet email (parcours paginé). */
async function authUserExistsWithEmail(
  admin: ReturnType<typeof getSupabaseAdmin>,
  emailLower: string,
): Promise<{ ok: true; exists: boolean } | { ok: false; error: string }> {
  const target = emailLower.trim().toLowerCase();
  for (let page = 1; page <= AUTH_USERS_MAX_PAGES; page += 1) {
    const { data: authData, error: authError } = await admin.auth.admin.listUsers({
      page,
      perPage: AUTH_USERS_PAGE_SIZE,
    });
    if (authError) {
      logError("INVITE_PREFLIGHT_AUTH", authError, { page, step: "listUsers_dup_scan" });
      return {
        ok: false,
        error: "Impossible de vérifier si l'utilisateur existe. Réessayez.",
      };
    }
    const batch = authData?.users ?? [];
    for (const u of batch) {
      if ((u.email ?? "").toLowerCase() === target) {
        return { ok: true, exists: true };
      }
    }
    if (batch.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }
  }
  return { ok: true, exists: false };
}

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

async function tryActivityLog(input: {
  actorUserId: string;
  moduleKey: string;
  actionKey: string;
  targetTable: string;
  targetId?: string | null;
  metadata?: Json;
}) {
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

// ---------------------------------------------------------------------------
// listUsers
// ---------------------------------------------------------------------------

export async function listUsers(
  callerUserId: string,
): Promise<SafeResult<UserListItem[]>> {
  if (!(await isSuperAdmin(callerUserId))) {
    return err("Accès refusé.");
  }

  const configMsg = getSupabaseAdminConfigErrorMessage();
  if (configMsg) {
    logError("LIST_USERS", new Error(configMsg), { step: "config:env" });
    return err(USERS_LIST_CONFIG_ERROR_CODE);
  }

  let admin: ReturnType<typeof getSupabaseAdmin>;
  try {
    admin = getSupabaseAdmin();
  } catch (e) {
    logError("LIST_USERS", e, { step: "admin:client" });
    return err(USERS_LIST_CONFIG_ERROR_CODE);
  }

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
      return err("Impossible de récupérer la liste des utilisateurs.");
    }

    const batch = (authData?.users ?? []) as AuthAdminUser[];
    authRows.push(...batch);
    if (batch.length < AUTH_USERS_PAGE_SIZE) {
      break;
    }
  }

  const [{ data: profilesRaw }, { data: rolesRaw }] = await Promise.all([
    admin
      .from("profiles")
      .select("id, first_name, last_name, role_key, department_key, is_active")
      .is("deleted_at", null),
    admin.from("app_roles").select("key, label"),
  ]);

  type ProfileRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    role_key: string;
    department_key: string | null;
    is_active: boolean;
  };
  type RoleRow = { key: string; label: string };

  const profiles = (profilesRaw ?? []) as ProfileRow[];
  const roles = (rolesRaw ?? []) as RoleRow[];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const roleMap = new Map(roles.map((r) => [r.key, r.label]));

  const items = authRows.map((user) => {
    const profile = profileMap.get(user.id);
    const roleKey = profile?.role_key ?? null;

    let status: UserListItem["status"] = "pending";
    if (user.email_confirmed_at && profile?.is_active) status = "active";
    else if (profile?.is_active === false) status = "inactive";

    return {
      id: user.id,
      email: user.email ?? "",
      full_name: profile
        ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() || null
        : null,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      role_key: roleKey,
      role_label: roleKey ? (roleMap.get(roleKey) ?? null) : null,
      department_key: profile?.department_key ?? null,
      is_active: profile?.is_active ?? true,
      status,
      invited_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at ?? null,
    };
  });

  return ok(items);
}

// ---------------------------------------------------------------------------
// inviteUser — invitation par email (zéro throw vers l’appelant)
// ---------------------------------------------------------------------------

export async function inviteUser(
  input: InviteUserInput,
  callerUserId: string,
): Promise<SafeResult<{ userId: string }>> {
  try {
    if (!(await isSuperAdmin(callerUserId))) {
      return err(
        "Accès refusé. Seul un super administrateur peut inviter des utilisateurs.",
      );
    }

    const configMsg = getSupabaseAdminConfigErrorMessage();
    if (configMsg) {
      logError("INVITE_USER", new Error(configMsg), { step: "config:env" });
      return err("Configuration serveur invalide");
    }

    const firstName = (input.firstName ?? "").trim();
    const lastName = (input.lastName ?? "").trim();
    const email = normalizeInviteEmail(input.email);
    const roleRequested = (input.roleKey ?? DEFAULT_ROLE_KEY).trim() || DEFAULT_ROLE_KEY;

    if (!firstName || !lastName) {
      return err("Tous les champs obligatoires doivent être remplis.");
    }
    if (!email || !INVITE_EMAIL_RE.test(email)) {
      return err("Adresse e-mail invalide.");
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      logError("INVITE_USER", e, { step: "admin:client" });
      return err("Configuration serveur invalide");
    }

    const { data: profileByEmail, error: profErr } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (profErr) {
      logError("INVITE_USER", profErr, { email, step: "preflight:profiles_email" });
      return err("Impossible de vérifier l’email. Réessayez.");
    }
    if (profileByEmail) {
      return err("Utilisateur déjà existant");
    }

    const authDup = await authUserExistsWithEmail(admin, email);
    if (!authDup.ok) {
      return err(authDup.error);
    }
    if (authDup.exists) {
      return err("Utilisateur déjà existant");
    }

    const roleResolved = await resolveAppRoleKey(admin, roleRequested, {
      op: "invite",
      email,
      step: "precheck:role",
    });
    if (!roleResolved.ok) {
      return err(roleResolved.error);
    }
    const roleKey = roleResolved.roleKey;

    const departmentNormalized = normalizeInviteDepartmentKey(input.departmentKey);
    const combo = validateInviteRoleDepartment(roleKey, departmentNormalized);
    if (!combo.ok) {
      return err(combo.error);
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: {
        role_key: roleKey,
        first_name: firstName,
        last_name: lastName,
        department_key: departmentNormalized,
      },
      redirectTo: getInviteRedirectUrl(),
    });

    if (error) {
      if (isAuthDuplicateMessage(error.message)) {
        return err("Utilisateur déjà existant");
      }
      logError("INVITE_USER", error, {
        email,
        role: roleKey,
        step: "auth:inviteUserByEmail",
        code: (error as { code?: string }).code,
      });
      return err(
        error.message?.trim()
          ? `Invitation impossible : ${error.message}`
          : "L’invitation n’a pas pu être envoyée. Vérifiez l’email ou réessayez.",
      );
    }

    if (!data?.user?.id) {
      logError("INVITE_USER", new Error("Missing data.user from inviteUserByEmail"), {
        email,
        step: "auth:empty_user",
      });
      return err("L’invitation n’a pas pu être finalisée. Réessayez.");
    }

    const userId = data.user.id;

    const syncResult = await syncProfileAfterInvite(admin, {
      userId,
      email,
      firstName,
      lastName,
      roleKey,
      departmentKey: departmentNormalized,
    });

    if (!syncResult.ok) {
      logError("INVITE_USER", new Error(syncResult.error), {
        userId,
        email,
        step: "profiles:sync_final",
      });
      return err(syncResult.error);
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
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.USER_INVITED,
      severity: "high",
      target: { table: "profiles", id: userId },
      context: { actorUserId: callerUserId, actorRole: "super_admin" },
      details: { email, role_key: roleKey, department_key: departmentNormalized },
      approval: { required: false, status: "not_required", policy: "soft_auto" },
    });

    await revalidateUsersAfterMutation();
    return ok({ userId });
  } catch (e) {
    logError("INVITE_USER", e, { email: normalizeInviteEmail(input?.email), step: "catch:top" });
    return err("Une erreur inattendue s’est produite. Réessayez.");
  }
}

// ---------------------------------------------------------------------------
// resendInvite
// ---------------------------------------------------------------------------

export async function resendInvite(
  userId: string,
  callerUserId: string,
): Promise<SafeResult<null>> {
  if (!(await isSuperAdmin(callerUserId))) {
    return err("Accès refusé.");
  }

  try {
    const cfg = getSupabaseAdminConfigErrorMessage();
    if (cfg) {
      logError("RESEND_INVITE", new Error(cfg), { userId, step: "config" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      logError("RESEND_INVITE", e, { userId, step: "admin:client" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    const { data: userData, error: fetchError } = await admin.auth.admin.getUserById(userId);
    if (fetchError || !userData.user.email) {
      return err("Utilisateur introuvable.");
    }

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
        role_key: profile?.role_key ?? "agent",
        first_name: profile?.first_name ?? "",
        last_name: profile?.last_name ?? "",
        department_key: profile?.department_key ?? null,
      },
      redirectTo: getInviteRedirectUrl(),
    });

    if (error) {
      logError("RESEND_INVITE", error, { userId });
      if (isAuthDuplicateMessage(error.message)) {
        return err("Utilisateur déjà existant");
      }
      return err(
        error.message?.trim()
          ? `Impossible de renvoyer l’invitation : ${error.message}`
          : "Impossible de renvoyer l’invitation.",
      );
    }

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Invitation renvoyée" },
    });
    await revalidateUsersAfterMutation();
    return ok(null);
  } catch (e) {
    logError("RESEND_INVITE", e, { userId });
    return err("Impossible de renvoyer l’invitation. Réessayez.");
  }
}

// ---------------------------------------------------------------------------
// updateUserRole
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  newRoleKey: string,
  callerUserId: string,
): Promise<SafeResult<null>> {
  if (!(await isSuperAdmin(callerUserId))) {
    return err("Accès refusé.");
  }

  try {
    const cfg = getSupabaseAdminConfigErrorMessage();
    if (cfg) {
      logError("UPDATE_USER_ROLE", new Error(cfg), { userId, step: "config" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      logError("UPDATE_USER_ROLE", e, { userId, step: "admin:client" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    const roleResolved = await resolveAppRoleKey(admin, newRoleKey, {
      op: "update_user_role",
      userId,
      step: "validate_role_key",
    });
    if (!roleResolved.ok) {
      return err(roleResolved.error);
    }
    const approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGED,
      actorUserId: callerUserId,
      actorRole: "super_admin",
      metadata: { targetUserId: userId, newRole: roleResolved.roleKey },
    });

    const before = await loadProfileAuthoritySnapshot(admin, userId);
    if (!before) return err("Utilisateur introuvable.");

    try {
      await assertRootMutationAllowed(admin, before, {
        targetUserId: userId,
        nextRoleKey: roleResolved.roleKey,
        nextDepartmentKey: null,
      });
    } catch (e) {
      return err(rootProtectionErrorMessage(e));
    }

    const patch = coerceRootProfilePatch({
      role_key: roleResolved.roleKey,
      department_key: null,
    });

    const { error } = await admin
      .from("profiles")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) {
      logError("UPDATE_USER_ROLE", error, { userId, newRoleKey: roleResolved.roleKey });
      return err("Impossible de mettre à jour le rôle.");
    }

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Rôle modifié", new_role: roleResolved.roleKey },
    });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGED,
      severity: "critical",
      target: { table: "profiles", id: userId },
      context: { actorUserId: callerUserId, actorRole: "super_admin" },
      details: { new_role: roleResolved.roleKey },
      approval: { required: approval.required, status: "granted", policy: approval.policy },
    });
    await revalidateUsersAfterMutation();
    return ok(null);
  } catch (e) {
    logError("UPDATE_USER_ROLE", e, { userId, newRoleKey });
    return err("Impossible de mettre à jour le rôle.");
  }
}

// ---------------------------------------------------------------------------
// deactivateUser
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
    const before = await loadProfileAuthoritySnapshot(admin, userId);
    if (!before) {
      return { success: false, error: "Utilisateur introuvable." };
    }

    try {
      await assertRootMutationAllowed(admin, before, {
        targetUserId: userId,
        nextRoleKey: before.role_key ?? "agent",
        nextDepartmentKey: null,
        nextIsActive: false,
      });
    } catch (e) {
      return { success: false, error: rootProtectionErrorMessage(e) };
    }

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
    await revalidateUsersAfterMutation();
    return { success: true };
  } catch (e) {
    logError("DEACTIVATE_USER", e, { userId });
    return { success: false, error: "Impossible de bloquer le compte." };
  }
}

// ---------------------------------------------------------------------------
// reactivateUser
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
    await revalidateUsersAfterMutation();
    return { success: true };
  } catch (e) {
    logError("REACTIVATE_USER", e, { userId });
    return { success: false, error: "Impossible de débloquer le compte." };
  }
}

// ---------------------------------------------------------------------------
// updateUserAdmin
// ---------------------------------------------------------------------------

export async function updateUserAdmin(
  userId: string,
  input: UpdateUserAdminInput,
  callerUserId: string,
): Promise<SafeResult<null>> {
  if (!(await isSuperAdmin(callerUserId))) {
    return err("Accès refusé.");
  }

  try {
    const cfg = getSupabaseAdminConfigErrorMessage();
    if (cfg) {
      logError("UPDATE_USER_ADMIN", new Error(cfg), { userId, step: "config" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      logError("UPDATE_USER_ADMIN", e, { userId, step: "admin:client" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    const firstName = (input.firstName ?? "").trim();
    const lastName = (input.lastName ?? "").trim();
    if (!firstName || !lastName) {
      return err("Le prénom et le nom sont obligatoires.");
    }

    const roleResolved = await resolveAppRoleKey(admin, input.roleKey, {
      op: "update_user_admin",
      userId,
      step: "validate_role_key",
    });
    if (!roleResolved.ok) return err(roleResolved.error);

    const departmentNormalized = normalizeInviteDepartmentKey(input.departmentKey);
    const combo = validateInviteRoleDepartment(roleResolved.roleKey, departmentNormalized);
    if (!combo.ok) {
      return err(combo.error);
    }

    const before = await loadProfileAuthoritySnapshot(admin, userId);
    if (!before) return err("Utilisateur introuvable.");

    const nextSystemAuthority =
      isSuperAdminRoleKey(roleResolved.roleKey) ||
      hasSystemRootAuthority({
        roleKey: before.role_key,
        systemAuthority: before.system_authority,
      })
        ? SYSTEM_AUTHORITY.SUPER_ADMIN
        : before.system_authority ?? SYSTEM_AUTHORITY.NONE;

    try {
      await assertRootMutationAllowed(admin, before, {
        targetUserId: userId,
        nextRoleKey: roleResolved.roleKey,
        nextDepartmentKey: departmentNormalized,
        nextSystemAuthority,
      });
    } catch (e) {
      return err(rootProtectionErrorMessage(e));
    }

    const patch = coerceRootProfilePatch({
      role_key: roleResolved.roleKey,
      department_key: departmentNormalized,
      system_authority: nextSystemAuthority,
    });

    const { error } = await admin
      .from("profiles")
      .update({
        first_name: firstName,
        last_name: lastName,
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .is("deleted_at", null);

    if (error) {
      logError("UPDATE_USER_ADMIN", error, { userId });
      return err("Impossible de modifier l'utilisateur.");
    }

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "update",
      targetTable: "profiles",
      targetId: userId,
      metadata: {
        summary: "Utilisateur modifié",
        role_key: roleResolved.roleKey,
        department_key: departmentNormalized,
      },
    });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.USER_ROLE_CHANGED,
      severity: "high",
      target: { table: "profiles", id: userId },
      context: { actorUserId: callerUserId, actorRole: "super_admin" },
      details: {
        operation: "update_user_admin",
        role_key: roleResolved.roleKey,
        department_key: departmentNormalized,
      },
      approval: { required: false, status: "not_required", policy: "soft_auto" },
    });

    await revalidateUsersAfterMutation();
    return ok(null);
  } catch (e) {
    logError("UPDATE_USER_ADMIN", e, { userId });
    return err("Impossible de modifier l'utilisateur.");
  }
}

// ---------------------------------------------------------------------------
// deleteUserAdmin
// ---------------------------------------------------------------------------

export async function deleteUserAdmin(
  userId: string,
  callerUserId: string,
): Promise<SafeResult<null>> {
  if (!(await isSuperAdmin(callerUserId))) {
    return err("Accès refusé.");
  }
  if (userId === callerUserId) {
    return err("Vous ne pouvez pas supprimer votre propre compte.");
  }

  try {
    const cfg = getSupabaseAdminConfigErrorMessage();
    if (cfg) {
      logError("DELETE_USER_ADMIN", new Error(cfg), { userId, step: "config" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    let admin: ReturnType<typeof getSupabaseAdmin>;
    try {
      admin = getSupabaseAdmin();
    } catch (e) {
      logError("DELETE_USER_ADMIN", e, { userId, step: "admin:client" });
      return err("Configuration serveur incomplète. Contactez l’administrateur.");
    }

    const approval = await assertApprovalOrThrow({
      eventType: AUDIT_EVENT_TYPES.BULK_OPERATION,
      actorUserId: callerUserId,
      actorRole: "super_admin",
      metadata: { operation: "delete_user_admin", targetUserId: userId },
    });

    const { error: authErr } = await admin.auth.admin.deleteUser(userId);
    if (authErr) {
      logError("DELETE_USER_ADMIN", authErr, { userId, step: "auth.deleteUser" });
      return err("Impossible de supprimer l'utilisateur.");
    }

    await admin
      .from("profiles")
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    await tryActivityLog({
      actorUserId: callerUserId,
      moduleKey: "utilisateurs",
      actionKey: "delete",
      targetTable: "profiles",
      targetId: userId,
      metadata: { summary: "Utilisateur supprimé" },
    });
    await tryLogAuditEvent({
      eventType: AUDIT_EVENT_TYPES.BULK_OPERATION,
      severity: "critical",
      target: { table: "profiles", id: userId },
      context: { actorUserId: callerUserId, actorRole: "super_admin" },
      details: { operation: "delete_user_admin" },
      approval: { required: approval.required, status: "granted", policy: approval.policy },
    });

    await revalidateUsersAfterMutation();
    return ok(null);
  } catch (e) {
    logError("DELETE_USER_ADMIN", e, { userId });
    return err("Impossible de supprimer l'utilisateur.");
  }
}
