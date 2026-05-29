"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";
import { FINANCE_MODULE_NAV } from "@/modules/finance/constants/module-nav";

function FinanceModuleNavInner() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/finance/enterprise") ||
    pathname.startsWith("/finance/visual")
  ) {
    return null;
  }

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-4"
      aria-label="Navigation Finance"
    >
      {FINANCE_MODULE_NAV.map((item) => {
        const active =
          item.href === "/finance"
            ? pathname === "/finance" || pathname === "/finance/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            prefetch={false}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:bg-gray-50"
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

export const FinanceModuleNav = memo(FinanceModuleNavInner);
