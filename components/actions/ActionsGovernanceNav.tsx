"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GOVERNANCE_ACTIONS_NAV, governanceNavActiveId } from "@/lib/actions/governance-nav";

export function ActionsGovernanceNav() {
  const pathname = usePathname() || "";
  const active = governanceNavActiveId(pathname);

  return (
    <nav
      aria-label="Module Actions — gouvernance"
      className="sticky top-0 z-30 border-b border-gray-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
    >
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-5">
        <div className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {GOVERNANCE_ACTIONS_NAV.map((item) => {
            const isActive = item.id === active;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-darktext"
                }`}
              >
                <Icon size={16} className="shrink-0 opacity-90" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
