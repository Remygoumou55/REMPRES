import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import type { Client } from "@/types/client";
import { PageHeader } from "@/components/ui/page-header";
import { FlashMessage } from "@/components/ui/flash-message";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { SALES_HISTORY_PAGE_SIZE } from "@/lib/data-listing";
import { SalesTable, type SaleRow } from "@/components/vente/historique/sales-table";
import { HistoriqueSalesFiltersForm } from "@/components/vente/historique/historique-sales-filters-form";
import { HistoriqueExportButton } from "@/components/vente/historique/HistoriqueExportButton";

export const metadata = { title: "Historique des ventes" };

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type PaymentStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

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

  const rawStatus = searchParams?.status ?? "";
  const status: PaymentStatus | "" = (
    ["pending", "partial", "paid", "overdue", "cancelled"] as const
  ).includes(rawStatus as PaymentStatus)
    ? (rawStatus as PaymentStatus)
    : "";
  const from = searchParams?.from ?? "";
  const to = searchParams?.to ?? "";
  const clientQuery = searchParams?.client ?? "";
  const successMessage = safeDecodeSearchParam(searchParams?.success);
  const errorMessage = safeDecodeSearchParam(searchParams?.error);
  const page = Math.max(1, Number(searchParams?.page ?? "1"));
  const pageSize = SALES_HISTORY_PAGE_SIZE;
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
      "id,reference,client_id,total_amount_gnf,display_currency,payment_method,payment_status,amount_paid_gnf,created_at,lifecycle_status",
      { count: "exact" },
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
      <div className="mx-auto max-w-6xl space-y-5">
        <PageHeader title="Historique des ventes" subtitle="Liste des ventes" />
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800">
          Impossible de charger l’historique des ventes pour le moment. Réessayez plus tard ou contactez le support
          si le problème persiste.
        </div>
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
      .select("id,client_type,first_name,last_name,company_name")
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

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Historique des ventes"
        subtitle={`${total} vente${total > 1 ? "s" : ""} trouvée${total > 1 ? "s" : ""}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <HistoriqueExportButton sales={sales} clientsById={clientsById} />
            {permissions.canCreate ? (
              <PrimaryActionButton href="/vente/nouvelle-vente">
                Nouvelle vente
              </PrimaryActionButton>
            ) : null}
          </div>
        }
      />

      <FlashMessage success={successMessage} error={errorMessage} />

      <HistoriqueSalesFiltersForm
        initialClient={clientQuery}
        initialStatus={status}
        initialFrom={from}
        initialTo={to}
      />

      <SalesTable
        sales={sales}
        clientsById={clientsById}
        canDelete={permissions.canDelete}
        listQueryString={listQueryString}
      />

      <PaginationBar
        page={page}
        totalPages={totalPages}
        buildHref={buildUrl}
        description={
          <>
            — {total} vente{total > 1 ? "s" : ""}
          </>
        }
      />
    </div>
  );
}
