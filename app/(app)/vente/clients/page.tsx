import Link from "next/link";
import { Suspense } from "react";
import { Archive } from "lucide-react";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createClient } from "@/lib/server/clients";
import { listClients } from "@/lib/server/clients";
import { ClientsTable } from "@/components/vente/clients/clients-table";
import { ClientsFilters } from "@/components/vente/clients/clients-filters";
import { assertClientsPermission, getClientsPermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { PageHeader } from "@/components/ui/page-header";
import { ModulePageStack } from "@/components/ui/module-page-stack";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { ClientForm, type ClientFormActionResult } from "@/components/forms/client-form";
import type { ClientType } from "@/types/client";
import { mapClientError } from "@/lib/server/client-error-messages";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { revalidateClients } from "@/lib/cache/revalidation-map";
import { ClientsExportButton } from "@/components/vente/clients/ClientsExportButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClientsPageProps = {
  searchParams?: {
    q?: string;
    type?: "all" | "individual" | "company";
    page?: string;
    pageSize?: "10" | "25" | "50";
    success?: string;
    error?: string;
    create?: string;
  };
};

function safeDecode(value: string | undefined): string | undefined {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }
  const userId = user.id;
  const permissions = await getClientsPermissions(userId);
  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const q = searchParams?.q ?? "";
  const type = searchParams?.type ?? "all";
  const successMessage = safeDecode(searchParams?.success);
  const errorMessage = safeDecode(searchParams?.error);
  const page = Number(searchParams?.page ?? "1");
  const pageSize = Number(searchParams?.pageSize ?? "10") as 10 | 25 | 50;

  const result = await listClients({ search: q, type, page, pageSize });

  const buildUrl = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (type && type !== "all") params.set("type", type);
    params.set("page", String(nextPage));
    params.set("pageSize", String(result.pageSize));
    return `/vente/clients?${params.toString()}`;
  };

  const listParams = new URLSearchParams();
  if (q) listParams.set("q", q);
  if (type && type !== "all") listParams.set("type", type);
  listParams.set("page", String(result.page));
  listParams.set("pageSize", String(result.pageSize));
  const listQueryString = listParams.toString();
  const createOpen = searchParams?.create === "1";

  async function createClientAction(formData: FormData): Promise<ClientFormActionResult> {
    "use server";
    try {
      await assertClientsPermission(userId, "create");

      const input = {
        client_type: getFieldValue(formData, "client_type") as ClientType,
        first_name: getFieldValue(formData, "first_name"),
        last_name: getFieldValue(formData, "last_name"),
        company_name: getFieldValue(formData, "company_name"),
        email: getFieldValue(formData, "email"),
        phone: getFieldValue(formData, "phone"),
        address: getFieldValue(formData, "address"),
        city: getFieldValue(formData, "city"),
        country: getFieldValue(formData, "country"),
        notes: getFieldValue(formData, "notes"),
      };

      const requestHeaders = headers();
      await createClient(input, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
      await revalidateClients();
    } catch (error) {
      const message = mapClientError(error, "Impossible de créer le client pour le moment.");
      return { ok: false, message };
    }
    return {
      ok: true,
      redirectTo: `/vente/clients?success=${encodeURIComponent("Client créé avec succès.")}`,
    };
  }

  return (
    <div className="page-wrapper">
      <ModulePageStack>
        <PageHeader
          title="Clients"
          subtitle={`${result.total} client(s) trouvé(s).`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <ClientsExportButton clients={result.data} />
              {permissions.canDelete ? (
                <Link
                  href="/vente/clients/archives"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
                >
                  <Archive size={14} />
                  Archives
                </Link>
              ) : null}
              {permissions.canCreate ? (
                <a
                  href={withCreateModalQuery("/vente/clients")}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-dark"
                >
                  + Nouveau client
                </a>
              ) : null}
            </div>
          }
        />

        <FlashMessage success={successMessage} error={errorMessage} />

        <Suspense
          fallback={
            <div className="h-24 animate-pulse rounded-lg bg-white shadow-sm" aria-hidden />
          }
        >
          <ClientsFilters
            initialQuery={q}
            initialType={type}
            initialPageSize={String(result.pageSize) as "10" | "25" | "50"}
          />
        </Suspense>

        <ClientsTable
          clients={result.data}
          canUpdate={permissions.canUpdate}
          canDelete={permissions.canDelete}
          listQueryString={listQueryString}
        />

        <PaginationBar page={result.page} totalPages={result.totalPages} buildHref={buildUrl} />
      </ModulePageStack>
      {permissions.canCreate && createOpen ? (
        <ClientForm
          title="Nouveau client"
          submitLabel="Créer le client"
          action={createClientAction}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      ) : null}
    </div>
  );
}
