import type { Metadata } from "next";
import { redirect } from "next/navigation";
import dynamicImport from "next/dynamic";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertAdminRole } from "@/lib/server/permissions";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";
import { listUsers, type UserListItem } from "@/lib/server/users";
import { logError } from "@/lib/logger";
import { PageHeader } from "@/components/ui/page-header";

const UsersClient = dynamicImport(
  () => import("@/app/(app)/admin/users/UsersClient").then((m) => m.UsersClient),
  {
    loading: () => (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
        Chargement...
      </div>
    ),
  },
);

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Utilisateurs — Paramètres",
};

export default async function SettingsUsersPage() {
  const supabase = getSupabaseServerClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData?.user) redirect("/login");

  const userId = authData.user.id;

  let adminRoleOk = false;
  try {
    adminRoleOk = await assertAdminRole(userId);
  } catch {
    redirect("/access-denied");
  }

  if (!adminRoleOk) redirect("/access-denied");

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRole) {
    return (
      <div className="page-wrapper">
        <PageHeader title="Utilisateurs" subtitle="Centre utilisateurs ERP" />
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-900">
          <p className="font-semibold">Configuration serveur manquante</p>
          <p className="mt-1">
            La variable <code className="rounded bg-red-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> n’est pas définie.
          </p>
        </div>
      </div>
    );
  }

  try {
    getSupabaseAdminClient();
  } catch (error) {
    logError("auth", "Admin client error", { userId, error });
    redirect("/access-denied");
  }

  let users: UserListItem[] = [];
  let listErrorMessage: string | null = null;

  const listResult = await listUsers(userId);
  if (!listResult.success) {
    if (listResult.error === USERS_LIST_CONFIG_ERROR_CODE) {
      listErrorMessage =
        "Configuration serveur invalide (variables Supabase serveur incomplètes). Contactez un administrateur.";
    } else if (listResult.error === "Accès refusé.") {
      redirect("/access-denied");
    } else {
      listErrorMessage = "Impossible de charger les utilisateurs pour le moment. Réessayez plus tard.";
    }
  } else {
    users = listResult.data;
  }

  return (
    <div className="page-wrapper">
      <PageHeader title="Utilisateurs" subtitle="Gouvernance des comptes — création, suspension et réinitialisation d’accès." />
      {listErrorMessage ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {listErrorMessage}
        </div>
      ) : null}
      <UsersClient initialUsers={users} />
    </div>
  );
}
