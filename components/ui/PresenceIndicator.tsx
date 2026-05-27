"use client";

import { memo } from "react";
import { Users } from "lucide-react";
import { usePresence } from "@/hooks/usePresence";

type Props = {
  userId: string | null;
  fullName: string | null;
  avatarUrl?: string | null;
  currentPage?: string;
};

export const PresenceIndicator = memo(function PresenceIndicator({
  userId,
  fullName,
  avatarUrl,
  currentPage,
}: Props) {
  const { onlineCount, others } = usePresence({
    userId,
    fullName,
    avatarUrl,
    currentPage,
  });

  if (onlineCount <= 1) return null;

  const tooltip = `${others.length} autre(s) utilisateur(s) en ligne:\n${others.map((u) => u.fullName).join(", ")}`;

  return (
    <div
      title={tooltip}
      className="flex cursor-default items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
      <Users size={12} className="shrink-0" />
      <span>{others.length} en ligne</span>
    </div>
  );
});
