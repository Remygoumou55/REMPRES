import type { ModulePermissions } from "@/lib/server/permissions";

export function assertPlatformRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("platform:forbidden");
  }
}
