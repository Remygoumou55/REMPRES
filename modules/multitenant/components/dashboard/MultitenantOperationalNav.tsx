"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MULTITENANT_NAV } from "@/modules/multitenant/constants/nav";

export function MultitenantOperationalNav() {
  const pathname = usePathname();
  const hub = "/admin/multitenant";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4" aria-label="Navigation multi-tenant">
      {MULTITENANT_NAV.map((item) => {
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
                ? "border-emerald-800 bg-emerald-50 text-emerald-950"
                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-400 hover:bg-gray-50"
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
