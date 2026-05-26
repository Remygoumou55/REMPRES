"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";
import {
  buildDepartmentSidebarGroups,
  lockDepartmentSidebarGroups,
} from "@/lib/navigation/department-sidebar-nav";
import { OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE } from "@/lib/navigation/erp-ux-architecture";
import { resolveEffectiveDepartmentKey } from "@/lib/navigation/home-route";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { normalizeDisplayText } from "@/lib/utils/display-text";

type DepartmentBusinessMobileNavProps = {
  pathname: string;
  departmentKey: string | null;
  shellRail: ShellRailVisibility;
  canReadClients: boolean;
  canReadProducts: boolean;
  userDisplayName: string;
  userAvatarInitial: string;
  onClose: () => void;
  onLogout: () => void;
};

export function DepartmentBusinessMobileNav({
  pathname,
  departmentKey,
  shellRail,
  canReadClients,
  canReadProducts,
  userDisplayName,
  userAvatarInitial,
  onClose,
  onLogout,
}: DepartmentBusinessMobileNavProps) {
  const effectiveDept = resolveEffectiveDepartmentKey(departmentKey);
  const arch = effectiveDept ? OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE[effectiveDept] : null;
  const homeHref = arch?.cockpitRoute ?? "/dashboard";

  const groups = useMemo(
    () =>
      lockDepartmentSidebarGroups(
        buildDepartmentSidebarGroups(departmentKey, {
          includeActions: shellRail.actions,
          includeSettings: shellRail.settings,
        }),
        shellRail,
        canReadClients,
        canReadProducts,
      ),
    [departmentKey, shellRail, canReadClients, canReadProducts],
  );

  const homeActive = pathname === homeHref || pathname.startsWith(`${homeHref}/`);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <Image src={getLogoUrl()} alt={appConfig.name} width={28} height={28} className="rounded-lg" unoptimized />
          <span className="text-sm font-semibold text-white">{appConfig.name}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2 py-1 text-xs font-medium text-white/70 hover:bg-white/10"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3">
        <Link
          href={homeHref}
          prefetch
          onClick={onClose}
          className={`mb-3 flex min-h-[44px] items-center gap-3 rounded-xl px-3 transition-colors ${
            homeActive ? "bg-white/20 text-white" : "text-white/75 hover:bg-white/10"
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-sm font-medium">{NAV_LABELS.home}</span>
        </Link>

        <nav className="space-y-2" aria-label="Navigation département">
          {groups.map((g) => (
            <CollapsibleNavGroup
              key={g.id}
              groupId={`mobile_dept_${g.id}`}
              title={g.label}
              groupIcon={g.icon}
              pathname={pathname}
              isRailExpanded
              onExpandRail={() => {}}
              links={g.links}
              segmentActive={g.links.some(
                (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
              )}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white">
            {(userAvatarInitial ?? "U").charAt(0).toUpperCase()}
          </div>
          <span className="truncate text-sm text-white/90">
            {normalizeDisplayText(userDisplayName) || "Compte"}
          </span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm text-white/70 hover:bg-white/10"
        >
          <LogOut size={16} />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
