import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertConsultationRead } from "@/lib/server/consultation-access";
import { listUniqueConsultationClients } from "@/lib/server/consultation";
import { PageHeader } from "@/components/ui/page-header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ConsultationClientsPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertConsultationRead(user.id);

  const clients = await listUniqueConsultationClients();

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Clients consultation"
        subtitle={`${clients.length} client(s) issu(s) des missions`}
        actions={
          <Link
            href="/vente/clients?type=company"
            className="btn-secondary text-sm"
          >
            Voir clients vente
          </Link>
        }
      />

      {clients.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Building2 className="h-12 w-12 text-gray-300" />
          <p>Aucun client renseigné sur les missions.</p>
          <Link href="/consultation/missions/new" className="text-sm text-primary">
            Créer une mission
          </Link>
        </section>
      ) : (
        <ul className="card divide-y divide-gray-100">
          {clients.map((name) => (
            <li key={name} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{name}</span>
              <Link
                href={`/consultation/missions?q=${encodeURIComponent(name)}`}
                className="text-xs text-primary"
              >
                Voir missions
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
