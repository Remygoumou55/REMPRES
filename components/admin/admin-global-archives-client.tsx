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
  /** Super administrateur : tables et filtres conservés, mutations masquées (gouvernance). */
  readOnly?: boolean;
};

export function AdminGlobalArchivesClient({ clients, products, readOnly = false }: AdminGlobalArchivesClientProps) {
  return (
    <div className="space-y-10">
      {readOnly ? (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4 text-sm text-amber-950 shadow-sm">
          <p className="font-semibold">Archives en supervision lecture seule</p>
          <p className="mt-1 text-xs leading-relaxed text-amber-900/90">
            Les opérations de restauration et de suppression définitive ne sont pas disponibles pour le rôle super
            administrateur sur cette vue. Les mutations restent la responsabilité des opérateurs métier habilités.
          </p>
        </div>
      ) : null}

      {/* Search Header Info */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Search size={18} />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-sm font-semibold text-darktext">Recherche dans les archives</p>
            <p className="text-xs text-darktext/70 leading-relaxed">
              Chaque tableau possède son propre filtre instantané.
              {!readOnly ? (
                <>
                  {" "}
                  Les actions groupées (restauration, suppression définitive) s&apos;appliquent uniquement aux éléments
                  visibles après filtrage.
                </>
              ) : (
                <> Aucune action groupée n&apos;est proposée en mode supervision.</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="space-y-12">
        <ArchivedClientsSection rows={clients} totalCount={clients.length} readOnly={readOnly} />
        <ArchivedProductsSection rows={products} totalCount={products.length} readOnly={readOnly} />
      </div>
    </div>
  );
}
