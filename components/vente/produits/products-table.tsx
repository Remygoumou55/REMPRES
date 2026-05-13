"use client";

import { memo, useMemo, useState, useTransition, useCallback } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/types/product";
import { EmptyState } from "@/components/ui/empty-state";
import { SearchInput } from "@/components/ui/search-input";
import { ProductsRowActions } from "@/components/vente/produits/products-row-actions";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import { GLOBAL_LIST_SEARCH_DEBOUNCE_MS } from "@/lib/data-listing";
import { withCreateModalQuery } from "@/lib/routing/modal-query";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { ConfirmDangerDialog } from "@/components/ui/confirm-danger-dialog";
import { BulkDeleteActionBar } from "@/components/ui/bulk-delete-action-bar";
import { ListSearchToolbar } from "@/components/ui/list-search-toolbar";
import { deleteProductsFromListBulkAction } from "@/app/(app)/vente/produits/actions";
import { useAppMutationRefresh } from "@/hooks/use-app-mutation-refresh";
import { useToast } from "@/components/providers/ToastProvider";
import { useCurrency } from "@/hooks/useCurrency";
import { useCurrencyBatchConversion } from "@/hooks/useCurrencyConversion";
import { formatCurrency } from "@/utils/currency";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

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

type ProductDataRowProps = {
  product: Product;
  checked: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
  currency: string;
  onToggle: (id: string) => void;
  formattedUnitPrice: string;
  formattedLineTotal: string;
};

