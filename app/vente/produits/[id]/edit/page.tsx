import { notFound, redirect } from "next/navigation";
import { ProductForm } from "@/components/forms/product-form";
import { getProductById, updateProduct } from "@/lib/server/products";
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

type EditProductPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
  };
};

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = data.user.id;
  const productId = params.id; // ✅ FIX IMPORTANT

  const permissions = await getModulePermissions(userId, ["produits", "vente"]);

  if (!permissions.canUpdate) {
    redirect("/access-denied");
  }

  const product = await getProductById(productId);

  if (!product) {
    notFound();
  }

  async function updateProductAction(formData: FormData) {
    "use server";

    try {
      const permissions = await getModulePermissions(userId, ["produits", "vente"]);

      if (!permissions.canUpdate) {
        throw new Error("Accès refusé");
      }

      const payload = {
        sku: getFieldValue(formData, "sku"),
        name: getFieldValue(formData, "name"),
        description: getNullableFieldValue(formData, "description"),
        image_url: getNullableFieldValue(formData, "image_url"),
        unit: getFieldValue(formData, "unit"),
        price_gnf: getNumberValue(formData, "price_gnf"),
        stock_quantity: getNumberValue(formData, "stock_quantity"),
        stock_threshold: getNumberValue(formData, "stock_threshold"),
      };

      await updateProduct(productId, payload);

    } catch (error) {
      const message = mapProductError(
        error,
        "Impossible de modifier le produit pour le moment."
      );

      redirect(`/vente/produits/${productId}/edit?error=${encodeURIComponent(message)}`);
    }

    redirect(`/vente/produits/${productId}?success=${encodeURIComponent("Produit mis à jour avec succès.")}`);
  }

  return (
    <ProductForm
      title="Modifier le produit"
      submitLabel="Enregistrer"
      action={updateProductAction}
      initialValues={product}
      cancelHref={`/vente/produits/${productId}`}
      successMessage={searchParams?.success}
      errorMessage={searchParams?.error}
    />
  );
}