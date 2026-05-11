import type { ReactNode } from "react";

export type DashboardWidgetShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Enveloppe visuelle standard pour widgets dashboard (cartes enterprise). */
export function DashboardWidgetShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: DashboardWidgetShellProps) {
  return (
    <section className={`card flex flex-col gap-3 p-4 ${className ?? ""}`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-darktext">{title}</h3>
          {subtitle ? <p className="mt-0.5 text-xs text-gray-600">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}
