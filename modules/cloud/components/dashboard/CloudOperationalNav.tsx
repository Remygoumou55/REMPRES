"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CLOUD_NAV } from "@/modules/cloud/constants/nav";

export function CloudOperationalNav() {
  const pathname = usePathname();
  const hub = "/admin/cloud";

  return (
    <nav className="flex flex-wrap gap-2 border-b border-sky-100 pb-4" aria-label="Navigation cloud mondial">
      {CLOUD_NAV.map((item) => {
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
                ? "border-indigo-800 bg-indigo-50 text-indigo-950"
                : "border-gray-200 bg-white text-gray-700 hover:border-sky-400 hover:bg-sky-50/60"
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
