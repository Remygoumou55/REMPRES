/**
 * P7 — Sécurité runtime RH (read-first ; writes = gate P7.1+).
 */

import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";
import { getModulePermissions } from "@/lib/server/permissions";

export type HrRuntimePermission = "read" | "create" | "update" | "delete";

export async function assertHrRuntimeReadAccess(
  userId: string,
  permission: HrRuntimePermission = "read",
): Promise<void> {
  const perms = await getModulePermissions(userId, ["rh"]);
  const action =
    permission === "read"
      ? perms.canRead
      : permission === "create"
        ? perms.canCreate
        : permission === "update"
          ? perms.canUpdate
          : perms.canDelete;
  if (!action) {
    throw new Error(`hr:runtime_read_denied:${permission}`);
  }
}

export async function assertHrRuntimeWriteAccess(
  userId: string,
  permission: Exclude<HrRuntimePermission, "read"> = "update",
): Promise<void> {
  await assertHrRuntimeReadAccess(userId, permission);
}

export const HR_SENSITIVE_FIELDS = [
  "salary",
  "iban",
  "social_security",
  "medical",
  "disciplinary",
] as const;

export const HR_RUNTIME_SECURITY_BOUNDARIES = {
  departmentKeyCanonical: DEPARTMENT_KEYS.RH,
  sensitivePayloadForbiddenOnBus: HR_SENSITIVE_FIELDS,
  busPayloadPolicy: "ids, status, dates, types only — no payroll amounts P7",
} as const;
