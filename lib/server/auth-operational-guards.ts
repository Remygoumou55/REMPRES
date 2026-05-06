/**
 * Garde-fous métier : aucune mutation opérationnelle pour supervision-only ou super-admin.
 */
import { isSuperAdminOperationalBlocked } from "@/lib/auth/permissions";
import { assertNotAdministrationSupervisionOnly } from "@/lib/server/administration-supervision";
import { getUserRole } from "@/lib/server/permissions";

export async function assertOperationalMutationAllowed(userId: string): Promise<void> {
  await assertNotAdministrationSupervisionOnly(userId);
  const role = await getUserRole(userId);
  if (isSuperAdminOperationalBlocked(role)) {
    throw new Error(
      "Le super administrateur ne peut pas créer ou modifier des données opérationnelles (ventes, stocks, dépenses, etc.). Utilisez un compte métier dédié.",
    );
  }
}
