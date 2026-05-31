import { AlertTriangle, BellRing, ShieldAlert, ShieldCheck } from "lucide-react";

export type ComplianceHealthLabels = {
  title: string;
  subtitle: string;
  critical: { label: string; hint: string };
  security: { label: string; hint: string };
  alerts: { label: string; hint: string };
  statusAllClear: string;
  statusAttention: string;
};

type MetricTone = "neutral" | "alert";

function MetricTile({
  label,
  hint,
  value,
  icon: Icon,
  tone,
  accent,
}: {
  label: string;
  hint: string;
  value: number;
  icon: typeof AlertTriangle;
  tone: MetricTone;
  accent: { border: string; iconBg: string; iconColor: string; valueColor: string };
}) {
  return (
    <article
      className="rounded-xl border border-gray-100 bg-gray-50/60 p-4"
      style={{ borderLeftWidth: 3, borderLeftColor: accent.border }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: accent.iconBg }}
        >
          <Icon size={18} style={{ color: accent.iconColor }} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-gray-500">{label}</p>
          <p
            className="mt-1 text-2xl font-semibold tabular-nums"
            style={{ color: tone === "alert" ? accent.valueColor : "#111827" }}
          >
            {value}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-gray-500">{hint}</p>
        </div>
      </div>
    </article>
  );
}

export function ComplianceHealthCard({
  criticalEvents7d,
  securityEvents7d,
  unresolvedAlerts,
  labels,
}: {
  criticalEvents7d: number;
  securityEvents7d: number;
  unresolvedAlerts: number;
  labels: ComplianceHealthLabels;
}) {
  const hasAttention = criticalEvents7d > 0 || securityEvents7d > 0 || unresolvedAlerts > 0;

  const metrics = [
    {
      key: "critical",
      label: labels.critical.label,
      hint: labels.critical.hint,
      value: criticalEvents7d,
      icon: AlertTriangle,
      accent: {
        border: "#EF4444",
        iconBg: "#FEF2F2",
        iconColor: "#DC2626",
        valueColor: "#B91C1C",
      },
    },
    {
      key: "security",
      label: labels.security.label,
      hint: labels.security.hint,
      value: securityEvents7d,
      icon: ShieldAlert,
      accent: {
        border: "#8B5CF6",
        iconBg: "#F5F3FF",
        iconColor: "#7C3AED",
        valueColor: "#6D28D9",
      },
    },
    {
      key: "alerts",
      label: labels.alerts.label,
      hint: labels.alerts.hint,
      value: unresolvedAlerts,
      icon: BellRing,
      accent: {
        border: "#F59E0B",
        iconBg: "#FFFBEB",
        iconColor: "#D97706",
        valueColor: "#B45309",
      },
    },
  ] as const;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">{labels.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{labels.subtitle}</p>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {metrics.map((metric) => (
          <MetricTile
            key={metric.key}
            label={metric.label}
            hint={metric.hint}
            value={metric.value}
            icon={metric.icon}
            tone={metric.value > 0 ? "alert" : "neutral"}
            accent={metric.accent}
          />
        ))}
      </div>

      <p
        className={`mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed ${
          hasAttention
            ? "border border-amber-200 bg-amber-50 text-amber-900"
            : "border border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}
        role="status"
      >
        {hasAttention ? labels.statusAttention : labels.statusAllClear}
      </p>
    </section>
  );
}
