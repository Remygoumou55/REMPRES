"use client";

import Link from "next/link";
import { ClipboardList, Filter } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { ActivityLogTimelineRow } from "@/components/admin/activity-log-timeline-row";
import { useGlobalSearch } from "@/lib/hooks/use-global-search";
import type { Json } from "@/types/database.types";

type ActivityItem = {
  id: string;
  actor_user_id: string;
  module_key: string;
  action_key: string;
  target_table: string | null;
  target_id: string | null;
  metadata: Json;
  created_at: string;
  actorName: string;
};

type Props = {
  items: ActivityItem[];
  resetHref: string;
};

export function ActivityLogsSearchList({ items, resetHref }: Props) {
  const { query, setQuery, filteredData, suggestions } = useGlobalSearch<ActivityItem>({
    data: items,
    searchFields: [
      "actorName",
      "module_key",
      "action_key",
      "target_table",
      "target_id",
      (r) => JSON.stringify(r.metadata ?? {}),
    ],
    delay: 220,
  });

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          <Filter size={12} />
          Recherche instantanée
        </div>
        <SearchInput
          value={query}
          onChange={setQuery}
          onSuggestionSelect={setQuery}
          suggestions={suggestions}
          placeholder="Rechercher (acteur, module, action, cible...)"
          className="w-full sm:max-w-md"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ClipboardList size={32} className="text-gray-300" />
            <p className="text-sm font-medium text-gray-400">
              {query ? "Aucun événement ne correspond à la recherche" : "Aucun événement trouvé"}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <span>{query ? "Essayez un autre mot-clé." : "Modifiez vos filtres pour voir d'autres résultats."}</span>
              {query && (
                <Link href={resetHref} className="text-primary hover:underline">
                  Réinitialiser
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filteredData.map((row, idx) => (
              <ActivityLogTimelineRow
                key={row.id}
                row={row}
                actorName={row.actorName}
                isLast={idx === filteredData.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
