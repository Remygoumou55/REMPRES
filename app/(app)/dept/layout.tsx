"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "@/lib/constants/departments";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

export default function DeptLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const deptKey = segments[1] ?? null;
  const department = DEPARTMENTS.find((d) => d.key === deptKey);

  return (
    <div className="space-y-3">
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard" className="hover:text-gray-800 hover:underline">
          {NAV_LABELS.home}
        </Link>
        <span>/</span>
        <Link href="/dept" className="hover:text-gray-800 hover:underline">
          {NAV_LABELS.dept}
        </Link>
        {department ? (
          <>
            <span>/</span>
            <span className="font-medium text-gray-700">{department.label}</span>
          </>
        ) : null}
      </nav>
      {children}
    </div>
  );
}

