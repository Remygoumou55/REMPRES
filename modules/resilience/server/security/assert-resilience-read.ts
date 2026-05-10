import type { ModulePermissions } from "@/lib/server/permissions";

export function assertResilienceRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("resilience:forbidden");
  }
}
