import { cache } from "react";
import { normalizeRoleKey } from "@/lib/auth/roles";
import { hasSystemRootAuthority } from "@/lib/auth/system-authority";
import {
  assertMatrixModuleRead,
  assertMatrixModuleWrite,
  matrixModuleCanDelete,
  matrixModulePermissions,
} from "@/lib/server/matrix-module-access";
import { getProfileAuthBrief } from "@/lib/server/permissions";

const RH_MODULE = "rh" as const;

const RH_LEGACY_ROLE_KEYS = [
  "responsable_rh",
  "directeur_general",
  "super_admin",
  "manager",
] as const;

const rhLegacy = { legacyRoleKeys: RH_LEGACY_ROLE_KEYS };

export async function assertRhRead(userId: string): Promise<void> {
  await assertMatrixModuleRead(userId, RH_MODULE, rhLegacy);
}

export async function assertRhWrite(userId: string): Promise<void> {
  await assertMatrixModuleWrite(userId, RH_MODULE, rhLegacy);
}

export async function canRhDelete(userId: string): Promise<boolean> {
  return matrixModuleCanDelete(userId, RH_MODULE, rhLegacy);
}

export async function canRhManageLeaves(userId: string): Promise<boolean> {
  const perms = await matrixModulePermissions(userId, RH_MODULE);
  return perms.canUpdate;
}

/** Génération contrat PDF — responsable RH legacy ou super admin (1× brief profil / requête). */
export const canGenerateEmploymentContract = cache(async (userId: string): Promise<boolean> => {
  const brief = await getProfileAuthBrief(userId);
  if (!brief.ok || !brief.roleKey) return false;
  if (
    hasSystemRootAuthority({
      roleKey: brief.roleKey,
      systemAuthority: brief.systemAuthority,
    })
  ) {
    return true;
  }
  return normalizeRoleKey(brief.roleKey) === "responsable_rh";
});
