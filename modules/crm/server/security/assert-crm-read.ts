import type { ModulePermissions } from "@/lib/server/permissions";

export function assertCrmRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("crm:forbidden");
  }
}
