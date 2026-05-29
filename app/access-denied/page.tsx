import Link from "next/link";
import { ShieldX, Ban } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { ROLE_KEYS, effectiveAuthRoleKey } from "@/lib/auth/roles";
import { resolvePostLoginRoute } from "@/lib/navigation/home-route";

type Props = {
  searchParams?: { reason?: string };
};

export default async function AccessDeniedPage({ searchParams }: Props) {
  const isBlocked = searchParams?.reason === "blocked";

  const user = await getServerSessionUser();
  let homeHref = "/login";
  let homeLabel = "Se connecter";

  if (user) {
    const profile = await getCachedProfileRow(user.id);
    const target = resolvePostLoginRoute(profile.roleKey, profile.departmentKey);
    const isSuperAdmin = effectiveAuthRoleKey(profile.roleKey) === ROLE_KEYS.SUPER_ADMIN;
    homeHref = !isSuperAdmin && target === "/dashboard" ? "/actions" : target;
    homeLabel = "Retour à l'accueil";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-graylight p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            isBlocked ? "bg-red-50" : "bg-amber-50"
          }`}
        >
          {isBlocked ? (
            <Ban size={32} className="text-red-500" />
          ) : (
            <ShieldX size={32} className="text-amber-600" />
          )}
        </div>

        <h1 className="text-xl font-bold text-darktext">
          {isBlocked ? "Compte bloqué" : "Accès refusé"}
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          {isBlocked
            ? "Votre compte a été bloqué par un administrateur. Contactez votre responsable pour rétablir l'accès."
            : "Vous n'avez pas les permissions nécessaires pour accéder à cette page."}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          {!isBlocked ? (
            <Link
              href={homeHref}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              {homeLabel}
            </Link>
          ) : null}
          <Link
            href="/login"
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
          >
            Se connecter avec un autre compte
          </Link>
        </div>
      </div>
    </main>
  );
}
