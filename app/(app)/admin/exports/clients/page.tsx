import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertSuperAdminArchivesAdmin } from "@/lib/server/archives";
import { fetchExportHubClients } from "@/lib/admin/export-hub-data";
import { AdminExportHubPanel } from "@/components/admin/exports/AdminExportHubPanel";
import { ClientsExportButton } from "@/components/vente/clients/ClientsExportButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Export clients — Admin",
};

export default async function AdminExportClientsPage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await assertSuperAdminArchivesAdmin(user.id);

  const clients = await fetchExportHubClients();

  return (
    <AdminExportHubPanel
      title="Export clients (Vente)"
      description="Téléchargez la base clients active au format Excel ou PDF. Lecture seule — aucune modification depuis cet écran."
      count={clients.length}
      countLabel={`client${clients.length > 1 ? "s" : ""} actif${clients.length > 1 ? "s" : ""}`}
      exportAction={<ClientsExportButton clients={clients} />}
    />
  );
}
