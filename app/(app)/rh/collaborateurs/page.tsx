import { redirect } from "next/navigation";
import { Users } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getModulePermissions } from "@/lib/server/permissions";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";

export default async function RhCollaborateursPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const perms = await getModulePermissions(user.id, ["rh"]);
  if (!perms.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();
  const { data: employees } = await supabase
    .from("profiles")
    .select("id,first_name,last_name,email,role_key,department_key,is_active,created_at")
    .is("deleted_at", null)
    .neq("role_key", "super_admin")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="RH - Collaborateurs"
        subtitle="Annuaire collaborateurs, roles et departements"
        actions={
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            <Users className="h-4 w-4 text-primary" />
            {employees?.length ?? 0} profils
          </div>
        }
      />

      <section className="card overflow-hidden">
        {!employees?.length ? (
          <div className="p-5 text-sm text-gray-500">Aucun collaborateur disponible.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Nom</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Email</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Role</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Departement</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-600">Statut</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => {
                  const fullName =
                    [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() ||
                    employee.email ||
                    employee.id.slice(0, 8);
                  return (
                    <tr key={employee.id} className="border-b border-gray-100">
                      <td className="px-3 py-2 text-darktext">{fullName}</td>
                      <td className="px-3 py-2 text-gray-600">{employee.email || "—"}</td>
                      <td className="px-3 py-2 text-gray-700">{employee.role_key}</td>
                      <td className="px-3 py-2 text-gray-700">{employee.department_key || "—"}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            employee.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}
                        >
                          {employee.is_active ? "Actif" : "Inactif"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

