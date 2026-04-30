import Link from "next/link";
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
import { ClientForm } from "@/components/forms/client-form";
import type { ClientType } from "@/types/client";
import { mapClientError } from "@/lib/server/client-error-messages";
import { withCreateModalQuery } from "@/lib/routing/modal-query";

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

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }
  const permissions = await getClientsPermissions(user.id);
  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const q = searchParams?.q ?? "";
  const type = searchParams?.type ?? "all";
  const successMessage = searchParams?.success;
  const errorMessage = searchParams?.error;
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

  async function createClientAction(formData: FormData) {
    "use server";
    try {
      await assertClientsPermission(user.id, "create");

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
      await createClient(input, user.id, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
    } catch (error) {
      const message = mapClientError(error, "Impossible de créer le client pour le moment.");
      redirect(`/vente/clients?create=1&error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/clients?success=${encodeURIComponent("Client créé avec succès.")}`);
  }

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-darktext">Clients</h1>
            <p className="text-sm text-darktext/80">{result.total} client(s) trouvé(s)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {permissions.canDelete ? (
              <Link
                href="/vente/clients/archives"
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-darktext"
              >
                <Archive size={14} />
                Archives
              </Link>
            ) : null}
            {permissions.canCreate ? (
              <Link
                href={withCreateModalQuery("/vente/clients")}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
              >
                + Nouveau client
              </Link>
            ) : null}
          </div>
        </div>
        <FlashMessage success={successMessage} error={errorMessage} />

        <ClientsFilters
          initialQuery={q}
          initialType={type}
          initialPageSize={String(result.pageSize) as "10" | "25" | "50"}
        />

        <ClientsTable
          clients={result.data}
          canUpdate={permissions.canUpdate}
          canDelete={permissions.canDelete}
          listQueryString={listQueryString}
        />

        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <p className="text-sm text-darktext/80">
            Page {result.page} / {result.totalPages}
          </p>
          <div className="flex gap-2">
            <Link
              href={result.page > 1 ? buildUrl(result.page - 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page > 1
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Précédent
            </Link>
            <Link
              href={result.page < result.totalPages ? buildUrl(result.page + 1) : "#"}
              className={`rounded-md px-3 py-2 text-sm ${
                result.page < result.totalPages
                  ? "border border-gray-300 text-darktext"
                  : "cursor-not-allowed border border-gray-200 text-gray-400"
              }`}
            >
              Suivant
            </Link>
          </div>
        </div>
      </div>
      {permissions.canCreate && createOpen ? (
        <ClientForm
          title="Nouveau client"
          submitLabel="Créer le client"
          action={createClientAction}
          cancelHref="/vente/clients"
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      ) : null}
    </main>
  );
}
