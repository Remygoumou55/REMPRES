import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  ArrowLeftRight,
  Edit,
  FileText,
  Package,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  assertLogistiqueRead,
  canLogistiqueDelete,
} from "@/lib/server/logistique-access";
import {
  getStockItemById,
  listStockMovements,
} from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  MovementTypeBadge,
  StockStatusBadge,
} from "@/components/logistique/logistique-badges";
import { computeStockStatus, type MovementType } from "@/lib/types/logistique";
import { deleteStockItemAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { tab?: string; success?: string; error?: string };
};

const VALID_TABS = new Set(["details", "mouvements", "reapprov"]);

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function ArticleDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const [item, canDelete] = await Promise.all([
    getStockItemById(params.id),
    canLogistiqueDelete(user.id),
  ]);
  if (!item) notFound();

  const tab = VALID_TABS.has(searchParams?.tab ?? "") ? searchParams!.tab! : "details";

  const movementsResult =
    tab === "mouvements" || tab === "details"
      ? await listStockMovements({ itemId: item.id, pageSize: 50 })
      : { data: [], total: 0 };

  const status = computeStockStatus(item);

  return (
    <div className="page-wrapper">
      <PageHeader
        title={item.name}
        subtitle={`${item.sku ? `SKU ${item.sku} · ` : ""}${item.category ?? "Sans catégorie"}`}
        breadcrumbs={
          <Link
            href="/logistique/articles"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux articles
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StockStatusBadge status={status} />
            <Link
              href={`/logistique/articles/${item.id}/edit`}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            {canDelete ? (
              <form action={deleteStockItemAction.bind(null, item.id)}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </button>
              </form>
            ) : null}
          </div>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <div className="mb-6 grid gap-3 sm:grid-cols-4">
        <StatCard label="Quantité actuelle" value={`${Number(item.quantity)} ${item.unit}`} />
        <StatCard label="Seuil min" value={`${Number(item.min_quantity)} ${item.unit}`} />
        <StatCard label="Prix unitaire" value={formatGNF(Number(item.unit_price_gnf))} />
        <StatCard
          label="Valeur stock"
          value={formatGNF(Number(item.quantity) * Number(item.unit_price_gnf))}
        />
      </div>

      <nav className="mb-6 flex flex-wrap border-b border-gray-200">
        {[
          { id: "details", label: "Détails", icon: FileText },
          { id: "mouvements", label: "Mouvements", icon: ArrowLeftRight },
          { id: "reapprov", label: "Réapprovisionnement", icon: ShoppingCart },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Link
              key={t.id}
              href={`/logistique/articles/${item.id}?tab=${t.id}`}
              className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-500 hover:text-darktext"
              }`}
            >
              <Icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === "details" ? (
        <section className="card grid gap-4 p-6 md:grid-cols-2">
          <InfoField label="Nom" value={item.name} />
          <InfoField label="SKU" value={item.sku ?? "—"} />
          <InfoField label="Catégorie" value={item.category ?? "—"} />
          <InfoField label="Unité" value={item.unit} />
          <InfoField label="Quantité" value={`${Number(item.quantity)} ${item.unit}`} />
          <InfoField
            label="Seuil minimum"
            value={`${Number(item.min_quantity)} ${item.unit}`}
          />
          <InfoField label="Prix unitaire" value={formatGNF(Number(item.unit_price_gnf))} />
          <InfoField label="Statut" value={<StockStatusBadge status={status} />} />
          <InfoField
            label="Entrepôt"
            value={
              item.warehouse
                ? `${item.warehouse.label} (${item.warehouse.code})`
                : "—"
            }
          />
          <InfoField
            label="Description"
            value={item.description ?? "—"}
            className="md:col-span-2"
          />
        </section>
      ) : null}

      {tab === "mouvements" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-darktext">
              Historique des mouvements
            </h2>
            <Link
              href={`/logistique/mouvements/new?itemId=${item.id}`}
              className="btn-primary text-sm"
            >
              Nouveau mouvement
            </Link>
          </div>
          {movementsResult.data.length === 0 ? (
            <p className="card p-6 text-sm text-gray-500">
              Aucun mouvement enregistré pour cet article.
            </p>
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="p-3">Date</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Quantité</th>
                    <th className="p-3">Référence</th>
                    <th className="p-3">Motif</th>
                  </tr>
                </thead>
                <tbody>
                  {movementsResult.data.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100">
                      <td className="p-3 text-xs text-gray-700">
                        {new Date(m.created_at).toLocaleString("fr-FR")}
                      </td>
                      <td className="p-3">
                        <MovementTypeBadge type={m.type as MovementType} />
                      </td>
                      <td className="p-3 text-right tabular-nums font-medium">
                        {Number(m.quantity)} {item.unit}
                      </td>
                      <td className="p-3 font-mono text-xs">{m.reference ?? "—"}</td>
                      <td className="p-3 max-w-xs truncate" title={m.reason ?? ""}>
                        {m.reason ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === "reapprov" ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center">
          <Package className="h-12 w-12 text-gray-300" />
          <h3 className="text-base font-semibold text-darktext">
            Réapprovisionner cet article
          </h3>
          <p className="max-w-md text-sm text-gray-500">
            Créez une nouvelle commande d&apos;achat pour réapprovisionner{" "}
            <span className="font-medium text-darktext">{item.name}</span>. La
            commande sera transmise au Super Admin pour approbation.
          </p>
          <Link href="/logistique/achats/new" className="btn-primary mt-2">
            Créer une commande d&apos;achat
          </Link>
        </section>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-darktext">{value}</div>
    </div>
  );
}

function InfoField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className="mt-1 text-sm text-darktext">{value}</div>
    </div>
  );
}
