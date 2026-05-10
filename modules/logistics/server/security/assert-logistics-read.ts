import type { ModulePermissions } from "@/lib/server/permissions";

export function assertLogisticsRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("logistics:forbidden");
  }
}
