"use client";

import { memo } from "react";
import { Percent, ShoppingCart, Tag, Users } from "lucide-react";

type Props = {
  returningClientsRate: number;
  averageBasket: number;
  highestSaleGnf: number;
  topCategory: string | null;
  leadConversionRate: number | null;
};

function formatGnf(n: number): string {
  return `${Math.round(n).toLocaleString("fr-FR")} GNF`;
}

function InsightRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-3 py-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-darktext">{value}</p>
      </div>
    </div>
  );
}

export const VenteStatsInsights = memo(function VenteStatsInsights({
  returningClientsRate,
  averageBasket,
  highestSaleGnf,
  topCategory,
  leadConversionRate,
}: Props) {
  return (
    <section className="card space-y-3 p-5">
      <h3 className="text-sm font-semibold text-darktext">Indicateurs clés</h3>
      <InsightRow
        icon={Users}
        label="Taux de fidélisation clients"
        value={`${returningClientsRate} %`}
      />
      <InsightRow icon={ShoppingCart} label="Panier moyen" value={formatGnf(averageBasket)} />
      <InsightRow icon={Tag} label="Vente la plus élevée" value={formatGnf(highestSaleGnf)} />
      <InsightRow
        icon={Percent}
        label="Catégorie la plus vendue"
        value={topCategory ?? "—"}
      />
      <InsightRow
        icon={Percent}
        label="Taux de conversion leads → clients"
        value={leadConversionRate != null ? `${leadConversionRate} %` : "—"}
      />
    </section>
  );
});
