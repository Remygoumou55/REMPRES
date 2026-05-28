"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DEPARTMENT_LABELS } from "@/lib/constants/departments";

export type PresenceUser = {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  currentPage?: string | null;
  departmentLabel?: string | null;
  joinedAt: string;
};

type UsePresenceOptions = {
  userId: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
  currentPage?: string;
  departmentKey?: string | null;
};

type PresencePayload = {
  fullName: string;
  avatarUrl: string | null;
  currentPage: string | null;
  departmentKey: string | null;
  departmentLabel: string | null;
  joinedAt: string;
};

function inferDepartmentLabel(currentPage: string | null | undefined): string | null {
  if (!currentPage) return null;
  const segments = currentPage.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  if (segments[0] === "dept" && segments[1]) {
    return DEPARTMENT_LABELS[segments[1]] ?? segments[1];
  }
  if (segments[0] === "admin") return "Super Admin";

  return DEPARTMENT_LABELS[segments[0]] ?? null;
}

export function usePresence(options: UsePresenceOptions) {
  const { userId, fullName, avatarUrl, currentPage, departmentKey } = options;

  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    if (!userId || !fullName) return;

    const supabase = getSupabaseBrowserClient();
    let channel: RealtimeChannel | null = null;

    try {
      channel = supabase.channel("rempres-presence", {
        config: { presence: { key: userId } },
      });

      channel.on("presence", { event: "sync" }, () => {
        const state = channel?.presenceState() ?? {};
        const users: PresenceUser[] = [];
        for (const key of Object.keys(state)) {
          const presences = state[key] as unknown as PresencePayload[];
          if (presences.length > 0) {
            const p = presences[0];
            users.push({
              userId: key,
              fullName: p.fullName ?? key,
              avatarUrl: p.avatarUrl ?? null,
              currentPage: p.currentPage ?? null,
              departmentLabel: p.departmentLabel ?? inferDepartmentLabel(p.currentPage),
              joinedAt: p.joinedAt ?? new Date().toISOString(),
            });
          }
        }
        setOnlineUsers(users);
      });

      channel.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && channel) {
          await channel.track({
            fullName,
            avatarUrl: avatarUrl ?? null,
            currentPage: currentPage ?? null,
            departmentKey: departmentKey ?? null,
            departmentLabel: departmentKey ? (DEPARTMENT_LABELS[departmentKey] ?? departmentKey) : inferDepartmentLabel(currentPage),
            joinedAt: new Date().toISOString(),
          });
        }
      });
    } catch (err) {
      console.warn("[Realtime] presence subscribe failed:", err);
    }

    return () => {
      if (channel) {
        void channel.untrack();
        void supabase.removeChannel(channel);
      }
      setOnlineUsers([]);
    };
  }, [userId, fullName, avatarUrl, currentPage, departmentKey]);

  const onlineCount = onlineUsers.length;
  const others = onlineUsers.filter((u) => u.userId !== userId);

  return { onlineUsers, onlineCount, others };
}
