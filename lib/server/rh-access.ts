import {
  assertMatrixModuleRead,
  assertMatrixModuleWrite,
  matrixModuleCanDelete,
  matrixModulePermissions,
} from "@/lib/server/matrix-module-access";

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
