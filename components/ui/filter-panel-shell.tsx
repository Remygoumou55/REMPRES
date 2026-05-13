import type { ReactNode } from "react";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Enveloppe visuelle standard pour blocs filtres (URL / liste métier).
 * Alignée sur journal d’activité & historique ventes.
 */
export function FilterPanelShell({
  title = "Filtres",
  className,
  children,
}: {
  title?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("rounded-2xl border border-gray-100 bg-white p-4 shadow-sm", className)}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        <Filter size={12} aria-hidden className="shrink-0" />
        {title}
      </div>
      {children}
    </div>
  );
}
