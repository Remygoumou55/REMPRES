import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { DevisPageClient } from "@/components/vente/DevisPageClient";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { listClients } from "@/lib/server/clients";
import { listProducts } from "@/lib/server/products";
import { listQuotes } from "@/lib/server/quotes";
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

export default async function DevisPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const [result, clientsResult, products] = await Promise.all([
    listQuotes(),
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
        title="Devis commerciaux"
        subtitle="Créez et suivez vos devis clients"
      />
      <DevisPageClient
        quotes={result.data}
        clients={clients}
        products={productOptions}
        stats={result.stats}
      />
    </div>
  );
}
