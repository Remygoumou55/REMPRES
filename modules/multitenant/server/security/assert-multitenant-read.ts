import type { ModulePermissions } from "@/lib/server/permissions";

export function assertMultitenantRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("multitenant:forbidden");
  }
}
