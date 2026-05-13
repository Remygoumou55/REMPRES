import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const BTN_ACTIVE =
  "inline-flex items-center justify-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-darktext transition hover:bg-gray-50";
const BTN_DISABLED =
  "inline-flex cursor-not-allowed items-center justify-center rounded-xl border border-gray-100 px-4 py-2 text-sm font-medium text-gray-300";

export type PaginationBarProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  /** Remplace le libellé par défaut « Page X sur Y » */
  label?: ReactNode;
  /** Texte ou fragment après le libellé (ex. total résultats) */
  description?: ReactNode;
  className?: string;
  /** Si false et une seule page, ne rien rendre (défaut : true) */
  alwaysShow?: boolean;
};

/**
 * Barre de pagination serveur / client — navigation Précédent / Suivant homogène ERP.
 * Liens désactivés rendus en `<span>` (pas de `href="#"`).
 */
export function PaginationBar({
  page,
  totalPages,
  buildHref,
  label,
  description,
  className,
  alwaysShow = true,
}: PaginationBarProps) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);

  if (!alwaysShow && safeTotal <= 1) {
    return null;
  }

  const defaultLabel = (
    <>
      Page <span className="font-semibold text-darktext">{safePage}</span> sur{" "}
      <span className="font-semibold text-darktext">{safeTotal}</span>
    </>
  );

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-3.5",
        className,
      )}
    >
      <p className="text-sm text-gray-500">
        {label ?? defaultLabel}
        {description != null && description !== "" ? (
          <span className="text-darktext/80"> {description}</span>
        ) : null}
      </p>
      <div className="flex shrink-0 gap-2">
        {safePage > 1 ? (
          <Link href={buildHref(safePage - 1)} className={BTN_ACTIVE}>
            ← Précédent
          </Link>
        ) : (
          <span className={BTN_DISABLED} aria-disabled="true">
            ← Précédent
          </span>
        )}
        {safePage < safeTotal ? (
          <Link href={buildHref(safePage + 1)} className={BTN_ACTIVE}>
            Suivant →
          </Link>
        ) : (
          <span className={BTN_DISABLED} aria-disabled="true">
            Suivant →
          </span>
        )}
      </div>
    </nav>
  );
}
