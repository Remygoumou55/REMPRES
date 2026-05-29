import {
  assertMatrixModuleRead,
  assertMatrixModuleWrite,
  matrixModuleCanDelete,
} from "@/lib/server/matrix-module-access";

const MARKETING_MODULE = "marketing" as const;

const MARKETING_LEGACY_ROLE_KEYS = [
  "responsable_marketing",
  "directeur_general",
  "super_admin",
  "manager",
] as const;

const marketingLegacy = { legacyRoleKeys: MARKETING_LEGACY_ROLE_KEYS };

export async function assertMarketingRead(userId: string): Promise<void> {
  await assertMatrixModuleRead(userId, MARKETING_MODULE, marketingLegacy);
}

export async function assertMarketingWrite(userId: string): Promise<void> {
  await assertMatrixModuleWrite(userId, MARKETING_MODULE, marketingLegacy);
}

export async function canMarketingDelete(userId: string): Promise<boolean> {
  return matrixModuleCanDelete(userId, MARKETING_MODULE, marketingLegacy);
}
