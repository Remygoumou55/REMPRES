"use client";

import { usePathname } from "next/navigation";

export function useActiveNav() {
  const pathname = usePathname();
  return {
    isActive: (href: string) => {
      const [path, query] = href.split("?");
      if (path === "/dashboard") {
        return pathname === "/dashboard";
      }
      const baseOk = pathname === path || pathname.startsWith(`${path}/`);
      if (!baseOk) return false;
      if (!query?.trim()) return true;
      if (typeof window === "undefined") return false;
      const expected = new URLSearchParams(query);
      const current = new URLSearchParams(window.location.search);
      let mismatch = false;
      expected.forEach((value, key) => {
        if (current.get(key) !== value) mismatch = true;
      });
      return !mismatch;
    },
    pathname: pathname ?? "",
  };
}

export type ActiveNavApi = ReturnType<typeof useActiveNav>;
