"use client";

import { useEffect, useMemo, useState } from "react";

type Primitive = string | number | boolean | null | undefined | Date;

type SearchAccessor<T> = keyof T | ((item: T) => Primitive | Primitive[]);

type UseGlobalSearchOptions<T> = {
  data: T[];
  searchFields: SearchAccessor<T>[];
  delay?: number;
  minQueryLength?: number;
  maxSuggestions?: number;
};

export function useGlobalSearch<T>({
  data,
  searchFields,
  delay = 250,
  minQueryLength = 0,
  maxSuggestions = 5,
}: UseGlobalSearchOptions<T>) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, delay);
    return () => window.clearTimeout(timer);
  }, [query, delay]);

  const normalizedFields = useMemo(() => searchFields, [searchFields]);

  /**
   * Index mémoire pour éviter de retraiter les champs à chaque frappe.
   * Chaque entrée contient:
   *  - valuesLower: valeurs normalisées en minuscule (filtrage rapide)
   *  - valuesRaw: valeurs originales (autocomplete / affichage)
   */
  const indexedData = useMemo(() => {
    return data.map((item) => {
      const valuesRaw: string[] = [];

      for (const field of normalizedFields) {
        const raw =
          typeof field === "function"
            ? field(item)
            : (item[field] as Primitive | Primitive[]);
        if (raw == null) continue;
        const list = Array.isArray(raw) ? raw : [raw];

        for (const v of list) {
          const s = String(v ?? "").trim();
          if (!s) continue;
          valuesRaw.push(s);
        }
      }

      return {
        item,
        valuesRaw,
        valuesLower: valuesRaw.map((s) => s.toLowerCase()),
      };
    });
  }, [data, normalizedFields]);

  const filteredData = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q || q.length < minQueryLength) return data;

    // Ranking ultra-léger: prefix > includes (ordre plus pertinent pour l'utilisateur)
    const matches: Array<{ score: number; item: T }> = [];
    for (const entry of indexedData) {
      let bestScore = 0;
      for (const val of entry.valuesLower) {
        if (val.startsWith(q)) bestScore = Math.max(bestScore, 2);
        else if (val.includes(q)) bestScore = Math.max(bestScore, 1);
      }
      if (bestScore > 0) matches.push({ score: bestScore, item: entry.item });
    }

    matches.sort((a, b) => b.score - a.score);
    return matches.map((m) => m.item);
  }, [data, debouncedQuery, minQueryLength, indexedData]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [] as string[];
    const q = debouncedQuery.toLowerCase();
    const startsWith: string[] = [];
    const includes: string[] = [];
    const seen = new Set<string>();

    for (const entry of indexedData) {
      for (let i = 0; i < entry.valuesRaw.length; i += 1) {
        const raw = entry.valuesRaw[i];
        const low = entry.valuesLower[i];
        if (seen.has(raw)) continue;
        if (low.startsWith(q)) {
          startsWith.push(raw);
          seen.add(raw);
        } else if (low.includes(q)) {
          includes.push(raw);
          seen.add(raw);
        }
      }
    }
    return [...startsWith, ...includes].slice(0, maxSuggestions);
  }, [debouncedQuery, indexedData, maxSuggestions]);

  const completion = useMemo(() => {
    const q = debouncedQuery.trim();
    if (!q) return "";
    const qLower = q.toLowerCase();
    const first = suggestions.find((s) => s.toLowerCase().startsWith(qLower));
    if (!first) return "";
    return first.slice(q.length);
  }, [debouncedQuery, suggestions]);

  return {
    query,
    setQuery,
    debouncedQuery,
    filteredData,
    suggestions,
    completion,
  };
}
