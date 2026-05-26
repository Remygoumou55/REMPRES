import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Package } from "lucide-react";

import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getProductById, updateProduct } from "@/lib/server/products";
import { createApprovalRequest } from "@/lib/server/approvals";
import { SENSITIVE_ACTIONS } from "@/lib/constants/sensitive-actions";
import { getModulePermissions, getUserRole } from "@/lib/server/permissions";
import { getCachedProfileRow } from "@/lib/server/profile-row";
import { FlashMessage } from "@/components/ui/flash-message";
import { DeleteProductButton } from "@/components/vente/produits/delete-product-button";
import { ProductForm } from "@/components/forms/product-form";
import { EditActionLink } from "@/components/ui/edit-action-link";
import { DetailPageModal } from "@/components/ui/detail-page-modal";
import { mapProductError } from "@/lib/server/product-error-messages";
import { isDetailEditOpen } from "@/lib/routing/modal-query";
import { revalidateProduits } from "@/lib/cache/revalidation-map";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ProductDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
    edit?: string;
    view?: string;
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

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect("/login");
  }

  const userId = data.user.id;
  const permissions = await getModulePermissions(userId, ["produits", "vente"]);

  if (!permissions.canRead) {
    redirect("/access-denied");
  }

  const product = await getProductById(params.id);

  if (!product) {
    notFound();
  }

  async function deleteProductAction() {
    "use server";

    try {
      const deletePerms = await getModulePermissions(userId, ["produits", "vente"]);

      if (!deletePerms.canDelete) {
        throw new Error("Accès refusé");
      }

      const [profile, roleKey, productRow] = await Promise.all([
        getCachedProfileRow(userId),
        getUserRole(userId),
        getProductById(params.id),
      ]);

      const productLabel = productRow?.name || params.id;

      const result = await createApprovalRequest({
        requestedBy: userId,
        requesterName: profile.displayName || "Responsable",
        requesterRole: roleKey || profile.roleKey || "",
        requesterDept: "Vente",
        actionType: SENSITIVE_ACTIONS.DELETE_PRODUCT.type,
        module: SENSITIVE_ACTIONS.DELETE_PRODUCT.module,
        targetId: params.id,
        targetLabel: productLabel,
        description: SENSITIVE_ACTIONS.DELETE_PRODUCT.description(productLabel),
        actionPayload: { id: params.id, table: "products", operation: "soft_delete" },
        priority: SENSITIVE_ACTIONS.DELETE_PRODUCT.priority,
      });

      if (!result.success) {
        redirect(`/vente/produits/${params.id}?error=${encodeURIComponent("Erreur lors de la demande")}`);
      }
    } catch (error) {
      const message = mapProductError(
        error,
        "Impossible de supprimer le produit pour le moment.",
      );

      redirect(`/vente/produits/${params.id}?error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/vente/produits?success=${encodeURIComponent("Demande envoyée. En attente d'approbation du Super Admin.")}`,
    );
  }

  async function updateProductAction(formData: FormData) {
    "use server";

    try {
      const updatePerms = await getModulePermissions(userId, ["produits", "vente"]);
      if (!updatePerms.canUpdate) {
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

      await updateProduct(params.id, payload);
      await revalidateProduits({ productId: params.id });
    } catch (error) {
      const message = mapProductError(
        error,
        "Impossible de modifier le produit pour le moment.",
      );
      redirect(`/vente/produits/${params.id}?edit=${encodeURIComponent(params.id)}&error=${encodeURIComponent(message)}`);
    }

    redirect(
      `/vente/produits/${params.id}?success=${encodeURIComponent("Produit mis à jour avec succès.")}`,
    );
  }

  return (
    <DetailPageModal
      title={product.name}
      subtitle={`SKU: ${product.sku}`}
      icon={<Package size={18} />}
      closeHref="/vente/produits"
      size="4xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          {permissions.canUpdate && (
            <EditActionLink
              href={`/vente/produits/${product.id}`}
              entityId={product.id}
              label="Modifier"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            />
          )}

          <Link
            href="/vente/produits"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          >
            Retour
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <FlashMessage
          success={searchParams?.success}
          error={searchParams?.error}
        />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Prix (GNF)
          </dt>
          <dd className="text-sm text-darktext">{product.price_gnf}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Unité
          </dt>
          <dd className="text-sm text-darktext">{product.unit}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Stock
          </dt>
          <dd className="text-sm text-darktext">{product.stock_quantity}</dd>
        </div>

        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Seuil stock bas
          </dt>
          <dd className="text-sm text-darktext">{product.stock_threshold}</dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Description
          </dt>
          <dd className="text-sm text-darktext">
            {product.description ?? "-"}
          </dd>
        </div>

        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-darktext/70">
            Image
          </dt>
          <dd className="text-sm text-darktext">
            {product.image_url ? (
              <a
                href={product.image_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Ouvrir l&apos;image
              </a>
            ) : (
              "-"
            )}
          </dd>
        </div>
      </dl>

      {permissions.canDelete ? (
        <div className="mt-6">
          <DeleteProductButton deleteAction={deleteProductAction} />
        </div>
      ) : null}

      {permissions.canUpdate && isDetailEditOpen(searchParams?.edit, params.id) ? (
        <ProductForm
          title="Modifier le produit"
          submitLabel="Enregistrer"
          action={updateProductAction}
          initialValues={product}
          productId={product.id}
          successMessage={searchParams?.success}
          errorMessage={searchParams?.error}
        />
      ) : null}
    </DetailPageModal>
  );
}