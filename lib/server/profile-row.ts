/**
 * Lecture profil unifiée — une requête DB par userId / rendu RSC (React cache).
 */

import { cache } from "react";
import { headers } from "next/headers";
import { getSupervisionScope } from "@/lib/auth/permissions";
import type { SupervisionScope } from "@/lib/auth/permissions";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  displayNameFromEmail,
  profileDisplayNameOrFallback,
  type ProfileShellSlice,
} from "@/lib/server/profile-display";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { logError } from "@/lib/logger";
import { readProfileHeaders } from "@/lib/middleware/profile-headers";

export type CachedProfileRow = {
  roleKey: string | null;
  departmentKey: string | null;
  departmentId: string | null;
  displayName: string;
  preferredLanguage: string | null;
  ok: boolean;
  supervisionScope: SupervisionScope;
};

function resolveDisplayName(data: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
} | null): string {
  if (!data) return "Compte";
  const fullName = profileDisplayNameOrFallback(data.first_name, data.last_name).trim();
  if (fullName) return fullName;
  return displayNameFromEmail(data.email) || "Compte";
}

export const getCachedProfileRow = cache(async (userId: string): Promise<CachedProfileRow> => {
  try {
    const headerSlice = readProfileHeaders(headers(), userId);
    if (headerSlice) {
      const displayName = resolveDisplayName({
        first_name: headerSlice.firstName,
        last_name: headerSlice.lastName,
        email: headerSlice.email,
      });
      const preferredLanguage =
        headerSlice.preferredLanguage != null
          ? String(headerSlice.preferredLanguage).trim().toLowerCase() || null
          : null;
      const roleKey = headerSlice.roleKey;
      const departmentKey = headerSlice.departmentKey;
      return {
        roleKey,
        departmentKey,
        departmentId: headerSlice.departmentId,
        displayName,
        preferredLanguage,
        ok: true,
        supervisionScope: getSupervisionScope(roleKey, departmentKey),
      };
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "role_key, department_key, department_id, first_name, last_name, email, preferred_language",
      )
      .eq("id", userId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      logError("auth", "getCachedProfileRow error", { error: error.message, userId });
      return {
        roleKey: null,
        departmentKey: null,
        departmentId: null,
        displayName: "Compte",
        preferredLanguage: null,
        ok: false,
        supervisionScope: "restricted",
      };
    }

    if (!data?.role_key || !String(data.role_key).trim()) {
      const sessionUser = await getServerSessionUser();
      const displayName = resolveDisplayName(
        data
          ? {
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email ?? sessionUser?.email ?? null,
            }
          : null,
      );
      const preferredLanguage =
        data?.preferred_language != null
          ? String(data.preferred_language).trim().toLowerCase() || null
          : null;
      return {
        roleKey: null,
        departmentKey: null,
        departmentId: null,
        displayName,
        preferredLanguage,
        ok: true,
        supervisionScope: getSupervisionScope(null, null),
      };
    }

    const roleKey = String(data.role_key).trim();
    const departmentKey =
      data.department_key != null ? String(data.department_key).trim() || null : null;
    const departmentId =
      data.department_id != null ? String(data.department_id).trim() || null : null;
    const preferredLanguage =
      data.preferred_language != null
        ? String(data.preferred_language).trim().toLowerCase() || null
        : null;

    return {
      roleKey,
      departmentKey,
      departmentId,
      displayName: resolveDisplayName(data),
      preferredLanguage,
      ok: true,
      supervisionScope: getSupervisionScope(roleKey, departmentKey),
    };
  } catch {
    return {
      roleKey: null,
      departmentKey: null,
      departmentId: null,
      displayName: "Compte",
      preferredLanguage: null,
      ok: false,
      supervisionScope: "restricted",
    };
  }
});

export async function getProfileShellSliceFromRow(userId: string): Promise<ProfileShellSlice> {
  const row = await getCachedProfileRow(userId);
  return {
    displayName: row.displayName,
    preferredLanguage: row.preferredLanguage,
  };
}
