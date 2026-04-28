import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdmin } from "@/lib/server/permissions";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";
import { listUsers, type UserListItem } from "@/lib/server/users";
import { UsersClient } from "./UsersClient";

/** Session (cookies / auth) — pas de prerender statique */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
};

export default async function AdminUsersPage() {
  const supabase = getSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) {
    redirect("/login");
  }

  const userId = authData.user.id;

  // 1 — assertSuperAdmin dans try/catch (erreurs inattendues → access-denied).
  // Pas de redirect() dans ce try : redirect() lève et ne doit pas être avalé ici.
  let superAdminOk = false;
  try {
    superAdminOk = await assertSuperAdmin(userId);
  } catch {
    redirect("/access-denied");
  }

  if (!superAdminOk) {
    redirect("/access-denied");
  }

  // 3 — clé service absente : erreur lisible, pas de 500 ni throw vers la boundary.
  // (Le client admin lèverait aussi sans cette garde.)
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRole) {
    return (
      <div className="min-h-screen bg-graylight p-4 md:p-6">
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900 shadow-sm"
        >
          <p className="font-semibold">Configuration serveur manquante</p>
          <p className="mt-1">
            La variable <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            n’est pas définie. Contactez un administrateur système.
          </p>
        </div>
      </div>
    );
  }

  // 2 — client admin (service role) : erreur inattendue → log + access-denied (pas de crash brut).
  try {
    getSupabaseAdminClient();
  } catch (error) {
    console.error("Admin client error:", error);
    redirect("/access-denied");
  }

  let users: UserListItem[] = [];
  let listErrorMessage: string | null = null;

  try {
    users = await listUsers(userId);
  } catch (error) {
    console.error("[LIST_USERS_ERROR]", error);

    if (
      error instanceof Error &&
      error.message === USERS_LIST_CONFIG_ERROR_CODE
    ) {
      listErrorMessage =
        "Configuration serveur invalide (variables Supabase serveur incomplètes). Contactez un administrateur.";
      users = [];
    } else if (
      error instanceof Error &&
      error.message === "Accès refusé."
    ) {
      redirect("/access-denied");
    } else {
      listErrorMessage =
        "Impossible de charger les utilisateurs pour le moment. Réessayez plus tard.";
      users = [];
    }
  }

  return (
    <div className="min-h-screen bg-graylight p-4 md:p-6">
      {listErrorMessage && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {listErrorMessage}
        </div>
      )}
      <UsersClient initialUsers={users} />
    </div>
  );
}
