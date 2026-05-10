import type { ModulePermissions } from "@/lib/server/permissions";

export function assertAutomationRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("automation:forbidden");
  }
}
