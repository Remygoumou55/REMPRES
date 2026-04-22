import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdmin } from "@/lib/server/permissions";
import { listUsers } from "@/lib/server/users";
import { UsersClient } from "./UsersClient";

export const metadata: Metadata = { title: "Gestion des utilisateurs" };

export default async function AdminUsersPage() {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  // Accès réservé aux super_admin
  try {
    await assertSuperAdmin(data.user.id);
  } catch {
    redirect("/access-denied");
  }

  // Charger la liste des utilisateurs
  let users: Awaited<ReturnType<typeof listUsers>> = [];
  try {
    users = await listUsers(data.user.id);
  } catch {
    users = [];
  }

  return (
    <div className="min-h-screen bg-graylight p-4 md:p-6">
      <UsersClient initialUsers={users} />
    </div>
  );
}
