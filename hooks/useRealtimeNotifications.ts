"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { createDebouncedCallback } from "@/lib/governance/runtime/debounce";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { ROLE_KEYS, effectiveAuthRoleKey } from "@/lib/auth/roles";

export type NotificationItem = {
  id: string;
  type: "approval" | "alert" | "info";
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  action_url?: string;
};

type DbNotificationRow = {
  id: string;
  type: string | null;
  title: string;
  message: string | null;
  created_at: string | null;
  read_at: string | null;
  link: string | null;
};

type UseRealtimeNotificationsOptions = {
  userId: string | null;
  role: string | null;
  initialCount?: number;
};

function mapNotificationType(raw: string | null | undefined): NotificationItem["type"] {
  const t = String(raw ?? "").toLowerCase();
  if (t.includes("approval") || t.includes("validation")) return "approval";
  if (t.includes("alert") || t.includes("reject") || t.includes("rejet")) return "alert";
  return "info";
}

function mapNotificationRow(row: DbNotificationRow): NotificationItem {
  return {
    id: row.id,
    type: mapNotificationType(row.type),
    title: row.title,
    message: row.message ?? "",
    created_at: row.created_at ?? new Date().toISOString(),
    read: row.read_at != null,
    action_url: row.link ?? undefined,
  };
}

export function useRealtimeNotifications({
  userId,
  role,
  initialCount = 0,
}: UseRealtimeNotificationsOptions) {
  const [unreadCount, setUnreadCount] = useState(initialCount);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelsRef = useRef<RealtimeChannel[]>([]);

  const isSuperAdmin = effectiveAuthRoleKey(role) === ROLE_KEYS.SUPER_ADMIN;

  const fetchInitialCount = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();

    try {
      let total = 0;

      if (isSuperAdmin) {
        const [{ count: pendingApprovals }, { count: unreadAlerts }] = await Promise.all([
          supabase
            .from("approval_requests")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("governance_alerts")
            .select("id", { count: "exact", head: true })
            .eq("status", "unread"),
        ]);
        total += pendingApprovals ?? 0;
        total += unreadAlerts ?? 0;
      }

      const { data, error } = await supabase
        .from("notifications" as never)
        .select("id, type, title, message, created_at, read_at, link")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Notification fetch error:", error.message);
      } else if (data) {
        const rows = (data as DbNotificationRow[]).map(mapNotificationRow);
        setNotifications(rows);
        const unreadNotifs = rows.filter((n) => !n.read).length;
        if (!isSuperAdmin) {
          total = unreadNotifs;
        } else {
          total += unreadNotifs;
        }
      }

      setUnreadCount(total);
    } catch (err) {
      console.error("Notification fetch error:", err);
    }
  }, [userId, isSuperAdmin]);

  const debouncedRefetchCount = useMemo(
    () => createDebouncedCallback(() => {
      void fetchInitialCount();
    }, 800),
    [fetchInitialCount],
  );

  useEffect(() => {
    if (!userId) return;

    void fetchInitialCount();

    const supabase = getSupabaseBrowserClient();
    const channels: RealtimeChannel[] = [];

    const subscribeStatus = (channel: RealtimeChannel) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setIsConnected(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setIsConnected(false);
          console.warn("[Realtime] notification channel:", status);
        }
      });
    };

    if (isSuperAdmin) {
      const approvalChannel = supabase
        .channel(`realtime-approvals-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "approval_requests",
          },
          () => {
            debouncedRefetchCount();
          },
        );
      subscribeStatus(approvalChannel);
      channels.push(approvalChannel);

      const alertsChannel = supabase
        .channel(`realtime-governance-alerts-${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "governance_alerts",
          },
          () => {
            debouncedRefetchCount();
          },
        );
      subscribeStatus(alertsChannel);
      channels.push(alertsChannel);
    }

    const notifChannel = supabase
      .channel(`realtime-notif-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as DbNotificationRow;
          const mapped = mapNotificationRow(row);
          setNotifications((prev) => [mapped, ...prev].slice(0, 20));
          if (!mapped.read) {
            setUnreadCount((prev) => prev + 1);
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          debouncedRefetchCount();
        },
      );
    subscribeStatus(notifChannel);
    channels.push(notifChannel);

    channelsRef.current = channels;

    return () => {
      setIsConnected(false);
      for (const ch of channelsRef.current) {
        void supabase.removeChannel(ch);
      }
      channelsRef.current = [];
    };
  }, [userId, isSuperAdmin, debouncedRefetchCount]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const supabase = getSupabaseBrowserClient();
    const now = new Date().toISOString();

    try {
      const { error } = await supabase
        .from("notifications" as never)
        .update({ read_at: now } as never)
        .eq("user_id", userId)
        .is("read_at", null);

      if (error) {
        console.error("markAllRead failed:", error.message);
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      if (isSuperAdmin) {
        await fetchInitialCount();
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("markAllRead failed:", err);
    }
  }, [userId, isSuperAdmin, fetchInitialCount]);

  return {
    unreadCount,
    notifications,
    isConnected,
    markAllRead,
    refetch: fetchInitialCount,
  };
}
