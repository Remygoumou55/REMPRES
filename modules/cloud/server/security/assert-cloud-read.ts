import type { ModulePermissions } from "@/lib/server/permissions";

export function assertCloudRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("cloud:forbidden");
  }
}
