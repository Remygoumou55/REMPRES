import { redirect } from "next/navigation";

type NewProductPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const paramsList = new URLSearchParams({ create: "1" });
  if (searchParams?.success) paramsList.set("success", searchParams.success);
  if (searchParams?.error) paramsList.set("error", searchParams.error);
  redirect(`/vente/produits?${paramsList.toString()}`);
}