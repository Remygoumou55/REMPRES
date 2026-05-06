"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const filteredCacheRef = useRef<Map<string, T[]>>(new Map());
  const suggestionsCacheRef = useRef<Map<string, string[]>>(new Map());

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

  useEffect(() => {
    filteredCacheRef.current.clear();
    suggestionsCacheRef.current.clear();
  }, [indexedData]);

  const filteredData = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q || q.length < minQueryLength) return data;
    const cached = filteredCacheRef.current.get(q);
    if (cached) return cached;

    // If query extends a previous query, filter from the smaller cached subset.
    let source = indexedData;
    if (q.length > 1) {
      const parent = filteredCacheRef.current.get(q.slice(0, -1));
      if (parent && parent.length < data.length) {
        const parentSet = new Set(parent);
        source = indexedData.filter((entry) => parentSet.has(entry.item));
      }
    }

    // Prefix matches first, then includes.
    const prefix: T[] = [];
    const includes: T[] = [];
    for (const entry of source) {
      let bestScore = 0;
      for (const val of entry.valuesLower) {
        if (val.startsWith(q)) {
          bestScore = 2;
          break;
        }
        if (bestScore === 0 && val.includes(q)) bestScore = 1;
      }
      if (bestScore === 2) prefix.push(entry.item);
      else if (bestScore === 1) includes.push(entry.item);
    }
    const result = [...prefix, ...includes];
    filteredCacheRef.current.set(q, result);
    return result;
  }, [data, debouncedQuery, minQueryLength, indexedData]);

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [] as string[];
    const q = debouncedQuery.toLowerCase();
    const cached = suggestionsCacheRef.current.get(q);
    if (cached) return cached;
    const startsWith: string[] = [];
    const includes: string[] = [];
    const seen = new Set<string>();

    // Reuse narrowed search scope when possible.
    const pool = filteredData.length > 0 && filteredData.length < data.length
      ? new Set(filteredData)
      : null;

    for (const entry of indexedData) {
      if (pool && !pool.has(entry.item)) continue;
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
    const result = [...startsWith, ...includes].slice(0, maxSuggestions);
    suggestionsCacheRef.current.set(q, result);
    return result;
  }, [debouncedQuery, filteredData, data.length, indexedData, maxSuggestions]);

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
