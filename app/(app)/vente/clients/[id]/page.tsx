import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { User } from "lucide-react";
import { getClientById, softDeleteClient, updateClient } from "@/lib/server/clients";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ClientType } from "@/types/client";
import { assertClientsPermission, getClientsPermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { DeleteClientButton } from "@/components/vente/clients/delete-client-button";
import { ClientForm } from "@/components/forms/client-form";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { DetailPageModal } from "@/components/ui/detail-page-modal";
import { mapClientError } from "@/lib/server/client-error-messages";

type ClientDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
    edit?: string;
  };
};

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

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

  async function updateClientAction(formData: FormData) {
    "use server";
    try {
      await assertClientsPermission(userId, "update");

      const payload = {
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
      await updateClient(params.id, payload, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
    } catch (error) {
      const message = mapClientError(error, "Impossible de modifier le client pour le moment.");
      redirect(`/vente/clients/${params.id}?edit=1&error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/clients/${params.id}?success=${encodeURIComponent("Client mis à jour avec succès.")}`);
  }

  return (
    <DetailPageModal
      title={displayClientName(
        client.client_type,
        client.first_name,
        client.last_name,
        client.company_name,
      )}
      subtitle={client.client_type === "company" ? "Entreprise" : "Individuel"}
      icon={<User size={18} />}
      closeHref="/vente/clients"
      size="4xl"
    >
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
            <EditActionLink
              href={`/vente/clients/${client.id}`}
              label="Modifier"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            />
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

      {permissions.canUpdate && searchParams?.edit === "1" ? (
        <ClientForm
          title="Modifier le client"
          submitLabel="Enregistrer"
          action={updateClientAction}
          initialValues={client}
          cancelHref={`/vente/clients/${params.id}`}
          successMessage={searchParams?.success}
          errorMessage={searchParams?.error}
        />
      ) : null}
    </DetailPageModal>
  );
}
