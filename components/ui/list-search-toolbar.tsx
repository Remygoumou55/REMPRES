import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Barre supérieure des listes data (compteur + recherche) — responsive, même grille que clients/produits ERP.
 */
export function ListSearchToolbar({
  summary,
  children,
  className,
}: {
  summary: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5",
        className,
      )}
    >
      <div className="shrink-0 text-xs font-semibold uppercase tracking-wide text-gray-400">{summary}</div>
      <div className="w-full min-w-0 sm:max-w-xs md:max-w-sm lg:max-w-md">{children}</div>
    </div>
  );
}
