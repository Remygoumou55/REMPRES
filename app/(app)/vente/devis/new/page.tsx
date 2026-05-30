import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { NewQuoteFormPage } from "@/components/vente/QuoteForm";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { listClients } from "@/lib/server/clients";
import { listProducts } from "@/lib/server/products";
import type { Client } from "@/types/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function clientDisplayName(client: Client): string {
  if (client.client_type === "company") {
    return client.company_name?.trim() || "Entreprise sans nom";
  }
  const full = `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
  return full || "Client sans nom";
}

export default async function NewDevisPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const [clientsResult, products] = await Promise.all([
    listClients({ page: 1, pageSize: 50 }),
    listProducts(),
  ]);

  const clients = clientsResult.data.map((c) => ({
    id: c.id,
    name: clientDisplayName(c),
    email: c.email,
    phone: c.phone,
  }));

  const productOptions = products.map((p) => ({
    id: p.id,
    name: p.name,
    unit_price_gnf: Number(p.price_gnf ?? 0),
  }));

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Nouveau devis"
        subtitle="Créer un devis commercial"
        breadcrumbs={
          <Link
            href="/vente/devis"
            className="text-xs font-medium text-primary hover:underline"
          >
            ← Retour aux devis
          </Link>
        }
      />
      <div className="card p-6">
        <NewQuoteFormPage clients={clients} products={productOptions} />
      </div>
    </div>
  );
}
