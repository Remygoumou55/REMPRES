"use client";

import { memo, useMemo, useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { Client } from "@/types/client";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { statusTranslationKey } from "@/lib/i18n/statuses";
import {
  SalesRowActions,
  type SaleRowForActions,
} from "@/components/vente/historique/sales-row-actions";

// ---------------------------------------------------------------------------
// Config statuts & paiements (inchangée vs page historique)
// ---------------------------------------------------------------------------

const STATUT_CFG: Record<string, { variant: BadgeVariant }> = {
  pending: { variant: "warning" },
  partial: { variant: "info" },
  paid: { variant: "success" },
  overdue: { variant: "danger" },
  cancelled: { variant: "gray" },
};

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  mobile_money: "Mobile Money",
  orange_money: "Orange Money",
  bank_transfer: "Virement",
  credit: "Crédit",
  mixed: "Mixte",
};

const VIRTUALIZE_THRESHOLD = 80;
const VIRTUAL_ROW_HEIGHT = 56;
const VIRTUAL_VIEWPORT_HEIGHT = 560;
const VIRTUAL_OVERSCAN = 8;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SaleRow = {
  id: string;
  reference: string | null;
  client_id: string | null;
  total_amount_gnf: number;
  display_currency: string;
  payment_method: string | null;
  payment_status: string;
  amount_paid_gnf: number;
  created_at: string;
};

type SalesTableProps = {
  sales: SaleRow[];
  clientsById: Record<string, Client>;
  canDelete: boolean;
  listQueryString: string;
};

function getClientLabel(client: Client): string {
  if (client.client_type === "company") return client.company_name ?? "Entreprise";
  return [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client";
}

type SaleDataRowProps = {
  sale: SaleRow;
  client?: Client;
  canDelete: boolean;
  listQueryString: string;
};

const SaleDataRow = memo(function SaleDataRow({
  sale,
  client,
  canDelete,
  listQueryString,
}: SaleDataRowProps) {
  const { t, locale } = useTranslation();
  const statut =
    STATUT_CFG[sale.payment_status] ?? {
      variant: "gray" as BadgeVariant,
    };
  const isPending = sale.payment_status === "pending" || sale.payment_status === "partial";
  const labelRef = sale.reference ?? sale.id.slice(0, 8).toUpperCase();
  const saleForActions: SaleRowForActions = {
    id: sale.id,
    total_amount_gnf: sale.total_amount_gnf,
    payment_status: sale.payment_status,
  };

  return (
    <tr className="group transition-colors hover:bg-gray-50/60">
      <td className="px-5 py-3.5">
        <span className="rounded-lg bg-primary/5 px-2 py-1 font-mono text-xs font-semibold text-primary">
          {labelRef}
        </span>
      </td>

      <td className="px-5 py-3.5 font-medium text-darktext">
        {client ? (
          getClientLabel(client)
        ) : (
          <span className="italic text-gray-400">{t("sales.history.walkInClient")}</span>
        )}
      </td>

      <td className="px-5 py-3.5 text-right">
        <span className="font-bold tabular-nums text-darktext">
          {sale.total_amount_gnf.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
        </span>
        <span className="ml-1 text-xs text-gray-400">{sale.display_currency}</span>
      </td>

      <td className="hidden px-5 py-3.5 text-gray-500 md:table-cell">
        {sale.payment_method
          ? PAYMENT_LABELS[sale.payment_method] ?? sale.payment_method
          : "-"}
      </td>

      <td className="px-5 py-3.5 text-center">
        <Badge label={t(statusTranslationKey(sale.payment_status))} variant={statut.variant} dot />
      </td>

      <td className="hidden px-5 py-3.5 text-xs text-gray-400 lg:table-cell">
        {new Date(sale.created_at).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </td>

      <td className="px-5 py-3.5 text-right">
        <SalesRowActions
          sale={saleForActions}
          labelReference={labelRef}
          canDelete={canDelete}
          listQueryString={listQueryString}
          showMarkPaid={isPending}
        />
      </td>
    </tr>
  );
});

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function SalesTable({
  sales,
  clientsById,
  canDelete,
  listQueryString,
}: SalesTableProps) {
  const { t } = useTranslation();
  const [scrollTop, setScrollTop] = useState(0);
  const isVirtualized = sales.length > VIRTUALIZE_THRESHOLD;

  const startIndex = useMemo(() => {
    if (!isVirtualized) return 0;
    return Math.max(0, Math.floor(scrollTop / VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN);
  }, [isVirtualized, scrollTop]);

  const endIndex = useMemo(() => {
    if (!isVirtualized) return sales.length;
    const visibleCount =
      Math.ceil(VIRTUAL_VIEWPORT_HEIGHT / VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN * 2;
    return Math.min(sales.length, startIndex + visibleCount);
  }, [isVirtualized, sales.length, startIndex]);

  const topSpacer = isVirtualized ? startIndex * VIRTUAL_ROW_HEIGHT : 0;
  const bottomSpacer = isVirtualized ? Math.max(0, (sales.length - endIndex) * VIRTUAL_ROW_HEIGHT) : 0;
  const visibleSales = useMemo(
    () => (isVirtualized ? sales.slice(startIndex, endIndex) : sales),
    [endIndex, isVirtualized, sales, startIndex],
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div
        className={`overflow-x-auto ${isVirtualized ? "max-h-[560px] overflow-y-auto" : ""}`}
        onScroll={isVirtualized ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("sales.history.reference")}
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("sales.history.client")}
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("sales.history.total")}
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 md:table-cell">
                {t("sales.history.payment")}
              </th>
              <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("sales.history.status")}
              </th>
              <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 lg:table-cell">
                {t("sales.history.date")}
              </th>
              <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t("sales.history.actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sales.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <ShoppingBag size={28} className="text-gray-200" />
                    <p className="text-sm text-gray-400">{t("sales.history.empty")}</p>
                  </div>
                </td>
              </tr>
            ) : (
              <>
                {isVirtualized && topSpacer > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={7} style={{ height: `${topSpacer}px`, padding: 0 }} />
                  </tr>
                ) : null}
                {visibleSales.map((sale) => (
                  <SaleDataRow
                    key={sale.id}
                    sale={sale}
                    client={sale.client_id ? clientsById[sale.client_id] : undefined}
                    canDelete={canDelete}
                    listQueryString={listQueryString}
                  />
                ))}
                {isVirtualized && bottomSpacer > 0 ? (
                  <tr aria-hidden="true">
                    <td colSpan={7} style={{ height: `${bottomSpacer}px`, padding: 0 }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
