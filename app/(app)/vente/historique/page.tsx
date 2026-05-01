import Link from "next/link";
import { redirect } from "next/navigation";
import { Filter } from "lucide-react";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { Client } from "@/types/client";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { SalesTable, type SaleRow } from "@/components/vente/historique/sales-table";

export const metadata = { title: "Historique des ventes" };

type PageProps = {
  searchParams?: {
    status?: string;
    from?: string;
    to?: string;
    page?: string;
    client?: string;
    success?: string;
    error?: string;
  };
};

function safeDecodeSearchParam(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function HistoriquePage({ searchParams }: PageProps) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const permissions = await getModulePermissions(user.id, ["produits", "vente"]);
  if (!permissions.canRead) redirect("/access-denied");

  const supabase = getSupabaseServerClient();

  const status = searchParams?.status ?? "";
  const from = searchParams?.from ?? "";
  const to = searchParams?.to ?? "";
  const clientQuery = searchParams?.client ?? "";
  const successMessage = safeDecodeSearchParam(searchParams?.success);
  const errorMessage = safeDecodeSearchParam(searchParams?.error);
  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const pageSize = 20;
  const rangeFrom = (page - 1) * pageSize;
  const rangeTo = rangeFrom + pageSize - 1;

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

  let query = supabase
    .from("sales")
    .select(
      "id,reference,client_id,total_amount_gnf,display_currency,payment_method,payment_status,amount_paid_gnf,created_at",
      { count: "planned" },
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("payment_status", status);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + "T23:59:59Z");
  if (clientFilterIds !== null) {
    if (clientFilterIds.length === 0) {
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

  const sales = (rawSales ?? []) as SaleRow[];
  const total = count ?? 0;
  const totalPages = total === 0 ? 1 : Math.ceil(total / pageSize);

  const clientIds = Array.from(
    new Set(sales.map((s) => s.client_id).filter((id): id is string => id !== null)),
  );
  const clientsById: Record<string, Client> = {};
  if (clientIds.length > 0) {
    const { data: clientsData } = await supabase
      .from("clients")
      .select("id,client_type,first_name,last_name,company_name,email,phone,address,city,country,notes,created_by,created_at,updated_at,deleted_at,deleted_by")
      .in("id", clientIds);
    for (const row of clientsData ?? []) {
      clientsById[row.id] = row as Client;
    }
  }

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (clientQuery) params.set("client", clientQuery);
    params.set("page", String(p));
    return `/vente/historique?${params.toString()}`;
  };

  const listParams = new URLSearchParams();
  if (status) listParams.set("status", status);
  if (from) listParams.set("from", from);
  if (to) listParams.set("to", to);
  if (clientQuery) listParams.set("client", clientQuery);
  listParams.set("page", String(page));
  const listQueryString = listParams.toString();

  const hasFilters = !!(status || from || to || clientQuery);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
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

      <FlashMessage success={successMessage} error={errorMessage} />

      <form method="GET" className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Filter size={12} />
          Filtres
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <input
            type="text"
            name="client"
            defaultValue={clientQuery}
            placeholder="Nom du client…"
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

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

          <input
            type="date"
            name="from"
            defaultValue={from}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
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

      <SalesTable
        sales={sales}
        clientsById={clientsById}
        canDelete={permissions.canDelete}
        listQueryString={listQueryString}
      />

      <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white px-5 py-3.5 shadow-sm">
        <p className="text-sm text-gray-500">
          Page <span className="font-semibold text-darktext">{page}</span> sur{" "}
          <span className="font-semibold text-darktext">{totalPages}</span> — {total} vente
          {total > 1 ? "s" : ""}
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
