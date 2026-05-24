"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";
import { UserAvatar } from "./UserAvatar";
import {
  buildDepartmentSidebarGroups,
  lockDepartmentSidebarGroups,
  resolveDepartmentNavContextLabel,
  type DepartmentSidebarGroup,
} from "@/lib/navigation/department-sidebar-nav";
import { OFFICIAL_DEPARTMENT_SIDEBAR_ARCHITECTURE } from "@/lib/navigation/erp-ux-architecture";
import { resolveEffectiveDepartmentKey } from "@/lib/auth/profile-authority";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { DEPARTMENT_KEYS } from "@/lib/departments/department-config";

function homeItemClasses(active: boolean, expanded: boolean) {
  return [
    "flex min-h-[44px] w-full items-center rounded-xl transition-colors",
    expanded ? "gap-3 px-3" : "justify-center px-2",
    active ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

function isGroupActive(pathname: string, group: DepartmentSidebarGroup): boolean {
  return group.links.some(
    (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
  );
}

type DepartmentBusinessSidebarProps = {
  pathname: string;
  departmentKey: string | null;
  shellRail: ShellRailVisibility;
  canReadClients: boolean;
  canReadProducts: boolean;
  userAvatarInitial: string;
  onLogout: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
};

export const DepartmentBusinessSidebar = memo(function DepartmentBusinessSidebar({
  pathname,
  departmentKey,
  shellRail,
  canReadClients,
  canReadProducts,
  userAvatarInitial,
  onLogout,
  isExpanded,
  onToggleExpanded,
}: DepartmentBusinessSidebarProps) {
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

  const homeActive =
    pathname === homeHref || pathname.startsWith(`${homeHref}/`);

  const deptTitle =
    effectiveDept === DEPARTMENT_KEYS.VENTE
      ? "Vente"
      : groups[0]?.label ?? NAV_LABELS.home;

  return (
    <div className="flex h-full w-full flex-col border-r border-white/10">
      <div
        className={`flex shrink-0 items-center py-4 ${isExpanded ? "justify-between px-3" : "flex-col gap-3 px-2"}`}
      >
        <Link href={homeHref} prefetch className="flex min-w-0 shrink-0 items-center gap-2" title={appConfig.name}>
          <Image
            src={getLogoUrl()}
            alt={appConfig.name}
            width={36}
            height={36}
            className="rounded-xl object-contain"
            unoptimized
          />
          {isExpanded ? (
            <span className="truncate text-sm font-semibold tracking-tight text-white">{appConfig.name}</span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title={isExpanded ? "Réduire le menu" : "Agrandir le menu"}
          aria-expanded={isExpanded}
        >
          {isExpanded ? <PanelLeftClose size={18} /> : <PanelRightOpen size={18} />}
        </button>
      </div>

      <div className={`shrink-0 pb-2 ${isExpanded ? "px-3" : "px-2"}`}>
        <Link
          href={homeHref}
          prefetch
          title={NAV_LABELS.home}
          className={homeItemClasses(homeActive, isExpanded)}
        >
          <LayoutDashboard size={20} className="shrink-0 opacity-90" />
          {isExpanded ? (
            <span className="truncate text-[13px] font-medium leading-tight">Accueil</span>
          ) : null}
        </Link>
      </div>

      {isExpanded && groups.length > 0 ? (
        <p className="px-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">
          {deptTitle}
        </p>
      ) : null}

      <div className={`mx-3 mb-2 h-px bg-white/15 ${isExpanded ? "" : "mx-2"}`} />

      <nav
        className={`flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden ${isExpanded ? "px-2 pb-2" : "px-1.5 pb-2"}`}
        aria-label={`Navigation ${deptTitle}`}
      >
        {groups.map((g) => (
          <CollapsibleNavGroup
            key={g.id}
            groupId={`dept_${g.id}`}
            title={g.label}
            groupIcon={g.icon}
            pathname={pathname}
            isRailExpanded={isExpanded}
            onExpandRail={() => {
              if (!isExpanded) onToggleExpanded();
            }}
            links={g.links}
            segmentActive={isGroupActive(pathname, g)}
          />
        ))}
      </nav>

      <div className={`mt-auto shrink-0 border-t border-white/10 py-3 ${isExpanded ? "px-2" : "px-1.5"}`}>
        <div className={`flex items-center ${isExpanded ? "justify-between gap-2 px-1" : "flex-col gap-2"}`}>
          <UserAvatar initial={userAvatarInitial} />
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});

export function getDepartmentNavContextLabel(
  pathname: string,
  departmentKey: string | null,
): string {
  return resolveDepartmentNavContextLabel(pathname, departmentKey);
}
