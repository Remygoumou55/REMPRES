import type { ModulePermissions } from "@/lib/server/permissions";

export function assertAiRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("ai:forbidden");
  }
}
