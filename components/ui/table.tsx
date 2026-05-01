import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";

export function DataTable({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function DataTableHead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-gray-50/70">{children}</thead>;
}

export function DataTableHeaderCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <th className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500", className)}>
      {children}
    </th>
  );
}

export function DataTableRow({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tr className={cn("border-b border-gray-50 transition hover:bg-gray-50/60", className)}>{children}</tr>;
}

export function DataTableCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn("px-4 py-3", className)}>{children}</td>;
}

export function DataTableLoading({ colSpan = 5, rows = 5 }: { colSpan?: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={`s-${idx}`} className="border-b border-gray-50">
          <td colSpan={colSpan} className="px-4 py-3">
            <Skeleton className="h-5 w-full" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function DataTableEmpty({ colSpan = 5, title, description }: { colSpan?: number; title?: string; description?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8">
        <EmptyState
          icon={Inbox}
          title={title ?? "Aucune donnée disponible"}
          description={description ?? "Aucun élément à afficher pour le moment."}
        />
      </td>
    </tr>
  );
}
