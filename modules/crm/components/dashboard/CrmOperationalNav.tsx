"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CRM_NAV } from "@/modules/crm/constants/nav";

export function CrmOperationalNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-4" aria-label="Navigation CRM">
      {CRM_NAV.map((item) => {
        const hub = "/vente/crm";
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
                ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-gray-50"
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
