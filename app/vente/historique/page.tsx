import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, Filter } from "lucide-react";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { Client } from "@/types/client";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { MarkAsPaidButton } from "./MarkAsPaidButton";

export const metadata = { title: "Historique des ventes" };

// ---------------------------------------------------------------------------
// Config statuts & paiements
// ---------------------------------------------------------------------------

const STATUT_CFG: Record<string, { label: string; variant: BadgeVariant }> = {
  pending:   { label: "En attente", variant: "warning" },
  partial:   { label: "Partiel",    variant: "info"    },
  paid:      { label: "Payé",       variant: "success" },
  overdue:   { label: "En retard",  variant: "danger"  },
  cancelled: { label: "Annulé",     variant: "gray"    },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash:          "Espèces",
  mobile_money:  "Mobile Money",
  bank_transfer: "Virement",
  credit:        "Crédit",
  mixed:         "Mixte",
};

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
  searchParams?: { status?: string; from?: string; to?: string; page?: string; client?: string };
};

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function HistoriquePage({ searchParams }: PageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  if (!permissions.canRead) redirect("/access-denied");

  const status      = searchParams?.status ?? "";
  const from        = searchParams?.from   ?? "";
  const to          = searchParams?.to     ?? "";
  const clientQuery = searchParams?.client ?? "";
  const page        = Math.max(1, Number(searchParams?.page ?? "1"));
  const pageSize    = 20;
  const rangeFrom   = (page - 1) * pageSize;
  const rangeTo     = rangeFrom + pageSize - 1;

  // Filtre par nom de client : on récupère les IDs correspondants
  let clientFilterIds: string[] | null = null;
  if (clientQuery.trim()) {
    const q = `%${clientQuery.trim()}%`;
    const { data: matchingClients } = await supabase
      .from("clients")
      .select("id")
      .or(`first_name.ilike.${q},last_name.ilike.${q},company_name.ilike.${q}`)
      .is("deleted_at", null)
      .limit(100);
    clientFilterIds = (matchingClients ?? []).map((c) => c.id);
  }

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
  if (clientFilterIds !== null) {
    if (clientFilterIds.length === 0) {
      // Aucun client trouvé → forcer résultat vide
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    } else {
      query = query.in("client_id", clientFilterIds);
    }
  }

  const { data: rawSales, count, error } = await query.range(rangeFrom, rangeTo);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Erreur : {error.message}
      </div>
    );
  }

  const sales      = (rawSales ?? []) as SaleRow[];
  const total      = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  const clientIds = Array.from(
    new Set(sales.map((s) => s.client_id).filter((id): id is string => id !== null)),
  );
  let clientMap = new Map<string, Client>();
  if (clientIds.length > 0) {
    const { data: clientsData } = await supabase.from("clients").select("*").in("id", clientIds);
    clientMap = new Map((clientsData ?? []).map((c) => [c.id, c as Client]));
  }

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (status)      params.set("status", status);
    if (from)        params.set("from", from);
    if (to)          params.set("to", to);
    if (clientQuery) params.set("client", clientQuery);
    params.set("page", String(p));
    return `/vente/historique?${params.toString()}`;
  };

  const hasFilters = !!(status || from || to || clientQuery);

  return (
    <div className="mx-auto max-w-6xl space-y-5">

      {/* ── Header ── */}
      <PageHeader
        title="Historique des ventes"
        subtitle={`${total} vente${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""}`}
        actions={
          permissions.canCreate && (
            <Link
              href="/vente/nouvelle-vente"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary/90"
            >
              + Nouvelle vente
            </Link>
          )
        }
      />

      {/* ── Filtres ── */}
      <form
        method="GET"
        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      >
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Filter size={12} />
          Filtres
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Recherche client */}
          <input
            type="text"
            name="client"
            defaultValue={clientQuery}
            placeholder="Nom du client…"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Statut */}
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="partial">Partiel</option>
            <option value="paid">Payé</option>
            <option value="overdue">En retard</option>
            <option value="cancelled">Annulé</option>
          </select>

          {/* Date début */}
          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {/* Date fin */}
          <input
            type="date"
            name="to"
            defaultValue={to}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Filtrer
          </button>
        </div>

        {hasFilters && (
          <div className="mt-2">
            <Link href="/vente/historique" className="text-xs text-gray-400 hover:text-gray-600">
              Réinitialiser les filtres
            </Link>
          </div>
        )}
      </form>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Référence</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Client</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">Paiement</th>
                <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Statut</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">Date</th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingBag size={28} className="text-gray-200" />
                      <p className="text-sm text-gray-400">Aucune vente pour ces critères</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sales.map((sale) => {
                  const client  = sale.client_id ? clientMap.get(sale.client_id) : undefined;
                  const statut  = STATUT_CFG[sale.payment_status] ?? { label: sale.payment_status, variant: "gray" as BadgeVariant };
                  const isPending = sale.payment_status === "pending" || sale.payment_status === "partial";

                  return (
                    <tr key={sale.id} className="group transition-colors hover:bg-gray-50/60">

                      {/* Référence */}
                      <td className="px-5 py-3.5">
                        <span className="rounded-lg bg-primary/5 px-2 py-1 font-mono text-xs font-semibold text-primary">
                          {sale.reference ?? sale.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>

                      {/* Client */}
                      <td className="px-5 py-3.5 font-medium text-darktext">
                        {client ? getClientLabel(client) : (
                          <span className="italic text-gray-400">Client de passage</span>
                        )}
                      </td>

                      {/* Total */}
                      <td className="px-5 py-3.5 text-right">
                        <span className="font-bold tabular-nums text-darktext">
                          {sale.total_amount_gnf.toLocaleString("fr-FR")}
                        </span>
                        <span className="ml-1 text-xs text-gray-400">{sale.display_currency}</span>
                      </td>

                      {/* Mode paiement */}
                      <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">
                        {sale.payment_method ? PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method : "—"}
                      </td>

                      {/* Statut */}
                      <td className="px-5 py-3.5 text-center">
                        <Badge
                          label={statut.label}
                          variant={statut.variant}
                          dot
                        />
                      </td>

                      {/* Date */}
                      <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
                        {new Date(sale.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/vente/historique/${sale.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-gray-100 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-200"
                          >
                            Détails
                          </Link>
                          {isPending && (
                            <MarkAsPaidButton
                              saleId={sale.id}
                              totalAmountGNF={sale.total_amount_gnf}
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
        <p className="text-sm text-gray-500">
          Page <span className="font-semibold text-darktext">{page}</span> sur{" "}
          <span className="font-semibold text-darktext">{totalPages}</span>
          {" "}— {total} vente{total > 1 ? "s" : ""}
        </p>
        <div className="flex gap-2">
          <Link
            href={page > 1 ? buildUrl(page - 1) : "#"}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              page > 1
                ? "border border-gray-200 text-darktext hover:bg-gray-50"
                : "cursor-not-allowed border border-gray-100 text-gray-300"
            }`}
          >
            ← Précédent
          </Link>
          <Link
            href={page < totalPages ? buildUrl(page + 1) : "#"}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              page < totalPages
                ? "border border-gray-200 text-darktext hover:bg-gray-50"
                : "cursor-not-allowed border border-gray-100 text-gray-300"
            }`}
          >
            Suivant →
          </Link>
        </div>
      </div>

    </div>
  );
}
