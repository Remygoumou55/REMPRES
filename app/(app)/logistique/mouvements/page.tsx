import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeftRight, Plus } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import { listStockMovements } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { MovementTypeBadge } from "@/components/logistique/logistique-badges";
import type { MovementType } from "@/lib/types/logistique";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  searchParams?: {
    type?: string;
    dateFrom?: string;
    dateTo?: string;
    success?: string;
    error?: string;
  };
};

export default async function MouvementsPage({ searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const type =
    (["in", "out", "adjust", "transfer", "all"] as const).find(
      (t) => t === (searchParams?.type ?? "all"),
    ) ?? "all";

  const dateFrom = searchParams?.dateFrom?.trim() || undefined;
  const dateTo = searchParams?.dateTo?.trim()
    ? `${searchParams.dateTo.trim()}T23:59:59`
    : undefined;

  const { data, total } = await listStockMovements({
    type: type as MovementType | "all",
    dateFrom,
    dateTo,
    pageSize: 150,
  });

  return (
    <div className="page-wrapper">
      <PageHeader
        title="Mouvements de stock"
        subtitle={`${total} mouvement${total > 1 ? "s" : ""} enregistré${total > 1 ? "s" : ""}`}
        actions={
          <Link
            href="/logistique/mouvements/new"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            <Plus className="h-4 w-4" />
            Nouveau mouvement
          </Link>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <form method="get" className="mb-6 flex flex-wrap gap-3">
        <select name="type" defaultValue={type} className="input max-w-[180px]">
          <option value="all">Tous les types</option>
          <option value="in">Entrée</option>
          <option value="out">Sortie</option>
          <option value="adjust">Ajustement</option>
          <option value="transfer">Transfert</option>
        </select>
        <input
          type="date"
          name="dateFrom"
          defaultValue={searchParams?.dateFrom ?? ""}
          className="input max-w-[170px]"
        />
        <input
          type="date"
          name="dateTo"
          defaultValue={searchParams?.dateTo ?? ""}
          className="input max-w-[170px]"
        />
        <button type="submit" className="btn-secondary text-sm">
          Filtrer
        </button>
      </form>

      {data.length === 0 ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <ArrowLeftRight className="h-12 w-12 text-gray-300" />
          <p className="font-medium">Aucun mouvement</p>
          <p className="text-xs">
            Cliquez sur « Nouveau mouvement » pour enregistrer une entrée, sortie ou
            ajustement de stock.
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="p-3">Date</th>
                <th className="p-3">Article</th>
                <th className="p-3">Type</th>
                <th className="p-3 text-right">Quantité</th>
                <th className="p-3">Référence</th>
                <th className="p-3">Motif</th>
                <th className="p-3">Entrepôt</th>
              </tr>
            </thead>
            <tbody>
              {data.map((m) => (
                <tr key={m.id} className="border-b border-gray-100">
                  <td className="p-3 text-xs text-gray-700">
                    {new Date(m.created_at).toLocaleString("fr-FR")}
                  </td>
                  <td className="p-3">
                    {m.item ? (
                      <Link
                        href={`/logistique/articles/${m.item_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {m.item.sku ? `${m.item.sku} — ` : ""}
                        {m.item.name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Article supprimé</span>
                    )}
                  </td>
                  <td className="p-3">
                    <MovementTypeBadge type={m.type as MovementType} />
                  </td>
                  <td className="p-3 text-right tabular-nums font-medium">
                    {Number(m.quantity)} {m.item?.unit ?? ""}
                  </td>
                  <td className="p-3 font-mono text-xs">{m.reference ?? "—"}</td>
                  <td className="p-3 max-w-xs truncate" title={m.reason ?? ""}>
                    {m.reason ?? "—"}
                  </td>
                  <td className="p-3 text-xs text-gray-600">
                    {m.type === "transfer"
                      ? `${m.warehouse_from?.slice(0, 6) ?? "?"} → ${m.warehouse_to?.slice(0, 6) ?? "?"}`
                      : "—"}
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
