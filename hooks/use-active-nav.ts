"use client";

import { usePathname } from "next/navigation";

export function useActiveNav() {
  const pathname = usePathname();
  return {
    isActive: (href: string) => {
      const [path] = href.split("?");
      if (path === "/dashboard") {
        return pathname === "/dashboard";
      }
      return pathname === path || (path !== "/" && pathname.startsWith(`${path}/`));
    },
    pathname: pathname ?? "",
  };
}

export type ActiveNavApi = ReturnType<typeof useActiveNav>;
