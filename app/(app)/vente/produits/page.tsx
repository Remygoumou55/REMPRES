import Link from "next/link";
import { Archive } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createProduct, listProducts } from "@/lib/server/products";
import { ProductsTable } from "@/components/vente/produits/products-table";
import { getModulePermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { ProductForm } from "@/components/forms/product-form";
import { mapProductError } from "@/lib/server/product-error-messages";
import { withCreateModalQuery } from "@/lib/routing/modal-query";

type ProductsPageProps = {
  searchParams?: {
    success?: string;
    error?: string;
    create?: string;
  };
};

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

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const user = await getServerSessionUser();

  // 🔐 Sécurité utilisateur
  if (!user) {
    redirect("/login");
  }

  // 🔐 Permissions
  const permissions = await getModulePermissions(user.id, ["produits", "vente"]);

  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  // 📦 Data
  const products = await listProducts();

  // ✅ Sécurisation des params (ANTI CRASH)
  const successMessage =
    typeof searchParams?.success === "string"
      ? decodeURIComponent(searchParams.success)
      : undefined;

  const errorMessage =
    typeof searchParams?.error === "string"
      ? decodeURIComponent(searchParams.error)
      : undefined;
  const createOpen = searchParams?.create === "1";

  async function createProductAction(formData: FormData) {
    "use server";

    try {
      const createPermissions = await getModulePermissions(user.id, ["produits", "vente"]);
      if (!createPermissions.canCreate) {
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
      const message = mapProductError(error, "Impossible de créer le produit pour le moment.");
      redirect(`/vente/produits?create=1&error=${encodeURIComponent(message)}`);
    }

    redirect(`/vente/produits?success=${encodeURIComponent("Produit créé avec succès.")}`);
  }

  return (
    <main className="min-h-screen bg-graylight p-6">
      <div className="mx-auto max-w-6xl space-y-4">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-semibold text-darktext">Produits</h1>
            <p className="text-sm text-darktext/80">
              {products?.length ?? 0} produit(s)
            </p>
          </div>

          {permissions.canDelete || permissions.canCreate ? (
            <div className="flex flex-wrap items-center gap-2">
              {permissions.canDelete ? (
                <Link
                  href="/vente/produits/archives"
                  className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-darktext"
                >
                  <Archive size={14} />
                  Archives
                </Link>
              ) : null}
              {permissions.canCreate ? (
                <Link
                  href={withCreateModalQuery("/vente/produits")}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary-dark"
                >
                  + Nouveau produit
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Flash Messages SAFE */}
        <FlashMessage success={successMessage} error={errorMessage} />

        {/* Table */}
        <ProductsTable
          products={products ?? []}
          canUpdate={permissions.canUpdate}
          canDelete={permissions.canDelete}
          listQueryString=""
        />

      </div>
      {permissions.canCreate && createOpen ? (
        <ProductForm
          title="Nouveau produit"
          submitLabel="Créer le produit"
          action={createProductAction}
          cancelHref="/vente/produits"
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      ) : null}
    </main>
  );
}