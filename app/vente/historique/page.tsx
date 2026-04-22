import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { Client } from "@/types/client";
import { MarkAsPaidButton } from "./MarkAsPaidButton";

export const metadata = { title: "Historique des ventes" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STATUT_LABELS: Record<string, { label: string; classes: string }> = {
  pending:   { label: "En attente",  classes: "bg-yellow-100 text-yellow-700" },
  partial:   { label: "Partiel",     classes: "bg-blue-100 text-blue-700" },
  paid:      { label: "Payé",        classes: "bg-green-100 text-green-700" },
  overdue:   { label: "En retard",   classes: "bg-red-100 text-red-700" },
  cancelled: { label: "Annulé",      classes: "bg-gray-100 text-gray-500" },
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  bank_transfer: "Virement",
  credit:        "Crédit",
  mixed:         "Mixte",
};

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SaleRow = {
  id: string;
  reference: string | null;
  client_id: string | null;
  total_amount_gnf: number;
  display_currency: string;
  payment_method: string | null;
  payment_status: string;
  amount_paid_gnf: number;
  created_at: string;
};

type PageProps = {
  searchParams?: {
    status?: string;
    from?: string;
    to?: string;
    page?: string;
  };
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HistoriquePage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  if (!permissions.canRead) redirect("/access-denied");

  const status   = searchParams?.status ?? "";
  const from     = searchParams?.from ?? "";
  const to       = searchParams?.to ?? "";
  const page     = Math.max(1, Number(searchParams?.page ?? "1"));
  const pageSize = 20;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo   = rangeFrom + pageSize - 1;

  // Build query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query: any = supabase
    .from("sales")
    .select(
      "id,reference,client_id,total_amount_gnf,display_currency,payment_method,payment_status,amount_paid_gnf,created_at",
      { count: "exact" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("payment_status", status);
  if (from)   query = query.gte("created_at", from);
  if (to)     query = query.lte("created_at", to + "T23:59:59Z");

  const { data: rawSales, count, error } = await query.range(rangeFrom, rangeTo);

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-6 text-red-700">
        Erreur : {error.message}
      </div>
    );
  }

  const sales = (rawSales ?? []) as SaleRow[];
  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  // Fetch client names for these sales
  const clientIds = Array.from(
    new Set(sales.map((s) => s.client_id).filter((id): id is string => id !== null)),
  );

  let clientMap = new Map<string, Client>();
  if (clientIds.length > 0) {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("*")
      .in("id", clientIds);

    clientMap = new Map((clientsData ?? []).map((c) => [c.id, c as Client]));
  }

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from)   params.set("from", from);
    if (to)     params.set("to", to);
    params.set("page", String(p));
    return `/vente/historique?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
        <div>
          <h1 className="text-2xl font-semibold text-darktext">Historique des ventes</h1>
          <p className="text-sm text-darktext/80">{total} vente(s) trouvée(s)</p>
        </div>
        {permissions.canCreate && (
          <Link
            href="/vente/nouvelle-vente"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            + Nouvelle vente
          </Link>
        )}
      </div>

      {/* Filters */}
      <form
        method="GET"
        className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-4"
      >
        <select
          name="status"
          defaultValue={status}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="partial">Partiel</option>
          <option value="paid">Payé</option>
          <option value="overdue">En retard</option>
          <option value="cancelled">Annulé</option>
        </select>

        <input
          type="date"
          name="from"
          defaultValue={from}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Date début"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Date fin"
        />

        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
        >
          Filtrer
        </button>

        {(status || from || to) && (
          <Link
            href="/vente/historique"
            className="text-center text-sm text-gray-400 underline sm:col-span-4"
          >
            Réinitialiser les filtres
          </Link>
        )}
      </form>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-primary text-left text-sm text-white">
            <tr>
              <th className="px-4 py-3 font-medium">Référence</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium text-right">Total GNF</th>
              <th className="px-4 py-3 font-medium">Devise</th>
              <th className="px-4 py-3 font-medium">Paiement</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                  Aucune vente trouvée pour ces critères.
                </td>
              </tr>
            ) : (
              sales.map((sale) => {
                const client = sale.client_id ? clientMap.get(sale.client_id) : undefined;
                const statut = STATUT_LABELS[sale.payment_status] ?? {
                  label: sale.payment_status,
                  classes: "bg-gray-100 text-gray-500",
                };

                return (
                  <tr key={sale.id} className="hover:bg-graylight/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      <Link
                        href={`/vente/historique/${sale.id}`}
                        className="hover:underline"
                      >
                        {sale.reference ?? sale.id.slice(0, 8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-darktext">
                      {client ? getClientLabel(client) : (
                        <span className="italic text-gray-400">Client de passage</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-darktext">
                      {sale.total_amount_gnf.toLocaleString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{sale.display_currency}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {sale.payment_method
                        ? PAYMENT_METHOD_LABELS[sale.payment_method] ?? sale.payment_method
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statut.classes}`}
                      >
                        {statut.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {sale.payment_status === "pending" || sale.payment_status === "partial" ? (
                        <MarkAsPaidButton
                          saleId={sale.id}
                          totalAmountGNF={sale.total_amount_gnf}
                        />
                      ) : (
                        <Link
                          href={`/vente/historique/${sale.id}`}
                          className="text-xs text-primary hover:underline"
                        >
                          Détail
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm text-darktext/80">
          Page {page} / {totalPages} — {total} vente(s)
        </p>
        <div className="flex gap-2">
          <Link
            href={page > 1 ? buildUrl(page - 1) : "#"}
            className={`rounded-md px-3 py-2 text-sm ${
              page > 1
                ? "border border-gray-300 text-darktext"
                : "cursor-not-allowed border border-gray-200 text-gray-400"
            }`}
          >
            Précédent
          </Link>
          <Link
            href={page < totalPages ? buildUrl(page + 1) : "#"}
            className={`rounded-md px-3 py-2 text-sm ${
              page < totalPages
                ? "border border-gray-300 text-darktext"
                : "cursor-not-allowed border border-gray-200 text-gray-400"
            }`}
          >
            Suivant
          </Link>
        </div>
      </div>
    </div>
  );
}
