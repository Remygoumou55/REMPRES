import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getClientById, softDeleteClient } from "@/lib/server/clients";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { assertClientsPermission, getClientsPermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { DeleteClientButton } from "@/components/vente/clients/delete-client-button";
import { mapClientError } from "@/lib/server/client-error-messages";

type ClientDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
  };
};

function displayClientName(
  clientType: "individual" | "company",
  firstName: string | null,
  lastName: string | null,
  companyName: string | null,
) {
  if (clientType === "company") return companyName ?? "Entreprise sans nom";
  return `${firstName ?? ""} ${lastName ?? ""}`.trim() || "Client sans nom";
}

export default async function ClientDetailPage({ params, searchParams }: ClientDetailPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  const userId = data.user.id;
  const permissions = await getClientsPermissions(userId);
  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const client = await getClientById(params.id);
  if (!client) {
    notFound();
  }

  async function deleteClientAction() {
    "use server";
    try {
      await assertClientsPermission(userId, "delete");
      const requestHeaders = headers();
      await softDeleteClient(params.id, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
    } catch (error) {
      const message = mapClientError(error, "Impossible de supprimer le client pour le moment.");
      redirect(`/vente/clients/${params.id}?error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/clients?success=${encodeURIComponent("Client supprimé avec succès.")}`);
  }

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-darktext">
          {displayClientName(
            client.client_type,
            client.first_name,
            client.last_name,
            client.company_name,
          )}
        </h1>
        <p className="mt-1 text-sm text-darktext/70">
          {client.client_type === "company" ? "Entreprise" : "Individuel"}
        </p>
        <div className="mt-4">
          <FlashMessage success={searchParams?.success} error={searchParams?.error} />
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase text-darktext/70">Email</dt>
            <dd className="text-sm text-darktext">{client.email ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-darktext/70">Téléphone</dt>
            <dd className="text-sm text-darktext">{client.phone ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-darktext/70">Ville</dt>
            <dd className="text-sm text-darktext">{client.city ?? "-"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase text-darktext/70">Pays</dt>
            <dd className="text-sm text-darktext">{client.country ?? "-"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-darktext/70">Adresse</dt>
            <dd className="text-sm text-darktext">{client.address ?? "-"}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-medium uppercase text-darktext/70">Notes</dt>
            <dd className="text-sm text-darktext">{client.notes ?? "-"}</dd>
          </div>
        </dl>

        <div className="mt-6 flex gap-3">
          {permissions.canUpdate ? (
            <Link
              href={`/vente/clients/${client.id}/edit`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Modifier
            </Link>
          ) : null}
          <Link
            href="/vente/clients"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          >
            Retour
          </Link>
          {permissions.canDelete ? (
            <form id="delete-client-form" action={deleteClientAction}>
              <DeleteClientButton />
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
