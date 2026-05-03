import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { listArchivedClients } from "@/lib/server/clients";
import { listArchivedProducts } from "@/lib/server/products";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import { getProfileLabelsByIds } from "@/lib/server/profile-display";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  AdminGlobalArchivesClient,
  type AdminArchiveClientRow,
  type AdminArchiveProductRow,
} from "@/components/admin/admin-global-archives-client";

export const metadata = { title: "Archives (admin)" };

type PageProps = {
  searchParams?: { success?: string; error?: string };
};

function safeDecode(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getClientDisplayName(client: Client): string {
  if (client.client_type === "company") {
    return client.company_name ?? "Entreprise";
  }
  return `${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() || "Client";
}

function formatDeletedAt(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function buildClientSearchIndex(client: Client, displayName: string): string {
  const parts = [
    displayName,
    client.email,
    client.phone,
    client.city,
    client.country,
    client.company_name,
    client.first_name,
    client.last_name,
    client.address,
    client.notes,
  ];
  return parts
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((s) => s.trim())
    .join(" ")
    .toLowerCase();
}

function buildProductSearchIndex(product: Product): string {
  return [product.name, product.sku, product.description ?? ""]
    .filter((s) => s && String(s).trim().length > 0)
    .map((s) => String(s).trim())
    .join(" ")
    .toLowerCase();
}

export default async function AdminArchivesPage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  if (!(await isAdminRole(data.user.id))) {
    redirect("/access-denied");
  }

  let clients: Client[] = [];
  let products: Product[] = [];
  try {
    const [c, p] = await Promise.all([
      listArchivedClients({ page: 1, pageSize: 50 }),
      listArchivedProducts(),
    ]);
    clients = c.data;
    products = p;
  } catch {
    clients = [];
    products = [];
  }

  const actorIds = [
    ...clients.map((c) => c.deleted_by),
    ...products.map((pr) => pr.deleted_by),
  ].filter((id): id is string => Boolean(id));
  const actorLabels = await getProfileLabelsByIds(actorIds);

  const clientRows: AdminArchiveClientRow[] = clients.map((client) => {
    const label = getClientDisplayName(client);
    return {
      id: client.id,
      label,
      deletedAtLabel: formatDeletedAt(client.deleted_at),
      deletedByLabel:
        client.deleted_by && actorLabels[client.deleted_by]
          ? actorLabels[client.deleted_by]
          : "—",
      searchIndex: buildClientSearchIndex(client, label),
    };
  });

  const productRows: AdminArchiveProductRow[] = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    deletedAtLabel: formatDeletedAt(product.deleted_at),
    deletedByLabel:
      product.deleted_by && actorLabels[product.deleted_by]
        ? actorLabels[product.deleted_by]
        : "—",
    searchIndex: buildProductSearchIndex(product),
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Archives — vue globale"
        subtitle="Super-admin : clients et produits archivés (suppression logique)."
        actions={
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-darktext hover:bg-gray-50"
          >
            ← Tableau de bord
          </Link>
        }
      />

      <FlashMessage success={safeDecode(searchParams?.success)} error={safeDecode(searchParams?.error)} />

      <AdminGlobalArchivesClient clients={clientRows} products={productRows} />
    </div>
  );
}
