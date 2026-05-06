"use client";

import { Search } from "lucide-react";
import { type AdminArchiveClientRow } from "./archives/ArchivedClientsSection";
import { type AdminArchiveProductRow } from "./archives/ArchivedProductsSection";
import { ArchivedClientsSection } from "./archives/ArchivedClientsSection";
import { ArchivedProductsSection } from "./archives/ArchivedProductsSection";

export type { AdminArchiveClientRow, AdminArchiveProductRow };

type AdminGlobalArchivesClientProps = {
  clients: AdminArchiveClientRow[];
  products: AdminArchiveProductRow[];
};

export function AdminGlobalArchivesClient({ clients, products }: AdminGlobalArchivesClientProps) {
  return (
    <div className="space-y-10">
      {/* Search Header Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search size={18} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-darktext">Recherche dans les archives</p>
            <p className="text-xs text-darktext/70 leading-relaxed">
              Chaque tableau possède son propre filtre instantané. Les actions groupées (restauration, suppression définitive) 
              s&apos;appliquent uniquement aux éléments visibles après filtrage.
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        <ArchivedClientsSection rows={clients} totalCount={clients.length} />
        <ArchivedProductsSection rows={products} totalCount={products.length} />
      </div>
    </div>
  );
}
