import { redirect } from "next/navigation";

type EditProductPageProps = {
  params: { id: string };
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const paramsList = new URLSearchParams({ edit: "1" });
  if (searchParams?.success) paramsList.set("success", searchParams.success);
  if (searchParams?.error) paramsList.set("error", searchParams.error);
  redirect(`/vente/produits/${params.id}?${paramsList.toString()}`);
}