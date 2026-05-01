import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Users } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { isAdminRole } from "@/lib/server/permissions";
import { listArchivedClients } from "@/lib/server/clients";
import { listArchivedProducts } from "@/lib/server/products";
import type { Client } from "@/types/client";
import type { Product } from "@/types/product";
import { getProfileLabelsByIds } from "@/lib/server/profile-display";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { RestoreArchiveButton } from "@/components/shared/restore-archive-button";
import { restoreClientAction } from "@/app/(app)/vente/clients/actions";
import { restoreProductAction } from "@/app/(app)/vente/produits/actions";

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
    ...products.map((p) => p.deleted_by),
  ].filter((id): id is string => Boolean(id));
  const actorLabels = await getProfileLabelsByIds(actorIds);

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

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          <Users size={16} />
          Clients archivés ({clients.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Client</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Supprimé</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Par</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Aucun client archivé.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const name = getClientDisplayName(client);
                    const by =
                      client.deleted_by && actorLabels[client.deleted_by]
                        ? actorLabels[client.deleted_by]
                        : "—";
                    return (
                      <tr key={client.id}>
                        <td className="px-4 py-2 font-medium">{name}</td>
                        <td className="px-4 py-2 text-gray-600">
                          {client.deleted_at
                            ? new Date(client.deleted_at).toLocaleString("fr-FR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "—"}
                        </td>
                        <td className="px-4 py-2 text-gray-500">{by}</td>
                        <td className="px-4 py-2 text-right">
                          <RestoreArchiveButton
                            entityId={client.id}
                            entityLabel={name}
                            restoreAction={restoreClientAction}
                            redirectPath="/admin/archives"
                            listQueryString=""
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Link href="/vente/clients/archives" className="text-xs text-primary hover:underline">
          Ouvrir la page archives clients →
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-400">
          <Package size={16} />
          Produits archivés ({products.length})
        </h2>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Produit</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">SKU</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Supprimé</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                      Aucun produit archivé.
                    </td>
                  </tr>
                ) : (
                  products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-4 py-2 font-medium">{product.name}</td>
                      <td className="px-4 py-2 font-mono text-xs text-gray-600">{product.sku}</td>
                      <td className="px-4 py-2 text-gray-600">
                        {product.deleted_at
                          ? new Date(product.deleted_at).toLocaleString("fr-FR", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                          : "—"}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <RestoreArchiveButton
                          entityId={product.id}
                          entityLabel={product.name}
                          restoreAction={restoreProductAction}
                          redirectPath="/admin/archives"
                          listQueryString=""
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <Link href="/vente/produits/archives" className="text-xs text-primary hover:underline">
          Ouvrir la page archives produits →
        </Link>
      </section>
    </div>
  );
}
