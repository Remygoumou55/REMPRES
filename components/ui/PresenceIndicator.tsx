"use client";

import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";

type Props = {
  userId: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
  currentPage?: string;
  departmentKey?: string | null;
};

export const PresenceIndicator = memo(function PresenceIndicator({
  userId,
  fullName,
  avatarUrl,
  currentPage,
  departmentKey,
}: Props) {
  const { onlineCount, onlineUsers } = usePresence({
    userId,
    fullName,
    avatarUrl,
    currentPage,
    departmentKey,
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (rootRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const sortedUsers = useMemo(
    () =>
      [...onlineUsers].sort((a, b) => {
        if (a.userId === userId) return -1;
        if (b.userId === userId) return 1;
        return a.fullName.localeCompare(b.fullName, "fr");
      }),
    [onlineUsers, userId],
  );

  if (onlineCount <= 0) return null;

  const countLabel = `${onlineCount} en ligne`;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600 transition hover:bg-gray-100"
        aria-expanded={open}
        aria-label="Utilisateurs en ligne"
      >
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
        <Users size={12} className="shrink-0" />
        <span>{countLabel}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white p-2 shadow-lg">
          <p className="px-2 pb-2 pt-1 text-xs font-semibold text-gray-500">Utilisateurs en ligne</p>
          <ul className="max-h-64 space-y-1 overflow-auto">
            {sortedUsers.map((user) => (
              <li
                key={user.userId}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-xs hover:bg-gray-50"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-800">
                    {user.fullName}
                    {user.userId === userId ? (
                      <span className="ml-2 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        Vous
                      </span>
                    ) : null}
                  </p>
                  <p className="truncate text-[11px] text-gray-500">{user.departmentLabel ?? "Département inconnu"}</p>
                </div>
                <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
});
