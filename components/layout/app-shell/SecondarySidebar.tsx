"use client";

import { memo } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { ModuleDef } from "./types";

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/finance") return pathname === "/finance";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const SecondarySidebarPanel = memo(function SecondarySidebarPanel({
  module,
  pathname,
}: {
  module: ModuleDef | null;
  pathname: string;
}) {
  if (!module) return null;

  const visibleItems = module.items.filter((i) => i.visible);
  if (visibleItems.length === 0) return null;

  const ModuleIcon = module.icon;

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col overflow-hidden border-r border-gray-200/60 bg-gray-50/40 md:flex">
      <div className="flex flex-1 flex-col p-3 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-black/5">
          {/* En-tête du panneau */}
          <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-3.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10">
              <ModuleIcon size={13} className="text-primary" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-gray-500">
              {module.label}
            </h2>
          </div>

          {/* Liens */}
          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-0.5">
              {visibleItems.map((item) => {
                const isActive = isNavItemActive(item.href, pathname);
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch
                    className={`group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                      isActive
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-darktext"
                    }`}
                  >
                    <ItemIcon
                      size={15}
                      className={`shrink-0 transition-transform group-hover:scale-105 ${
                        isActive ? "text-white" : "text-gray-400 group-hover:text-primary"
                      }`}
                    />
                    <span className="flex-1 truncate font-medium">{item.label}</span>
                    {isActive && (
                      <ChevronRight size={12} className="shrink-0 text-white/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
});