const ProductDataRow = memo(function ProductDataRow({
  product,
  checked,
  canUpdate,
  canDelete,
  listQueryString,
  currency,
  onToggle,
  formattedUnitPrice,
  formattedLineTotal,
}: ProductDataRowProps) {
  const threshold = product.stock_threshold ?? 5;
  const montantGnf = product.stock_quantity * product.price_gnf;
  const dotClass = stockDotClass(product.stock_quantity, threshold);
  const dotTitle = stockDotTitle(product.stock_quantity, threshold);

  return (
    <tr className="group transition-colors hover:bg-gray-50/60">
      {canDelete ? (
        <td className="px-2 py-3.5">
          <input
            type="checkbox"
            checked={checked}
            onChange={() => onToggle(product.id)}
            aria-label={`Selectionner ${product.name}`}
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
            {formattedUnitPrice}
          </span>
          {currency !== "GNF" ? (
            <p className="text-[10px] text-gray-400">≈ {formatCurrency(product.price_gnf, "GNF")}</p>
          ) : null}
        </div>
      </td>
      <td className="px-3 py-3.5 text-right">
        <div className="text-right">
          <span className="text-xs font-bold tabular-nums text-primary">
            {product.stock_quantity > 0 ? formattedLineTotal : "-"}
          </span>
          {currency !== "GNF" && product.stock_quantity > 0 ? (
            <p className="text-[10px] text-gray-400">≈ {formatCurrency(montantGnf, "GNF")}</p>
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
});

// ---------------------------------------------------------------------------
// Virtualized Table Body (Isolated to prevent re-rendering the whole table on scroll)
// ---------------------------------------------------------------------------

const VIRTUAL_ROW_HEIGHT = 60;
const VIRTUAL_VIEWPORT_HEIGHT = 600;
const VIRTUAL_OVERSCAN = 10;

const VirtualTableBody = memo(function VirtualTableBody({
  rows,
  isVirtualized,
  selectedSet,
  toggleOne,
  canUpdate,
  canDelete,
  listQueryString,
  currency,
  formattedPrices,
  canDeleteColCount,
}: {
  rows: Product[];
  isVirtualized: boolean;
  selectedSet: Set<string>;
  toggleOne: (id: string) => void;
  canUpdate: boolean;
  canDelete: boolean;
  listQueryString: string;
  currency: string;
  formattedPrices: Record<string, string>;
  canDeleteColCount: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  const visibleCount = Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
  const endIndex = Math.min(rows.length, startIndex + visibleCount);

  const visibleRows = isVirtualized ? rows.slice(startIndex, endIndex) : rows;
  const topSpacer = isVirtualized ? startIndex * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacer = isVirtualized ? Math.max(0, (rows.length - endIndex) * VIRTUAL_ROW_HEIGHT) : 0;

  return (
    <div 
      className={`overflow-x-auto ${isVirtualized ? "max-h-[600px] overflow-y-auto" : ""}`}
      onScroll={isVirtualized ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
    >
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
        <tbody className="divide-y divide-gray-50">
          {isVirtualized && topSpacer > 0 && (
            <tr aria-hidden="true"><td colSpan={canDeleteColCount} style={{ height: `${topSpacer}px`, padding: 0 }} /></tr>
          )}
          {visibleRows.map((product) => (
            <ProductDataRow
              key={product.id}
              product={product}
              checked={selectedSet.has(product.id)}
              canUpdate={canUpdate}
              canDelete={canDelete}
              listQueryString={listQueryString}
              currency={currency}
              onToggle={toggleOne}
              formattedUnitPrice={formattedPrices[`unit:${product.id}`] || "…"}
              formattedLineTotal={formattedPrices[`line:${product.id}`] || "…"}
            />
          ))}
          {isVirtualized && bottomSpacer > 0 && (
            <tr aria-hidden="true"><td colSpan={canDeleteColCount} style={{ height: `${bottomSpacer}px`, padding: 0 }} /></tr>
          )}
        </tbody>
      </table>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

const VIRTUALIZE_THRESHOLD = 60;

export function ProductsTable({
  products,
  canUpdate = true,
  canDelete = false,
  listQueryString,
}: {
  products: Product[];
  canUpdate?: boolean;
  canDelete?: boolean;
  listQueryString: string;
}) {
  const { currency } = useCurrency();
  const { pushThenRefresh } = useAppMutationRefresh();
  const { showSuccess, showError } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);

  const searchFields = useMemo(() => ["name", "sku", "description", "unit"], []);
  const { query, setQuery, filteredData, suggestions } = useGlobalSearch<Product>({
    data: products,
    searchFields: searchFields as (keyof Product)[],
    delay: GLOBAL_LIST_SEARCH_DEBOUNCE_MS,
  });

  const rows = filteredData;
  const isVirtualized = rows.length > VIRTUALIZE_THRESHOLD;

  const convItems = useMemo(() => {
    const items: { key: string; amount: number }[] = [];
    for (const p of rows) {
      items.push({ key: `unit:${p.id}`, amount: p.price_gnf });
      if (p.stock_quantity > 0) items.push({ key: `line:${p.id}`, amount: p.stock_quantity * p.price_gnf });
    }
    if (rows.length > 1) items.push({ key: "catalogTotal", amount: rows.reduce((s, p) => s + p.stock_quantity * p.price_gnf, 0) });
    return items;
  }, [rows]);

  const { convertedByKey, loading } = useCurrencyBatchConversion(convItems, "GNF", currency);

  const formattedPrices = useMemo(() => {
    const res: Record<string, string> = {};
    for (const [k, v] of Object.entries(convertedByKey)) {
      res[k] = v === null ? "n/a" : loading ? "…" : formatCurrency(v as number, currency);
    }
    return res;
  }, [convertedByKey, currency, loading]);

  const { selectedIds, selectedSet, selectedCount, allVisibleSelected, toggleOne, toggleAllVisible, clearSelection } = 
    useRowSelection(useMemo(() => rows.map((r) => r.id), [rows]));

  const runBulkDelete = useCallback(() => {
    startTransition(async () => {
      const result = await deleteProductsFromListBulkAction(selectedIds);
      setConfirmBulkOpen(false);
      if (result.success) {
        clearSelection();
        showSuccess(`${result.data.deleted} produits supprimés.`);
        pushThenRefresh(`/vente/produits?success=bulk_deleted`);
      } else {
        showError(result.error);
      }
    });
  }, [selectedIds, clearSelection, showSuccess, showError, pushThenRefresh]);

  const totalQty = useMemo(() => rows.reduce((s, p) => s + p.stock_quantity, 0), [rows]);

  if (products.length === 0) {
    return <EmptyState icon={Package} title="Aucun produit" description="Ajoutez votre premier produit." action={<a href={withCreateModalQuery("/vente/produits")} className="bg-primary text-white px-4 py-2 rounded-xl">+ Ajouter</a>} />;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <ListSearchToolbar summary={`${rows.length} produit${rows.length === 1 ? "" : "s"}`}>
        <SearchInput
          value={query}
          onChange={setQuery}
          suggestions={suggestions}
          placeholder="Rechercher…"
          className="w-full"
        />
      </ListSearchToolbar>

      {canDelete && (
        <div className="border-b border-gray-100 px-5 py-3">
          <BulkDeleteActionBar selectedCount={selectedCount} itemLabel="produit" pending={pending} onDelete={() => setConfirmBulkOpen(true)} onClear={clearSelection} />
        </div>
      )}

      {/* HEADER IS STABLE */}
      <table className="w-full table-fixed text-sm border-b border-gray-100 bg-gray-50/60">
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
          <tr className="text-xs font-semibold uppercase text-gray-400">
            {canDelete && <th className="px-2 py-3 text-left"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} /></th>}
            <th className="px-3 py-3 text-left">Code</th>
            <th className="px-4 py-3 text-left">Nom</th>
            <th className="px-2 py-3 text-right">Qté</th>
            <th className="px-3 py-3 text-right">P.U</th>
            <th className="px-3 py-3 text-right">Montant</th>
            <th className="px-3 py-3 text-center">Actions</th>
          </tr>
        </thead>
      </table>

      {/* BODY IS ISOLATED FOR VIRTUALIZATION SCROLL PERFORMANCE */}
      <VirtualTableBody
        rows={rows}
        isVirtualized={isVirtualized}
        selectedSet={selectedSet}
        toggleOne={toggleOne}
        canUpdate={canUpdate}
        canDelete={canDelete}
        listQueryString={listQueryString}
        currency={currency}
        formattedPrices={formattedPrices}
        canDeleteColCount={canDelete ? 7 : 6}
      />

      {rows.length === 0 && products.length > 0 && (
        <div className="border-t border-gray-100 px-5 py-10 text-center">
          <p className="text-sm font-medium text-gray-600">Aucun résultat pour cette recherche</p>
          <p className="mt-1 text-xs text-gray-400">Modifiez les critères ou effacez la recherche.</p>
        </div>
      )}

      {rows.length > 1 && (
        <div className="border-t-2 border-gray-100 bg-gray-50/60 px-5 py-3 flex justify-between text-xs font-bold">
          <span className="uppercase text-gray-400">Total catalogue</span>
          <div className="flex gap-10">
            <span className="text-darktext">{totalQty}</span>
            <span className="text-primary">{formattedPrices["catalogTotal"] || "…"}</span>
          </div>
        </div>
      )}

      <ConfirmDangerDialog open={confirmBulkOpen} title="Supprimer ?" message={`Supprimer ${selectedCount} produits ?`} loading={pending} onCancel={() => setConfirmBulkOpen(false)} onConfirm={runBulkDelete} />
    </div>
  );
}
