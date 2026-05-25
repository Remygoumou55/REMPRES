import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Edit, UserX } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertLogistiqueRead } from "@/lib/server/logistique-access";
import { getSupplierById, listPurchaseOrders } from "@/lib/server/logistique";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import {
  PurchaseOrderStatusBadge,
  SupplierStatusBadge,
} from "@/components/logistique/logistique-badges";
import { toggleSupplierStatusAction } from "../actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
};

function formatGNF(n: number) {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

export default async function SupplierDetailPage({ params, searchParams }: Props) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertLogistiqueRead(user.id);

  const [supplier, ordersResult] = await Promise.all([
    getSupplierById(params.id),
    listPurchaseOrders({ supplierId: params.id, pageSize: 50 }),
  ]);
  if (!supplier) notFound();

  return (
    <div className="page-wrapper">
      <PageHeader
        title={supplier.name}
        subtitle={`Code ${supplier.supplier_code}${supplier.category ? ` · ${supplier.category}` : ""}`}
        breadcrumbs={
          <Link
            href="/logistique/fournisseurs"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Retour aux fournisseurs
          </Link>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SupplierStatusBadge isActive={supplier.is_active} />
            <Link
              href={`/logistique/fournisseurs/${supplier.id}/edit`}
              className="btn-secondary inline-flex items-center gap-2 text-sm"
            >
              <Edit className="h-4 w-4" />
              Modifier
            </Link>
            <form
              action={toggleSupplierStatusAction.bind(
                null,
                supplier.id,
                !supplier.is_active,
              )}
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                <UserX className="h-4 w-4" />
                {supplier.is_active ? "Désactiver" : "Réactiver"}
              </button>
            </form>
          </div>
        }
      />
      <FlashMessage success={searchParams?.success} error={searchParams?.error} />

      <section className="card grid gap-4 p-6 md:grid-cols-2">
        <InfoField label="Nom" value={supplier.name} />
        <InfoField label="Code fournisseur" value={supplier.supplier_code} />
        <InfoField label="Contact" value={supplier.contact_name ?? "—"} />
        <InfoField label="Catégorie" value={supplier.category ?? "—"} />
        <InfoField label="Email" value={supplier.email ?? "—"} />
        <InfoField label="Téléphone" value={supplier.phone ?? "—"} />
        <InfoField
          label="Adresse"
          value={supplier.address ?? "—"}
          className="md:col-span-2"
        />
      </section>

      <section className="mt-8 space-y-4">
        <h2 className="text-base font-semibold text-darktext">Commandes d&apos;achat</h2>
        {ordersResult.data.length === 0 ? (
          <p className="card p-6 text-sm text-gray-500">
            Aucune commande passée à ce fournisseur.
          </p>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="p-3">Référence</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-right">Montant total</th>
                  <th className="p-3">Date prévue</th>
                  <th className="p-3">Créée le</th>
                </tr>
              </thead>
              <tbody>
                {ordersResult.data.map((po) => (
                  <tr key={po.id} className="border-b border-gray-100">
                    <td className="p-3 font-mono text-xs font-semibold">
                      {po.reference}
                    </td>
                    <td className="p-3">
                      <PurchaseOrderStatusBadge status={po.status} />
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {formatGNF(Number(po.total_amount_gnf))}
                    </td>
                    <td className="p-3 text-xs">
                      {po.expected_date
                        ? new Date(po.expected_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {new Date(po.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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
