import { getModulePermissions } from "@/lib/server/permissions";

export async function assertFinanceVisualRead(userId: string): Promise<void> {
  const perms = await getModulePermissions(userId, ["finance"]);
  if (!perms.canRead) {
    throw new Error("Acces refuse au Finance Visual Operations Center.");
  }
}
