import type { ModulePermissions } from "@/lib/server/permissions";

export function assertFinanceRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("finance:forbidden");
  }
}
