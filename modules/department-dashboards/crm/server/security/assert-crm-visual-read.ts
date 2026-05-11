import { getModulePermissions } from "@/lib/server/permissions";

export async function assertCrmVisualRead(userId: string): Promise<void> {
  const perms = await getModulePermissions(userId, ["vente", "crm"]);
  if (!perms.canRead) {
    throw new Error("Acces refuse au Sales & Customer Operations Center.");
  }
}
