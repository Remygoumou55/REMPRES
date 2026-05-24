"use client";

import { memo } from "react";
import { Archive } from "lucide-react";
import { NavIcon } from "@/components/ui/nav-icon";
import type { ArchiveActivity, ArchiveKpi, ArchivePageData, ArchiveTable } from "@/lib/server/archives";

const KPI_STYLES: Record<ArchiveKpi["color"], { border: string; bg: string; icon: string }> = {
  blue: { border: "#2D7CC4", bg: "#EFF6FF", icon: "#2D7CC4" },
  red: { border: "#EF4444", bg: "#FEF2F2", icon: "#EF4444" },
  purple: { border: "#8B5CF6", bg: "#F5F3FF", icon: "#8B5CF6" },
  orange: { border: "#F59E0B", bg: "#FFFBEB", icon: "#F59E0B" },
  green: { border: "#10B981", bg: "#ECFDF5", icon: "#10B981" },
};

const BADGE_CLASSES: Record<"del" | "ann" | "arc", string> = {
  del: "bg-[#FEF2F2] text-[#991B1B]",
  ann: "bg-[#FFFBEB] text-[#92400E]",
  arc: "bg-[#F5F3FF] text-[#4C1D95]",
};

const DOT_CLASSES: Record<"del" | "ann" | "arc", string> = {
  del: "bg-[#EF4444]",
  ann: "bg-[#F59E0B]",
  arc: "bg-[#8B5CF6]",
};

const ArchiveKpiCard = memo(function ArchiveKpiCard({ kpi }: { kpi: ArchiveKpi }) {
  const style = KPI_STYLES[kpi.color];
  return (
    <div
      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: style.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: style.bg, color: style.icon }}
        >
          <NavIcon iconName={kpi.icon} size={18} className="shrink-0" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{kpi.label}</p>
          <p className="mt-1 text-xl font-medium text-gray-900">{kpi.count.toLocaleString("fr-FR")}</p>
          <p className="mt-0.5 text-[11px] text-gray-400">éléments archivés</p>
        </div>
      </div>
    </div>
  );
});

const ArchiveDataTable = memo(function ArchiveDataTable({ table }: { table: ArchiveTable }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2" style={{ color: table.iconColor }}>
          <NavIcon iconName={table.icon} size={18} />
          <h2 className="text-sm font-semibold text-gray-900">{table.title}</h2>
        </div>
        <span className="text-xs font-medium text-gray-500">{table.count}</span>
      </header>

      {table.rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center text-sm text-gray-500">
          <Archive size={28} className="text-gray-300" />
          Aucun élément archivé
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-[#0E4A8A] text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="px-4 py-3">{table.columns[0]}</th>
                <th className="px-4 py-3">{table.columns[1]}</th>
                <th className="px-4 py-3">{table.columns[2]}</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/80"}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.meta1}</td>
                  <td className="px-4 py-3 text-gray-600">{row.meta2}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_CLASSES[row.badge]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
});

const ArchiveActivityBlock = memo(function ArchiveActivityBlock({
  activities,
}: {
  activities: ArchiveActivity[];
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-[13px] font-medium text-gray-900">Dernières activités archivées</h2>
      {activities.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">Aucune activité récente</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {activities.map((item) => (
            <li key={item.id} className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-2">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT_CLASSES[item.type]}`} />
                <p className="text-sm text-gray-700">
                  {item.action}{" "}
                  <span className="font-semibold text-gray-900">{item.label}</span>
                  {" — "}
                  {item.module}
                </p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400">{item.timeAgo}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
});

export type ArchiveDeptViewProps = {
  data: ArchivePageData;
};

export const ArchiveDeptView = memo(function ArchiveDeptView({ data }: ArchiveDeptViewProps) {
  return (
    <div className="space-y-6">
      {data.kpis.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.kpis.map((kpi) => (
            <ArchiveKpiCard key={kpi.label} kpi={kpi} />
          ))}
        </div>
      ) : null}

      {data.tables.map((table) => (
        <ArchiveDataTable key={table.title} table={table} />
      ))}

      <ArchiveActivityBlock activities={data.recentActivity} />
    </div>
  );
});
