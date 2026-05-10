import type { ModulePermissions } from "@/lib/server/permissions";

export function assertObservabilityRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("observability:forbidden");
  }
}
