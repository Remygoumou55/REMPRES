import { redirect } from "next/navigation";

type EditClientPageProps = {
  params: { id: string };
  searchParams?: { success?: string; error?: string };
};

export default async function EditClientPage({ params, searchParams }: EditClientPageProps) {
  const paramsList = new URLSearchParams({ edit: "1" });
  if (searchParams?.success) paramsList.set("success", searchParams.success);
  if (searchParams?.error) paramsList.set("error", searchParams.error);
  redirect(`/vente/clients/${params.id}?${paramsList.toString()}`);
}
