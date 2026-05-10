"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PLATFORM_NAV } from "@/modules/platform/constants/nav";

export function PlatformOperationalNav() {
  const pathname = usePathname();
  const hub = "/admin/platform";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4" aria-label="Navigation plateforme">
      {PLATFORM_NAV.map((item) => {
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
                ? "border-cyan-800 bg-cyan-50 text-cyan-950"
                : "border-gray-200 bg-white text-gray-700 hover:border-cyan-400 hover:bg-gray-50"
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
