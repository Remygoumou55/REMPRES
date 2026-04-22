import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ClientForm } from "@/components/forms/client-form";
import { createClient } from "@/lib/server/clients";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import type { ClientType } from "@/types/client";
import { assertClientsPermission } from "@/lib/server/permissions";
import { mapClientError } from "@/lib/server/client-error-messages";

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

type NewClientPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }
  const userId = data.user.id;
  await assertClientsPermission(userId, "create");

  async function createClientAction(formData: FormData) {
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
    } catch (error) {
      const message = mapClientError(error, "Impossible de créer le client pour le moment.");
      redirect(`/vente/clients/new?error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/clients?success=${encodeURIComponent("Client créé avec succès.")}`);
  }

  return (
    <ClientForm
      title="Nouveau client"
      submitLabel="Créer le client"
      action={createClientAction}
      successMessage={searchParams?.success}
      errorMessage={searchParams?.error}
    />
  );
}
