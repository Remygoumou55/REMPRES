"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getSuperAdminNavSegment, SUPER_ADMIN_HEADER_LABELS } from "@/lib/navigation/super-admin-nav";

export function SuperAdminNavContextLabel({ pathname }: { pathname: string }) {
  const search = useSearchParams();
  const text = useMemo(
    () => SUPER_ADMIN_HEADER_LABELS[getSuperAdminNavSegment(pathname, search)],
    [pathname, search],
  );
  return <>{text}</>;
}
