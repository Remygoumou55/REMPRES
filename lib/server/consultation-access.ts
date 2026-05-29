import {
  assertMatrixModuleRead,
  assertMatrixModuleWrite,
  matrixModuleCanDelete,
} from "@/lib/server/matrix-module-access";

const CONSULTATION_MODULES = ["consultation", "formation"] as const;

const CONSULTATION_LEGACY_ROLE_KEYS = [
  "responsable_consultation",
  "responsable_formation",
  "directeur_general",
  "super_admin",
] as const;

const consultationLegacy = { legacyRoleKeys: CONSULTATION_LEGACY_ROLE_KEYS };

export async function assertConsultationRead(userId: string): Promise<void> {
  await assertMatrixModuleRead(userId, CONSULTATION_MODULES, consultationLegacy);
}

export async function assertConsultationWrite(userId: string): Promise<void> {
  await assertMatrixModuleWrite(userId, CONSULTATION_MODULES, consultationLegacy);
}

export async function canConsultationDelete(userId: string): Promise<boolean> {
  return matrixModuleCanDelete(userId, CONSULTATION_MODULES, consultationLegacy);
}
