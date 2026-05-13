import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Enveloppe standard pour tableaux ERP : bordure, ombre, défilement horizontal.
 */
export function TableShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm", className)}>
      <div className="min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x">{children}</div>
    </div>
  );
}
