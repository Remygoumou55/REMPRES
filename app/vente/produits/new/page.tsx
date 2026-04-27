import { redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { createProduct } from "@/lib/server/products";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getModulePermissions } from "@/lib/server/permissions";
import { mapProductError } from "@/lib/server/product-error-messages";

function getFieldValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getNullableFieldValue(formData: FormData, name: string) {
  const value = getFieldValue(formData, name).trim();
  return value.length > 0 ? value : null;
}

function getNumberValue(formData: FormData, name: string) {
  const value = getFieldValue(formData, name);
  const num = Number(value);
  return isNaN(num) ? 0 : num;
}

type NewProductPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function NewProductPage({ searchParams }: NewProductPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);

  if (!permissions.canCreate) {
    redirect("/access-denied");
  }

  const userId = data.user.id;

  async function createProductAction(formData: FormData) {
    "use server";

    try {
      const permissions = await getModulePermissions(userId, ["produits", "vente"]);

      if (!permissions.canCreate) {
        throw new Error("Accès refusé");
      }

      const input = {
        sku: getFieldValue(formData, "sku"),
        name: getFieldValue(formData, "name"),
        description: getNullableFieldValue(formData, "description"),
        image_url: getNullableFieldValue(formData, "image_url"),
        unit: getFieldValue(formData, "unit"),
        price_gnf: getNumberValue(formData, "price_gnf"),
        stock_quantity: getNumberValue(formData, "stock_quantity"),
        stock_threshold: getNumberValue(formData, "stock_threshold"),
      };

      await createProduct(input);

    } catch (error) {
      const message = mapProductError(
        error,
        "Impossible de créer le produit pour le moment."
      );

      redirect(`/vente/produits/new?error=${encodeURIComponent(message)}`);
    }

    redirect(`/vente/produits?success=${encodeURIComponent("Produit créé avec succès.")}`);
  }

  return (
    <ProductForm
      title="Nouveau produit"
      submitLabel="Créer le produit"
      action={createProductAction}
      successMessage={searchParams?.success}
      errorMessage={searchParams?.error}
    />
  );
}