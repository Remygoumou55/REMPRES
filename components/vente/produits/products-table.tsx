"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package } from "lucide-react";
import type { Product } from "@/types/product";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ProductsRowActions } from "@/components/vente/produits/products-row-actions";
import { formatGNF } from "@/lib/utils/formatCurrency";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { BulkDeleteActionBar } from "@/components/ui/bulk-delete-action-bar";
import { deleteProductsFromListBulkAction } from "@/app/(app)/vente/produits/actions";
import { useCurrency } from "@/hooks/useCurrency";
import { formatCurrency } from "@/utils/currency";

type ProductsTableProps = {
  products: Product[];
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
};

function stockDotClass(qty: number, threshold: number): string {
  if (qty <= 0) return "bg-red-500";
  if (qty <= threshold) return "bg-amber-400";
  return "bg-emerald-500";
}

function stockDotTitle(qty: number, threshold: number): string {
  if (qty <= 0) return "Rupture de stock";
  if (qty <= threshold) return `Stock faible (seuil : ${threshold})`;
  return "En stock";
}

export function ProductsTable({
  products,
  canUpdate = true,
  canDelete = false,
  listQueryString,
}: ProductsTableProps) {
  const { currency, convert } = useCurrency();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const searchFields = useMemo(
    () => [
      "name" as const,
      "sku" as const,
      "description" as const,
      "unit" as const,
      (p: Product) => [p.price_gnf, p.stock_quantity],
    ],
    [],
  );

  const { query, setQuery, filteredData, suggestions } = useGlobalSearch<Product>({
    data: products,
    searchFields,
    delay: 220,
  });

  const rows = filteredData;
  const {
    selectedIds,
    selectedSet,
    selectedCount,
    allVisibleSelected,
    toggleOne,
    toggleAllVisible,
    clearSelection,
  } = useRowSelection(rows.map((r) => r.id));

  function withListFlash(queryString: string, flash: { success?: string; error?: string }): string {
    const p = new URLSearchParams(queryString);
    p.delete("success");
    p.delete("error");
    if (flash.success) p.set("success", flash.success);
    if (flash.error) p.set("error", flash.error);
    const qs = p.toString();
    return qs ? `/vente/produits?${qs}` : "/vente/produits";
  }

  function runBulkDelete() {
    startTransition(async () => {
      const result = await deleteProductsFromListBulkAction(selectedIds);
      setConfirmBulkOpen(false);
      if (result.success) {
        clearSelection();
        router.push(
          withListFlash(listQueryString, {
            success: `${result.data.deleted} produit(s) supprimé(s) avec succès.`,
          }),
        );
      } else {
        router.push(withListFlash(listQueryString, { error: result.error }));
      }
      router.refresh();
    });
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title="Aucun produit pour l'instant"
        description="Ajoutez votre premier produit pour commencer à gérer votre catalogue."
        action={
          <Link
            href={withCreateModalQuery("/vente/produits")}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            + Ajouter un produit
          </Link>
        }
      />
    );
  }

  const totalQty = rows.reduce((s, p) => s + p.stock_quantity, 0);
  const totalAmount = rows.reduce((s, p) => s + p.stock_quantity * p.price_gnf, 0);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-5 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          {rows.length} produit{rows.length > 1 ? "s" : ""}
        </p>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSuggestionSelect={setQuery}
          suggestions={suggestions}
          placeholder="Recherche instantanée (nom, code, unité, prix...)"
          className="w-full sm:w-80"
        />
      </div>
      {canDelete ? (
        <div className="border-b border-gray-100 px-5 py-3">
          <BulkDeleteActionBar
            selectedCount={selectedCount}
            itemLabel="produit"
            pending={pending}
            onDelete={() => setConfirmBulkOpen(true)}
            onClear={clearSelection}
          />
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-sm">
          <colgroup>
            {canDelete ? <col className="w-[5%]" /> : null}
            <col className="w-[9%]" />
            <col className="w-[35%]" />
            <col className="w-[8%]" />
            <col className="w-[19%]" />
            <col className="w-[19%]" />
            <col className="w-[10%]" />
          </colgroup>

          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              {canDelete ? (
                <th className="px-2 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Tout sélectionner"
                  />
                </th>
              ) : null}
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Code article</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Nom</th>
              <th className="px-2 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Quantité</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Prix unitaire</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400 whitespace-nowrap">Montant</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {rows.map((product) => {
              const threshold = product.stock_threshold ?? 5;
              const montant = product.stock_quantity * product.price_gnf;
              const dotClass = stockDotClass(product.stock_quantity, threshold);
              const dotTitle = stockDotTitle(product.stock_quantity, threshold);

              return (
                <tr key={product.id} className="group transition-colors hover:bg-gray-50/60">
                  {canDelete ? (
                    <td className="px-2 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(product.id)}
                        onChange={() => toggleOne(product.id)}
                        aria-label={`Sélectionner ${product.name}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-3 py-3.5">
                    <span className="inline-block rounded-lg bg-gray-100 px-2.5 py-1 font-mono text-xs font-semibold text-gray-600">{product.sku}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Package size={15} />
                      </div>
                      <p className="truncate font-semibold text-darktext">{product.name}</p>
                    </div>
                  </td>
                  <td className="px-2 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${dotClass}`} title={dotTitle} />
                      <span className="font-bold tabular-nums text-darktext">{product.stock_quantity}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <div className="text-right">
                      <span className="text-xs font-semibold tabular-nums text-darktext">
                        {formatCurrency(convert(product.price_gnf, "GNF", currency), currency)}
                      </span>
                      {currency !== "GNF" ? (
                        <p className="text-[10px] text-gray-400">≈ {formatCurrency(product.price_gnf, "GNF")}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <div className="text-right">
                      <span className="text-xs font-bold tabular-nums text-primary">
                        {product.stock_quantity > 0
                          ? formatCurrency(convert(montant, "GNF", currency), currency)
                          : "—"}
                      </span>
                      {currency !== "GNF" && product.stock_quantity > 0 ? (
                        <p className="text-[10px] text-gray-400">≈ {formatCurrency(montant, "GNF")}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-center">
                    <ProductsRowActions
                      product={product}
                      name={product.name}
                      canUpdate={canUpdate}
                      canDelete={canDelete}
                      listQueryString={listQueryString}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {rows.length > 1 && (
            <tfoot>
              <tr className="border-t-2 border-gray-100 bg-gray-50/60">
                <td colSpan={canDelete ? 3 : 2} className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Total catalogue</td>
                <td className="px-3 py-3 text-right font-bold tabular-nums text-darktext">{totalQty}</td>
                <td className="px-3 py-3" />
                <td className="px-3 py-3 text-right text-xs font-bold tabular-nums text-primary">
                  {formatCurrency(convert(totalAmount, "GNF", currency), currency)}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {rows.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-gray-400">Aucun produit ne correspond à la recherche.</div>
      )}
      <ConfirmDangerDialog
        open={confirmBulkOpen}
        title="Supprimer la sélection"
        message={`Vous allez supprimer ${selectedCount} produit(s). Cette action est une suppression logique (archivage). Continuer ?`}
        confirmLabel="Supprimer la sélection"
        loadingLabel="Suppression…"
        loading={pending}
        onCancel={() => setConfirmBulkOpen(false)}
        onConfirm={runBulkDelete}
      />
    </div>
  );
}
