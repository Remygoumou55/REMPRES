"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";

type Props = {
  initialQuery: string;
  initialType: "all" | "individual" | "company";
  initialPageSize: "10" | "25" | "50";
};

export function ClientsFilters({ initialQuery, initialType, initialPageSize }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<Props["initialType"]>(initialType);
  const [pageSize, setPageSize] = useState<Props["initialPageSize"]>(initialPageSize);
  const skipInitialSyncRef = useRef(false);

  useEffect(() => setQuery(initialQuery), [initialQuery]);
  useEffect(() => setType(initialType), [initialType]);
  useEffect(() => setPageSize(initialPageSize), [initialPageSize]);

  const stableParams = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  /** Chaîne de requête actuelle : le navigateur a toujours la vérité (évite useSearchParams en retard). */
  const readLocationQueryString = useCallback((): string => {
    if (typeof window === "undefined") return stableParams.toString();
    const loc = window.location.search;
    return loc.startsWith("?") ? loc.slice(1) : loc;
  }, [stableParams]);

  const pushFilters = useCallback(
    (next: { q: string; type: Props["initialType"]; pageSize: Props["initialPageSize"] }) => {
      // Toujours partir de l’URL réelle en client : sinon ?create=1 peut disparaître avant que
      // useSearchParams soit à jour → le formulaire « Nouveau client » ne s’affiche jamais.
      const baseQs = readLocationQueryString() || stableParams.toString();
      const p = new URLSearchParams(baseQs);

      if (next.q.trim()) p.set("q", next.q.trim());
      else p.delete("q");

      if (next.type !== "all") p.set("type", next.type);
      else p.delete("type");

      p.set("pageSize", next.pageSize);
      p.set("page", "1");

      const qs = p.toString();
      const currentQs = readLocationQueryString() || stableParams.toString();
      if (qs === currentQs) return;

      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    },
    [pathname, readLocationQueryString, router, stableParams],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      // Au chargement direct sur ?create=1, ne pas lancer tout de suite un replace :
      // cela évite une course avec l’hydratation / useSearchParams qui pouvait effacer create.
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(
          window.location.search.startsWith("?")
            ? window.location.search.slice(1)
            : window.location.search,
        );
        if (sp.get("create") === "1" && !skipInitialSyncRef.current) {
          skipInitialSyncRef.current = true;
          return;
        }
      }
      pushFilters({ q: query, type, pageSize });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [pageSize, pushFilters, query, type]);

  return (
    <div className="grid gap-3 rounded-lg bg-white p-4 shadow-sm sm:grid-cols-4">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder="Rechercher (nom, email, téléphone)"
        className="sm:col-span-2"
      />
      <select
        value={type}
        onChange={(e) => setType(e.target.value as Props["initialType"])}
        className="rounded-md border border-gray-300 px-3 py-2"
      >
        <option value="all">Tous les types</option>
        <option value="individual">Individuel</option>
        <option value="company">Entreprise</option>
      </select>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={(e) => setPageSize(e.target.value as Props["initialPageSize"])}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="10">10 / page</option>
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
        </select>
        {isPending ? <Loader2 size={16} className="shrink-0 animate-spin text-primary" /> : null}
      </div>
    </div>
  );
}
