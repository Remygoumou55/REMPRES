"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GOVERNANCE_PLATFORM_NAV } from "@/modules/governance-platform/constants/nav";

export function GovernancePlatformOperationalNav() {
  const pathname = usePathname();
  const hub = "/admin/governance-platform";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-violet-100 pb-4" aria-label="Navigation gouvernance plateforme">
      {GOVERNANCE_PLATFORM_NAV.map((item) => {
        const active =
          item.href === hub
            ? pathname === hub || pathname === `${hub}/`
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-violet-900 bg-violet-50 text-violet-950"
                : "border-gray-200 bg-white text-gray-700 hover:border-violet-300 hover:bg-violet-50/50"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 opacity-80" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
