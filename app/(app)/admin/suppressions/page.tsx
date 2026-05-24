import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { PageHeader } from "@/components/ui/page-header";
import { assertSuperAdminArchivesAdmin, listDeletionActivityLogs } from "@/lib/server/archives";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Suppressions — Admin",
};

export default async function AdminSuppressionsPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertSuperAdminArchivesAdmin(user.id);

  const rows = await listDeletionActivityLogs();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Suppressions"
        subtitle="Journal des suppressions enregistrées (lecture seule)."
      />
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {rows.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-gray-500">Aucune suppression enregistrée.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[#0E4A8A] text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Élément</th>
                  <th className="px-4 py-3">Supprimé par</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/80"}>
                    <td className="px-4 py-3 font-medium text-gray-900">{row.module}</td>
                    <td className="px-4 py-3 text-gray-700">{row.element}</td>
                    <td className="px-4 py-3 text-gray-700">{row.deletedBy}</td>
                    <td className="px-4 py-3 text-gray-600">{row.deletedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
