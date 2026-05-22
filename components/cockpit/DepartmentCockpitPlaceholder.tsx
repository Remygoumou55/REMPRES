import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  LayoutDashboard,
  LineChart,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";
import { COCKPIT_ZONE_ORDER } from "@/lib/navigation/erp-ux-architecture";
import { resolveEffectiveDepartmentKey } from "@/lib/navigation/home-route";

type DepartmentCockpitPlaceholderProps = {
  departmentKey: string;
  userDisplayName: string;
  quickActionHrefs?: readonly string[];
};

const ZONE_LABELS: Record<(typeof COCKPIT_ZONE_ORDER)[number], string> = {
  context_header: "Contexte",
  kpi_primary: "Indicateurs",
  alerts: "Alertes",
  charts: "Graphiques",
  recent_activity: "Activité récente",
  quick_actions: "Actions rapides",
};

const PLACEHOLDER_KPIS = [
  { title: "Indicateur 1", icon: BarChart3 },
  { title: "Indicateur 2", icon: LineChart },
  { title: "Indicateur 3", icon: Activity },
  { title: "Indicateur 4", icon: LayoutDashboard },
] as const;

export function DepartmentCockpitPlaceholder({
  departmentKey,
  userDisplayName,
  quickActionHrefs = [],
}: DepartmentCockpitPlaceholderProps) {
  const effective = resolveEffectiveDepartmentKey(departmentKey);
  const nav = effective ? DEPARTMENT_NAVIGATION[effective as DepartmentKey] : null;
  const deptLabel = nav?.label ?? "Département";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title={`Cockpit ${deptLabel}`}
        subtitle="Vue d'accueil départementale — structure M3 (données métier au build suivant)."
      />

      <section aria-label={ZONE_LABELS.context_header} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-500">
          Bonjour <span className="font-semibold text-gray-800">{userDisplayName}</span> —{" "}
          {deptLabel}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Zones cockpit ordonnées : {COCKPIT_ZONE_ORDER.join(" → ")}
        </p>
      </section>

      <section aria-label={ZONE_LABELS.kpi_primary}>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          {ZONE_LABELS.kpi_primary}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {PLACEHOLDER_KPIS.map(({ title, icon: Icon }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-medium text-gray-500">{title}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-300">—</p>
                  <p className="mt-1 text-[11px] text-gray-400">Connecté au build métier</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-2 text-gray-400">
                  <Icon size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-label={ZONE_LABELS.alerts} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-amber-600" />
            <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.alerts}</h2>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-6 text-sm text-gray-500">
            <AlertTriangle size={16} className="shrink-0 text-gray-400" />
            Aucune alerte active — flux métier à brancher.
          </div>
        </section>

        <section aria-label={ZONE_LABELS.charts} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <LineChart size={16} className="text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.charts}</h2>
          </div>
          <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
            Zone graphiques — placeholder M3
          </div>
        </section>
      </div>

      <section aria-label={ZONE_LABELS.recent_activity} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Activity size={16} className="text-gray-600" />
          <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.recent_activity}</h2>
        </div>
        <p className="text-sm text-gray-500">Aucune activité récente à afficher pour le moment.</p>
      </section>

      {quickActionHrefs.length > 0 ? (
        <section aria-label={ZONE_LABELS.quick_actions} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Zap size={16} className="text-primary" />
            <h2 className="text-sm font-semibold text-gray-800">{ZONE_LABELS.quick_actions}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickActionHrefs.map((href) => (
              <Link
                key={href}
                href={href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-primary/30 hover:bg-white hover:text-primary"
              >
                {href}
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
