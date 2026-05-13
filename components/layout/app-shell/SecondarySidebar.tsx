"use client";

import { memo, useMemo } from "react";
import type { ModuleDef } from "./types";
import { GovernanceSidebarSection } from "@/components/governance/sidebar/GovernanceSidebarSection";
import { NAV_SECTION_LABELS } from "@/lib/constants/nav-labels";

function sectionTitle(sectionKey: string, moduleLabel: string): string {
  if (sectionKey === "__default") return moduleLabel;
  return NAV_SECTION_LABELS[sectionKey] ?? sectionKey;
}

export const SecondarySidebarPanel = memo(function SecondarySidebarPanel({
  module,
  pathname,
}: {
  module: ModuleDef | null;
  pathname: string;
}) {
  const visibleItems = useMemo(() => module?.items.filter((i) => i.visible) ?? [], [module]);

  const shouldHide = useMemo(() => {
    if (!module || visibleItems.length === 0) return true;
    if (visibleItems.length === 1 && visibleItems[0].href === module.href) return true;
    return false;
  }, [module, visibleItems]);

  if (!module || shouldHide) return null;

  const ModuleIcon = module.icon;

  return (
    <aside className="hidden w-[248px] shrink-0 flex-col overflow-hidden border-r border-gray-200/80 bg-gray-50/50 md:flex">
      <div className="flex flex-1 flex-col overflow-hidden p-3">
        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-100 px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <ModuleIcon size={16} className="text-primary" />
            </div>
            <h2 className="truncate text-sm font-semibold text-darktext">{module.label}</h2>
          </div>

          <nav className="flex-1 overflow-y-auto p-2">
            <div className="space-y-4">
              {Array.from(new Set(visibleItems.map((item) => item.section ?? "__default"))).map((sectionKey) => {
                const sectionItems = visibleItems.filter((item) => (item.section ?? "__default") === sectionKey);
                return (
                  <GovernanceSidebarSection
                    key={sectionKey}
                    title={sectionTitle(sectionKey, module.label)}
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
