import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, Edit, Eye, Package, Plus, Trash2 } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import { listStockItems, listStockItemCategories } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { StockStatusBadge } from "@/components/logistique/logistique-badges";
import { computeStockStatus } from "@/lib/types/logistique";
import { deleteStockItemAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    q?: string;
    category?: string;
    status?: string;
    success?: string;
    error?: string;
  };
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function ArticlesPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const status =
    (["normal", "low", "out", "all"] as const).find(
      (s) => s === (searchParams?.status ?? "all"),
    ) ?? "all";

  const [{ data, total, lowCount, outCount, totalValue }, categories] = await Promise.all([
    listStockItems({
      search: searchParams?.q,
      category: searchParams?.category ?? "all",
      status,
    }),
    listStockItemCategories(),
  ]);

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Articles en stock"
        subtitle={`${total} article${total > 1 ? "s" : ""}`}
        actions={
          <Link
            href="/logistique/articles/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Ajouter un article
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="grid gap-3 sm:grid-cols-4">
        <SummaryCard label="Total articles" value={total} tone="blue" />
        <SummaryCard label="Stock bas" value={lowCount} tone="amber" />
        <SummaryCard label="Rupture" value={outCount} tone="red" />
        <SummaryCard
          label="Valeur totale"
          value={formatGNF(totalValue)}
          tone="emerald"
        />
      </div>

      <form method="get" className="my-6 flex flex-wrap gap-3">
        <input
          type="search"
          name="q"
          defaultValue={searchParams?.q ?? ""}
          placeholder="Rechercher par nom, SKU, catégorie…"
          className="input max-w-xs"
        />
        <select
          name="category"
          defaultValue={searchParams?.category ?? "all"}
          className="input max-w-[200px]"
        >
          <option value="all">Toutes les catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={status}
          className="input max-w-[160px]"
        >
          <option value="all">Tous les statuts</option>
          <option value="normal">En stock</option>
          <option value="low">Stock bas</option>
          <option value="out">Rupture</option>
        </select>
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <Package className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun article en stock</p>
          <p className="text-xs">
            Cliquez sur « Ajouter un article » pour créer votre premier article.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">SKU</th>
                <th className="p-3">Nom</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Unité</th>
                <th className="p-3 text-right">Quantité</th>
                <th className="p-3 text-right">Seuil min</th>
                <th className="p-3 text-right">Prix unitaire</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((it) => (
                <tr key={it.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3 font-mono text-xs">{it.sku ?? "—"}</td>
                  <td className="p-3 font-medium">{it.name}</td>
                  <td className="p-3">{it.category ?? "—"}</td>
                  <td className="p-3">{it.unit}</td>
                  <td className="p-3 text-right tabular-nums font-semibold">
                    {Number(it.quantity)}
                  </td>
                  <td className="p-3 text-right tabular-nums text-gray-600">
                    {Number(it.min_quantity)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {formatGNF(Number(it.unit_price_gnf))}
                  </td>
                  <td className="p-3">
                    <StockStatusBadge status={computeStockStatus(it)} />
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <Link
                        href={`/logistique/articles/${it.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary"
                      >
                        <Eye className="h-3.5 w-3.5" /> Voir
                      </Link>
                      <Link
                        href={`/logistique/articles/${it.id}/edit`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-600"
                      >
                        <Edit className="h-3.5 w-3.5" /> Modifier
                      </Link>
                      <Link
                        href={`/logistique/mouvements/new?itemId=${it.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-600"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Mouvement
                      </Link>
                      <form action={deleteStockItemAction.bind(null, it.id)}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 text-xs font-medium text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Supprimer
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "blue" | "amber" | "red" | "emerald";
}) {
  const tones: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
