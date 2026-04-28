import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isSuperAdmin } from "@/lib/server/permissions";
import { USERS_LIST_CONFIG_ERROR_CODE } from "@/lib/server/users-errors";
import { listUsers, type UserListItem } from "@/lib/server/users";
import { UsersClient } from "./UsersClient";

/** ⚠️ Important : page dynamique (cookies/auth) */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestion des utilisateurs",
};

export default async function AdminUsersPage() {
  const supabase = getSupabaseServerClient();

  // 🔐 AUTH USER
  let userId: string;

  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      redirect("/login");
    }

    userId = data.user.id;
  } catch (error) {
    console.error("[AUTH_ERROR]", error);
    redirect("/login");
  }

  // 🔐 CHECK ADMIN
  try {
    const isAdmin = await isSuperAdmin(userId);

    if (!isAdmin) {
      redirect("/access-denied");
    }
  } catch (error) {
    console.error("[ADMIN_CHECK_ERROR]", error);
    redirect("/access-denied");
  }

  // 📊 LOAD USERS (ULTRA SAFE)
  let users: UserListItem[] = [];
  let listErrorMessage: string | null = null;

  try {
    users = await listUsers(userId);
  } catch (error) {
    console.error("[LIST_USERS_ERROR]", error);

    users = [];

    if (
      error instanceof Error &&
      error.message === USERS_LIST_CONFIG_ERROR_CODE
    ) {
      listErrorMessage =
        "Configuration serveur invalide (clé Supabase manquante).";
    } else {
      listErrorMessage =
        "Impossible de charger les utilisateurs pour le moment.";
    }
  }

  // ✅ RENDER SAFE
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