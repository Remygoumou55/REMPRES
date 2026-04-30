"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { FinanceCfoData } from "@/lib/server/finance-overview";

const POLL_MS = 22_000;

type Params = {
  initialData: FinanceCfoData;
  from: string;
  to: string;
  categoryIds: string[];
  createdBy: string | null;
};

function buildQuery(p: Pick<Params, "from" | "to" | "categoryIds" | "createdBy">): string {
  const q = new URLSearchParams();
  q.set("from", p.from);
  q.set("to", p.to);
  for (const c of p.categoryIds) q.append("category", c);
  if (p.createdBy) q.set("createdBy", p.createdBy);
  return q.toString();
}

/**
 * Met à jour les données sans rechargement complet (fetch JSON + option Realtime Supabase).
 */
export function useFinanceLiveData(params: Params) {
  const { initialData, from, to, categoryIds, createdBy } = params;
  const [data, setData] = useState<FinanceCfoData>(initialData);
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);

  const queryString = useMemo(
    () => buildQuery({ from, to, categoryIds, createdBy }),
    [from, to, categoryIds, createdBy],
  );

  useEffect(() => {
    setData(initialData);
  }, [initialData, queryString]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/finance/snapshot?${queryString}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { data: FinanceCfoData; updatedAt?: string };
      if (json?.data) {
        setData(json.data);
        setUpdatedAt(new Date(json.updatedAt ?? Date.now()));
      }
    } finally {
      setRefreshing(false);
    }
  }, [queryString]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void refetch();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch]);

  useEffect(() => {
    const supa = getSupabaseBrowserClient();
    const ch = supa
      .channel("finance-ft")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "financial_transactions" },
        () => {
          void refetch();
        },
      )
      .subscribe();
    return () => {
      void supa.removeChannel(ch);
    };
  }, [refetch]);

  return { data, updatedAt, refreshing, refetch };
}
