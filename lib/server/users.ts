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

import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { assertSuperAdmin } from "@/lib/server/permissions";
import { logError, logInfo } from "@/lib/logger";
import { appConfig } from "@/lib/config";

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

// ---------------------------------------------------------------------------
// listUsers — liste tous les utilisateurs (admin uniquement)
// ---------------------------------------------------------------------------

export async function listUsers(callerUserId: string): Promise<UserListItem[]> {
  await assertSuperAdmin(callerUserId);

  const admin = getSupabaseAdminClient();

  // Utiliser l'Admin API pour lister les utilisateurs auth
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) {
    logError("LIST_USERS", authError);
    throw new Error("Impossible de récupérer la liste des utilisateurs.");
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

  return authData.users.map((user) => {
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
// ---------------------------------------------------------------------------

export async function inviteUser(
  input: InviteUserInput,
  callerUserId: string,
): Promise<{ success: true; userId: string } | { success: false; error: string }> {
  try {
    await assertSuperAdmin(callerUserId);
  } catch {
    return { success: false, error: "Accès refusé. Seul un super administrateur peut inviter des utilisateurs." };
  }

  const admin = getSupabaseAdminClient();

  // Vérifier que l'email n'est pas déjà utilisé
  const { data: existing } = await admin.auth.admin.listUsers();
  const alreadyExists = existing?.users.some(
    (u) => u.email?.toLowerCase() === input.email.toLowerCase(),
  );
  if (alreadyExists) {
    return { success: false, error: "Un compte avec cet email existe déjà." };
  }

  // Inviter via Supabase Auth
  // Le trigger handle_new_user_invite() crée automatiquement le profil
  const { data, error } = await admin.auth.admin.inviteUserByEmail(input.email, {
    data: {
      role_key:       input.roleKey,
      first_name:     input.firstName,
      last_name:      input.lastName,
      department_key: input.departmentKey ?? null,
    },
    redirectTo: getRedirectUrl(),
  });

  if (error) {
    logError("INVITE_USER", error, { email: input.email, role: input.roleKey });
    return { success: false, error: "L'invitation n'a pas pu être envoyée. Vérifiez l'email et réessayez." };
  }

  logInfo("INVITE_USER", `User invited: ${input.email}`, { role: input.roleKey });
  return { success: true, userId: data.user.id };
}

// ---------------------------------------------------------------------------
// resendInvite — renvoyer l'email d'invitation
// ---------------------------------------------------------------------------

export async function resendInvite(
  userId: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin(callerUserId);
  } catch {
    return { success: false, error: "Accès refusé." };
  }

  const admin = getSupabaseAdminClient();

  // Récupérer l'email de l'utilisateur
  const { data: userData, error: fetchError } = await admin.auth.admin.getUserById(userId);
  if (fetchError || !userData.user.email) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  // Récupérer le profil pour les métadonnées
  const { data: profile } = await admin
    .from("profiles")
    .select("role_key, first_name, last_name, department_key")
    .eq("id", userId)
    .single();

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

  return { success: true };
}

// ---------------------------------------------------------------------------
// updateUserRole — changer le rôle d'un utilisateur
// ---------------------------------------------------------------------------

export async function updateUserRole(
  userId: string,
  newRoleKey: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin(callerUserId);
  } catch {
    return { success: false, error: "Accès refusé." };
  }

  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ role_key: newRoleKey, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    logError("UPDATE_USER_ROLE", error, { userId, newRoleKey });
    return { success: false, error: "Impossible de mettre à jour le rôle." };
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// deactivateUser — désactiver un compte
// ---------------------------------------------------------------------------

export async function deactivateUser(
  userId: string,
  callerUserId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await assertSuperAdmin(callerUserId);
  } catch {
    return { success: false, error: "Accès refusé." };
  }

  // Ne pas se désactiver soi-même
  if (userId === callerUserId) {
    return { success: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  const admin = getSupabaseAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    logError("DEACTIVATE_USER", error, { userId });
    return { success: false, error: "Impossible de désactiver le compte." };
  }

  return { success: true };
}
