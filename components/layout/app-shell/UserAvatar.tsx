"use client";

import { memo } from "react";

export const UserAvatar = memo(function UserAvatar({ initial }: { initial: string }) {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
      {(initial ?? "U").charAt(0).toUpperCase()}
    </div>
  );
});
