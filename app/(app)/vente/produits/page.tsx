import Link from "next/link";
import { Archive } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createProduct, listProducts } from "@/lib/server/products";
import {
  ProductsRealtimeProvider,
  ProductsRealtimeSubtitle,
} from "@/components/vente/produits/ProductsRealtimeProvider";
import { ProductsTableLive } from "@/components/vente/produits/ProductsTableLive";
import { getModulePermissions } from "@/lib/server/permissions";
import { FlashMessage } from "@/components/ui/flash-message";
import { PageHeader } from "@/components/ui/page-header";
import { ModulePageStack } from "@/components/ui/module-page-stack";
import { ProductForm } from "@/components/forms/product-form";
import { mapProductError } from "@/lib/server/product-error-messages";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { PrimaryActionButton } from "@/components/ui/primary-action-button";
import { revalidateProduits } from "@/lib/cache/revalidation-map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

function getOptionalCostPrice(formData: FormData): number | null {
  const raw = formData.get("cost_price_gnf");
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const num = parseFloat(raw);
  if (Number.isNaN(num)) return null;
  return Math.max(0, num);
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const user = await getServerSessionUser();

  if (!user) {
    redirect("/login");
  }
  const userId = user.id;

  const permissions = await getModulePermissions(userId, ["produits", "vente"]);

  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const products = await listProducts();

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
      const createPermissions = await getModulePermissions(userId, ["produits", "vente"]);
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
        cost_price_gnf: getOptionalCostPrice(formData),
        stock_quantity: getNumberValue(formData, "stock_quantity"),
        stock_threshold: getNumberValue(formData, "stock_threshold"),
      };

      await createProduct(input);
      await revalidateProduits();
    } catch (error) {
      const message = mapProductError(error, "Impossible de créer le produit pour le moment.");
      redirect(`/vente/produits?create=1&error=${encodeURIComponent(message)}`);
    }

    redirect(`/vente/produits?success=${encodeURIComponent("Produit créé avec succès.")}`);
  }

  return (
    <div className="page-wrapper">
      <ProductsRealtimeProvider initialProducts={products ?? []}>
      <ModulePageStack>
        <PageHeader
          title="Produits"
          subtitle={<ProductsRealtimeSubtitle count={products?.length ?? 0} />}
          actions={
            permissions.canDelete || permissions.canCreate ? (
              <div className="flex flex-wrap items-center gap-2">
                {permissions.canDelete ? (
                  <Link
                    href="/vente/produits/archives"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-darktext shadow-sm transition hover:bg-gray-50"
                  >
                    <Archive size={14} />
                    Archives
                  </Link>
                ) : null}
                {permissions.canCreate ? (
                  <PrimaryActionButton href={withCreateModalQuery("/vente/produits")}>
                    Nouveau produit
                  </PrimaryActionButton>
                ) : null}
              </div>
            ) : null
          }
        />

        <FlashMessage success={successMessage} error={errorMessage} />

        <ProductsTableLive
          canUpdate={permissions.canUpdate}
          canDelete={permissions.canDelete}
          listQueryString=""
        />
      </ModulePageStack>
      </ProductsRealtimeProvider>
      {permissions.canCreate && createOpen ? (
        <ProductForm
          title="Nouveau produit"
          submitLabel="Créer le produit"
          action={createProductAction}
          successMessage={successMessage}
          errorMessage={errorMessage}
        />
      ) : null}
    </div>
  );
}