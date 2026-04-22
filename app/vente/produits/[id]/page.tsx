import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { getProductById, softDeleteProduct } from "@/lib/server/products";
import { FlashMessage } from "@/components/ui/flash-message";
import { DeleteProductButton } from "@/components/vente/produits/delete-product-button";
import { getModulePermissions } from "@/lib/server/permissions";
import { mapProductError } from "@/lib/server/product-error-messages";

type ProductDetailPageProps = {
  params: {
    id: string;
  };
  searchParams?: {
    success?: string;
    error?: string;
  };
};

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
      const permissions = await getModulePermissions(userId, ["produits", "vente"]);
      if (!permissions.canDelete) {
        throw new Error("Accès refusé");
      }

      const requestHeaders = headers();
      await softDeleteProduct(params.id, userId, {
        ip: requestHeaders.get("x-forwarded-for") ?? requestHeaders.get("x-real-ip"),
        userAgent: requestHeaders.get("user-agent"),
      });
    } catch (error) {
      const message = mapProductError(error, "Impossible de supprimer le produit pour le moment.");
      redirect(`/vente/produits/${params.id}?error=${encodeURIComponent(message)}`);
    }
    redirect(`/vente/produits?success=${encodeURIComponent("Produit supprimé avec succès.")}`);
  }

  return (
    <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-darktext">{product.name}</h1>
          <p className="mt-1 text-sm text-darktext/70">SKU: {product.sku}</p>
        </div>
        <div className="flex gap-2">
          {permissions.canUpdate ? (
            <Link
              href={`/vente/produits/${product.id}/edit`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white"
            >
              Modifier
            </Link>
          ) : null}
          <Link
            href="/vente/produits"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-darktext"
          >
            Retour
          </Link>
        </div>
      </div>

      <div className="mt-4">
        <FlashMessage success={searchParams?.success} error={searchParams?.error} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">Prix (GNF)</dt>
          <dd className="text-sm text-darktext">{product.price_gnf}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">Unité</dt>
          <dd className="text-sm text-darktext">{product.unit}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">Stock</dt>
          <dd className="text-sm text-darktext">{product.stock_quantity}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase text-darktext/70">Seuil stock bas</dt>
          <dd className="text-sm text-darktext">{product.stock_threshold}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-darktext/70">Description</dt>
          <dd className="text-sm text-darktext">{product.description ?? "-"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase text-darktext/70">Image</dt>
          <dd className="text-sm text-darktext">
            {product.image_url ? (
              <a href={product.image_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
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
          <form id="delete-product-form" action={deleteProductAction}>
            <DeleteProductButton />
          </form>
        </div>
      ) : null}
    </div>
  );
}

