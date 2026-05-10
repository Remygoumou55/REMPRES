"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { RESILIENCE_NAV } from "@/modules/resilience/constants/nav";

export function ResilienceOperationalNav() {
  const pathname = usePathname();
  const hub = "/admin/resilience";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-amber-100 pb-4" aria-label="Navigation résilience & tests">
      {RESILIENCE_NAV.map((item) => {
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
                ? "border-amber-900 bg-amber-50 text-amber-950"
                : "border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50/60"
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
