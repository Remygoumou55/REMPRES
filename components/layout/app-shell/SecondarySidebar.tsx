"use client";

import { memo } from "react";
import type { ModuleDef } from "./types";
import { GovernanceSidebarSection } from "@/components/governance/sidebar/GovernanceSidebarSection";

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
            <div className="space-y-3">
              {Array.from(new Set(visibleItems.map((item) => item.section ?? "__default"))).map((sectionKey) => {
                const sectionItems = visibleItems.filter((item) => (item.section ?? "__default") === sectionKey);
                return (
                  <GovernanceSidebarSection
                    key={sectionKey}
                    title={sectionKey === "__default" ? module.label : sectionKey}
                    items={sectionItems.map((item) => ({
                      href: item.href,
                      label: item.label,
                      icon: item.icon,
                    }))}
                    pathname={pathname}
                  />
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
});
