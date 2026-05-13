"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { normalizeFinanceCfoData } from "@/lib/finance-cfo-normalize";
import type { FinanceCfoData } from "@/lib/server/finance-overview";
import { queryKeys } from "@/lib/query/query-keys";
import { reportRealtimeError } from "@/lib/monitoring/error-monitor";
import { nowMs, reportDuration, reportIfSlow } from "@/lib/monitoring/performance-monitor";
import { ENTERPRISE_REALTIME_CLIENT_REFETCH_DEBOUNCE_MS } from "@/lib/realtime/refresh-policy";

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

function finiteNum(v: unknown, fb: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
}

function deltaPct(v: unknown, fb: number | null): number | null {
  if (v === null) return null;
  return typeof v === "number" && Number.isFinite(v) ? v : fb;
}

/** Fusionne une réponse API avec l’état courant pour éviter `.map` sur undefined après JSON partiel. */
function mergeFinanceSnapshot(prev: FinanceCfoData, incoming: unknown): FinanceCfoData {
  if (!incoming || typeof incoming !== "object") return prev;
  const i = incoming as Partial<FinanceCfoData>;
  const arr = <T>(v: unknown, fb: T[]): T[] => (Array.isArray(v) ? (v as T[]) : fb);

  const deltaIn = i.delta;
  const prevIn = i.previous;

  return {
    totalRevenue: finiteNum(i.totalRevenue, prev.totalRevenue),
    grossSaleRevenue: finiteNum(i.grossSaleRevenue, prev.grossSaleRevenue),
    cancelledSaleRevenue: finiteNum(i.cancelledSaleRevenue, prev.cancelledSaleRevenue),
    netSaleRevenue: finiteNum(i.netSaleRevenue, prev.netSaleRevenue),
    totalExpenses: finiteNum(i.totalExpenses, prev.totalExpenses),
    profit: finiteNum(i.profit, prev.profit),
    marginPct:
      i.marginPct === undefined
        ? prev.marginPct
        : i.marginPct === null || (typeof i.marginPct === "number" && Number.isFinite(i.marginPct))
          ? i.marginPct
          : prev.marginPct,
    avgDailyRevenue: finiteNum(i.avgDailyRevenue, prev.avgDailyRevenue),
    avgDailyExpenses: finiteNum(i.avgDailyExpenses, prev.avgDailyExpenses),
    dayCount: finiteNum(i.dayCount, prev.dayCount),
    chartInRange: arr(i.chartInRange, prev.chartInRange),
    chartLast7d: arr(i.chartLast7d, prev.chartLast7d),
    cashflowInRange: arr(i.cashflowInRange, prev.cashflowInRange),
    expensesByCategory: arr(i.expensesByCategory, prev.expensesByCategory),
    previous:
      prevIn && typeof prevIn === "object"
        ? {
            totalRevenue: finiteNum(prevIn.totalRevenue, prev.previous.totalRevenue),
            grossSaleRevenue: finiteNum(prevIn.grossSaleRevenue, prev.previous.grossSaleRevenue),
            cancelledSaleRevenue: finiteNum(
              prevIn.cancelledSaleRevenue,
              prev.previous.cancelledSaleRevenue,
            ),
            netSaleRevenue: finiteNum(prevIn.netSaleRevenue, prev.previous.netSaleRevenue),
            totalExpenses: finiteNum(prevIn.totalExpenses, prev.previous.totalExpenses),
            profit: finiteNum(prevIn.profit, prev.previous.profit),
          }
        : prev.previous,
    delta:
      deltaIn && typeof deltaIn === "object"
        ? {
            revenuePct:
              deltaIn.revenuePct === undefined
                ? prev.delta.revenuePct
                : deltaPct(deltaIn.revenuePct, prev.delta.revenuePct),
            expensesPct:
              deltaIn.expensesPct === undefined
                ? prev.delta.expensesPct
                : deltaPct(deltaIn.expensesPct, prev.delta.expensesPct),
            profitPct:
              deltaIn.profitPct === undefined
                ? prev.delta.profitPct
                : deltaPct(deltaIn.profitPct, prev.delta.profitPct),
          }
        : prev.delta,
  };
}

/**
 * Met à jour les données sans rechargement complet (fetch JSON + option Realtime Supabase).
 */
export function useFinanceLiveData(params: Params) {
  const { initialData, from, to, categoryIds, createdBy } = params;
  const [data, setData] = useState<FinanceCfoData>(() => normalizeFinanceCfoData(initialData));
  const [updatedAt, setUpdatedAt] = useState(() => new Date());
  const [refreshing, setRefreshing] = useState(false);
  const inFlightRef = useRef(false);
  const queuedRef = useRef(false);

  const queryString = useMemo(
    () => buildQuery({ from, to, categoryIds, createdBy }),
    [from, to, categoryIds, createdBy],
  );
  const snapshotKey = useMemo(
    () => queryKeys.finance.snapshot({ from, to, categoryIds, createdBy }),
    [from, to, categoryIds, createdBy],
  );

  useEffect(() => {
    setData(normalizeFinanceCfoData(initialData));
  }, [initialData, snapshotKey, queryString]);

  const refetch = useCallback(async () => {
    if (inFlightRef.current) {
      queuedRef.current = true;
      return;
    }
    inFlightRef.current = true;
    setRefreshing(true);
    const startedAt = nowMs();
    try {
      const res = await fetch(`/api/finance/snapshot?${queryString}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { data?: unknown; updatedAt?: string };
      setData((prev) => normalizeFinanceCfoData(mergeFinanceSnapshot(prev, json.data)));
      setUpdatedAt(new Date(json.updatedAt ?? Date.now()));
    } catch {
      /* réseau / JSON */
    } finally {
      reportDuration("finance_snapshot_refetch", startedAt, { query: queryString });
      reportIfSlow("finance_snapshot_refetch", startedAt, 1200, { query: queryString });
      inFlightRef.current = false;
      setRefreshing(false);
      if (queuedRef.current) {
        queuedRef.current = false;
        void refetch();
      }
    }
  }, [queryString]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;
      void refetch();
    }, POLL_MS);
    return () => window.clearInterval(id);
  }, [refetch, snapshotKey, queryString]);

  useEffect(() => {
    let ch: RealtimeChannel | null = null;
    let debounceId: number | null = null;
    try {
      const supa = getSupabaseBrowserClient();
      ch = supa
        .channel(`finance-ft:${snapshotKey.join("|")}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "financial_transactions" },
          () => {
            if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
            if (debounceId) window.clearTimeout(debounceId);
            debounceId = window.setTimeout(() => {
              void refetch();
            }, ENTERPRISE_REALTIME_CLIENT_REFETCH_DEBOUNCE_MS);
          },
        )
        .subscribe();
    } catch (e) {
      reportRealtimeError("finance-ft", e, { query: queryString, fallback: "polling" });
      return;
    }
    return () => {
      try {
        if (debounceId) {
          window.clearTimeout(debounceId);
        }
        const supa = getSupabaseBrowserClient();
        if (ch) void supa.removeChannel(ch);
      } catch {
        /* noop */
      }
    };
  }, [refetch, snapshotKey, queryString]);

  return { data, updatedAt, refreshing, refetch };
}
