import type { ModulePermissions } from "@/lib/server/permissions";

export function assertEcosystemRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("ecosystem:forbidden");
  }
}
