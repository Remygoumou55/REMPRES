import type { ModulePermissions } from "@/lib/server/permissions";

export function assertComplianceRead(perms: ModulePermissions): void {
  if (!perms.canRead) {
    throw new Error("compliance:forbidden");
  }
}
