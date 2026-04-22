import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { ClientForm } from "@/components/forms/client-form";
import { getClientById, updateClient } from "@/lib/server/clients";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ClientType } from "@/types/client";
import { assertClientsPermission } from "@/lib/server/permissions";
import { mapClientError } from "@/lib/server/client-error-messages";

type EditClientPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
  };
};

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export default async function EditClientPage({ params, searchParams }: EditClientPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  const userId = data.user.id;
  await assertClientsPermission(userId, "update");

  const client = await getClientById(params.id);
  if (!client) {
    notFound();
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
      redirect(`/vente/clients/${params.id}/edit?error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/clients/${params.id}?success=${encodeURIComponent("Client mis à jour avec succès.")}`);
  }

  return (
    <ClientForm
      title="Modifier le client"
      submitLabel="Enregistrer"
      action={updateClientAction}
      initialValues={client}
      cancelHref={`/vente/clients/${params.id}`}
      successMessage={searchParams?.success}
      errorMessage={searchParams?.error}
    />
  );
}
