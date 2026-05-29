import {
  assertMatrixModuleRead,
  assertMatrixModuleWrite,
  matrixModuleCanDelete,
} from "@/lib/server/matrix-module-access";

const FORMATION_MODULES = ["formation", "consultation"] as const;

const FORMATION_LEGACY_ROLE_KEYS = [
  "responsable_formation",
  "responsable_consultation",
  "directeur_general",
  "super_admin",
] as const;

const formationLegacy = { legacyRoleKeys: FORMATION_LEGACY_ROLE_KEYS };

export async function assertFormationRead(userId: string): Promise<void> {
  await assertMatrixModuleRead(userId, FORMATION_MODULES, formationLegacy);
}

export async function assertFormationWrite(userId: string): Promise<void> {
  await assertMatrixModuleWrite(userId, FORMATION_MODULES, formationLegacy);
}

export async function canFormationDelete(userId: string): Promise<boolean> {
  return matrixModuleCanDelete(userId, FORMATION_MODULES, formationLegacy);
}
