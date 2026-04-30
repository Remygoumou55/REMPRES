import { redirect } from "next/navigation";

type NewClientPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function NewClientPage({ searchParams }: NewClientPageProps) {
  const paramsList = new URLSearchParams({ create: "1" });
  if (searchParams?.success) paramsList.set("success", searchParams.success);
  if (searchParams?.error) paramsList.set("error", searchParams.error);
  redirect(`/vente/clients?${paramsList.toString()}`);
}
