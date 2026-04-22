import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
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

  const permissions = await getModulePermissions(data.user.id, ["produits", "vente"]);
  if (!permissions.canUpdate) {
    redirect("/access-denied");
  }

  const product = await getProductById(params.id);
  if (!product) {
    notFound();
  }

  const userId = data.user.id;

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
        price_gnf: Number(getFieldValue(formData, "price_gnf")),
        stock_quantity: Number(getFieldValue(formData, "stock_quantity")),
        stock_threshold: Number(getFieldValue(formData, "stock_threshold")),
      };

      const requestHeaders = headers();
      await updateProduct(params.id, payload, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
    } catch (error) {
      const message = mapProductError(error, "Impossible de modifier le produit pour le moment.");
      redirect(`/vente/produits/${params.id}/edit?error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/produits/${params.id}?success=${encodeURIComponent("Produit mis à jour avec succès.")}`);
  }

  return (
    <ProductForm
      title="Modifier le produit"
      submitLabel="Enregistrer"
      action={updateProductAction}
      initialValues={product}
      cancelHref={`/vente/produits/${params.id}`}
      successMessage={searchParams?.success}
      errorMessage={searchParams?.error}
    />
  );
}

