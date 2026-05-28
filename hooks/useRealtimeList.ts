"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type RealtimeListEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

export type UseRealtimeListOptions<T> = {
  table: string;
  initialData: T[];
  idField?: keyof T;
  filter?: string;
  events?: RealtimeListEvent[];
  mode?: "refetch" | "optimistic";
  refetch?: () => Promise<T[]>;
};

function isSoftDeleted(row: object): boolean {
  return "deleted_at" in row && (row as { deleted_at?: unknown }).deleted_at != null;
}

export function useRealtimeList<T extends object>(
  options: UseRealtimeListOptions<T>,
) {
  const {
    table,
    initialData,
    idField = "id" as keyof T,
    filter,
    events = ["*"],
    mode = "refetch",
    refetch,
  } = options;

  const [data, setData] = useState<T[]>(initialData);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const initialDataKeyRef = useRef("");

  const initialDataKey = useMemo(
    () =>
      `${initialData.length}:${initialData.map((row) => String(row[idField])).join(",")}`,
    [initialData, idField],
  );

  const channelName = `realtime-list-${table}-${filter ?? "all"}`;
  const normalizedEvents = useMemo(
    () =>
      events.includes("*") || events.length === 0
        ? (["INSERT", "UPDATE", "DELETE"] as const)
        : events.filter((e): e is "INSERT" | "UPDATE" | "DELETE" => e !== "*"),
    [events],
  );
  const eventsKey = normalizedEvents.join(",");

  useEffect(() => {
    if (initialDataKeyRef.current === initialDataKey) return;
    initialDataKeyRef.current = initialDataKey;
    setData(initialData);
  }, [initialData, initialDataKey]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;

    const applyOptimistic = (payload: RealtimePostgresChangesPayload<T>) => {
      const eventType = payload.eventType;
      if (eventType === "INSERT") {
        const row = payload.new as T;
        if (isSoftDeleted(row)) return;
        setData((prev) => {
          if (prev.some((item) => item[idField] === row[idField])) return prev;
          return [row, ...prev];
        });
      } else if (eventType === "UPDATE") {
        const row = payload.new as T;
        if (isSoftDeleted(row)) {
          setData((prev) =>
            prev.filter((item) => item[idField] !== row[idField]),
          );
          return;
        }
        setData((prev) =>
          prev.map((item) =>
            item[idField] === row[idField] ? row : item,
          ),
        );
      } else if (eventType === "DELETE") {
        const oldRow = payload.old as T;
        setData((prev) =>
          prev.filter((item) => item[idField] !== oldRow[idField]),
        );
      }
    };

    const onChange = async (payload: RealtimePostgresChangesPayload<T>) => {
      setLastUpdated(new Date());

      if (mode === "refetch" && refetchRef.current) {
        try {
          const fresh = await refetchRef.current();
          setData(fresh);
        } catch (err) {
          console.error(`Realtime refetch error [${table}]:`, err);
        }
        return;
      }

      if (mode === "optimistic") {
        applyOptimistic(payload);
      }
    };

    try {
      channel = supabase.channel(channelName);

      for (const event of normalizedEvents) {
        channel = channel.on(
          "postgres_changes",
          {
            event,
            schema: "public",
            table,
            ...(filter ? { filter } : {}),
          },
          onChange,
        );
      }

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsLive(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsLive(false);
          console.warn(`[Realtime] list channel ${table}:`, status);
        }
      });
    } catch (err) {
      console.warn(`[Realtime] failed to subscribe [${table}]:`, err);
      setIsLive(false);
    }

    return () => {
      setIsLive(false);
      if (channel) {
        void supabase.removeChannel(channel);
      }
    };
  }, [table, filter, channelName, mode, idField, eventsKey]);

  return { data, isLive, lastUpdated };
}
