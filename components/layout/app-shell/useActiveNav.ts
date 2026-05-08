"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { ModuleId } from "./types";

export function useActiveNav(): ModuleId {
  const pathname = usePathname();

  return useMemo<ModuleId>(() => {
    if (pathname.startsWith("/direction")) return "direction";
    if (pathname.startsWith("/dept")) return "dept";
    if (pathname.startsWith("/actions")) return "actions";
    if (pathname.startsWith("/archives")) return "archives";
    if (pathname.startsWith("/admin")) return "admin";
    if (pathname.startsWith("/config")) return "config";
    if (pathname.startsWith("/settings")) return "config";
    if (pathname.startsWith("/vente")) return "commerce";
    if (pathname.startsWith("/finance")) return "finance";
    return "dashboard";
  }, [pathname]);
}

