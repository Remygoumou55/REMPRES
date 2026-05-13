import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Conteneur de largeur métier alignée sur le design system ERP.
 * À placer à l’intérieur de `page-wrapper` lorsqu’il faut borner le contenu (listes larges, admin).
 */
export function ModulePageStack({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-7xl space-y-6", className)}>{children}</div>;
}
