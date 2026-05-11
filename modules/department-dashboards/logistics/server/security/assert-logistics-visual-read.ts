import { getModulePermissions } from "@/lib/server/permissions";

export async function assertLogisticsVisualRead(userId: string): Promise<void> {
  const perms = await getModulePermissions(userId, ["logistique"]);
  if (!perms.canRead) {
    throw new Error("Acces refuse au Supply Chain Operations Center.");
  }
}
