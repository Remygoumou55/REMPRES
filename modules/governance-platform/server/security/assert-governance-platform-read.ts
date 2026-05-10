import type { ModulePermissions } from "@/lib/server/permissions";

export function assertGovernancePlatformRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("governance_platform:forbidden");
  }
}
