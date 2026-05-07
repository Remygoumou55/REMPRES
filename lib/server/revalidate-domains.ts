import { revalidatePath } from "next/cache";

function uniq(paths: readonly string[]): string[] {
  return Array.from(new Set(paths.filter(Boolean)));
}

function revalidateMany(paths: readonly string[]) {
  for (const p of uniq(paths)) {
    revalidatePath(p);
  }
}

export function revalidateVenteClientsScope(params?: {
  clientId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  const id = String(params?.clientId ?? "").trim();
  const paths = [
    "/vente/clients",
    id ? `/vente/clients/${id}` : "",
    params?.includeArchives ? "/vente/clients/archives" : "",
    params?.includeArchives ? "/admin/archives" : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateVenteProductsScope(params?: {
  productId?: string | null;
  includeArchives?: boolean;
  includeDashboard?: boolean;
}) {
  const id = String(params?.productId ?? "").trim();
  const paths = [
    "/vente/produits",
    id ? `/vente/produits/${id}` : "",
    params?.includeArchives ? "/vente/produits/archives" : "",
    params?.includeArchives ? "/admin/archives" : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateVenteSalesScope(params?: {
  saleId?: string | null;
  includeDashboard?: boolean;
}) {
  const id = String(params?.saleId ?? "").trim();
  const paths = [
    "/vente/historique",
    id ? `/vente/historique/${id}` : "",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateFinanceScope(params?: { includeDashboard?: boolean }) {
  const paths = [
    "/finance",
    "/finance/depenses",
    params?.includeDashboard ? "/dashboard" : "",
  ];
  revalidateMany(paths);
}

export function revalidateAdminArchivesScope() {
  revalidateMany([
    "/admin/archives",
    "/vente/clients/archives",
    "/vente/produits/archives",
    "/vente/clients",
    "/vente/produits",
  ]);
}
