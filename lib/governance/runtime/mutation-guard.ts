import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  isAdminRole,
  isAutomationOperator,
  isSuperAdmin,
} from "@/lib/server/permissions";
import {
  MutationDeniedError,
  MutationUnauthenticatedError,
} from "@/lib/governance/runtime/errors";

export type GuardedSession = {
  userId: string;
  isSuperAdmin: boolean;
  isAdminConsole: boolean;
};

export async function requireAuthenticatedSession(): Promise<GuardedSession> {
  const user = await getServerSessionUser();
  if (!user) throw new MutationUnauthenticatedError();

  const [superAdmin, adminConsole] = await Promise.all([
    isSuperAdmin(user.id),
    isAdminRole(user.id),
  ]);

  return {
    userId: user.id,
    isSuperAdmin: superAdmin,
    isAdminConsole: adminConsole,
  };
}

/** Console admin ou super admin — mutations plateforme / gouvernance. */
export async function requireAdminConsoleMutation(): Promise<GuardedSession> {
  const session = await requireAuthenticatedSession();
  if (!session.isSuperAdmin && !session.isAdminConsole) {
    throw new MutationDeniedError(
      "Accès refusé : droits console administration requis.",
    );
  }
  return session;
}

/** Opérateur automation (aligné RLS SQL). */
export async function requireAutomationMutation(): Promise<GuardedSession> {
  const session = await requireAuthenticatedSession();
  const allowed =
    session.isSuperAdmin ||
    session.isAdminConsole ||
    (await isAutomationOperator(session.userId));

  if (!allowed) {
    throw new MutationDeniedError(
      "Accès refusé : opérateur automation requis.",
    );
  }
  return session;
}

export function guardErrorMessage(err: unknown): string {
  if (err instanceof MutationUnauthenticatedError) return err.message;
  if (err instanceof MutationDeniedError) return err.message;
  if (err instanceof Error) return err.message;
  return "Opération refusée.";
}
