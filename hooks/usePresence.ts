"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type PresenceUser = {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
  currentPage?: string | null;
  joinedAt: string;
};

type UsePresenceOptions = {
  userId: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
  currentPage?: string;
};

type PresencePayload = {
  fullName: string;
  avatarUrl: string | null;
  currentPage: string | null;
  joinedAt: string;
};

export function usePresence(options: UsePresenceOptions) {
  const { userId, fullName, avatarUrl, currentPage } = options;

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
  }, [userId, fullName, avatarUrl, currentPage]);

  const onlineCount = onlineUsers.length;
  const others = onlineUsers.filter((u) => u.userId !== userId);

  return { onlineUsers, onlineCount, others };
}
