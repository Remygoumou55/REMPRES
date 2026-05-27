import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle, Package, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import { getLowStockItems } from "@/lib/server/logistique";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatGNF(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function LogistiqueAlertesPage() {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const lowStockItems = await getLowStockItems();
  const allOk = lowStockItems.length === 0;

  return (
    <div className="page-wrapper space-y-6">
      <PageHeader
        title="Alertes stock bas"
        subtitle="Articles sous le seuil minimum"
        breadcrumbs={
          <Link
            href="/logistique/articles"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            ← Articles
          </Link>
        }
        actions={
          !allOk ? (
            <Link
              href="/logistique/commandes"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
            >
              <ShoppingCart className="h-4 w-4" />
              Nouvelle commande
            </Link>
          ) : null
        }
      />

      {/* Summary banner */}
      {allOk ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-800">
            ✓ Tous les stocks sont conformes — Aucun article sous le seuil minimum.
          </p>
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {lowStockItems.length} article{lowStockItems.length > 1 ? "s" : ""} sous le seuil minimum
            </p>
            <p className="mt-0.5 text-xs text-red-700">
              Action requise : réapprovisionner ou créer une commande fournisseur.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      {allOk ? (
        <section className="card flex flex-col items-center gap-3 p-12 text-center text-gray-500">
          <CheckCircle className="h-12 w-12 text-emerald-400" />
          <p className="font-medium text-emerald-700">
            Tous les stocks sont au-dessus du seuil
          </p>
        </section>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-gray-500">
                <th className="p-3">Article</th>
                <th className="p-3 text-right">Stock actuel</th>
                <th className="p-3 text-right">Seuil minimum</th>
                <th className="p-3 text-right">Déficit</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <p className="font-semibold text-darktext">{item.name}</p>
                    {item.sku ? (
                      <p className="text-xs text-gray-400">{item.sku}</p>
                    ) : null}
                    {item.unit_price_gnf > 0 ? (
                      <p className="text-xs text-gray-400">{formatGNF(item.unit_price_gnf)} / unité</p>
                    ) : null}
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-bold tabular-nums text-red-700">
                      {item.quantity}
                    </span>
                  </td>
                  <td className="p-3 text-right tabular-nums text-gray-500">
                    {item.min_quantity}
                  </td>
                  <td className="p-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      <Package className="h-3 w-3" />
                      -{item.deficit} unité{item.deficit > 1 ? "s" : ""}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {item.category ?? "—"}
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href="/logistique/commandes"
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Commander
                    </Link>
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
