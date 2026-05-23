"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import {
  filterNavConfig,
  getNavExpandableKeys,
  type NavItem,
} from "@/lib/constants/nav-config";
import { NavIcon } from "@/components/ui/nav-icon";
import { useActiveNav, type ActiveNavApi } from "@/hooks/use-active-nav";
import type { ShellRailVisibility } from "@/lib/navigation/shell-visibility";
import { ROUTES } from "@/lib/constants/routes";

const SIDEBAR_OPEN_GROUPS_KEY = "rempres-sidebar-open-groups";
const SIDEBAR_COLLAPSED_KEY = "rempres-sidebar-collapsed";

function initialsFromName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function readOpenGroups(): Record<string, boolean> {
  const defaults: Record<string, boolean> = {};
  for (const key of getNavExpandableKeys()) {
    defaults[key] = key === "actions";
  }
  try {
    const raw = localStorage.getItem(SIDEBAR_OPEN_GROUPS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function directLinkClasses(active: boolean, collapsed: boolean): string {
  return [
    "flex min-h-[44px] w-full items-center rounded-xl transition-all duration-150 ease-in-out",
    collapsed ? "justify-center px-2" : "gap-3 px-3",
    active
      ? "border-l-2 border-white bg-[rgba(255,255,255,0.15)] text-white"
      : "border-l-2 border-transparent text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
  ].join(" ");
}

type NavItemRowProps = {
  item: NavItem;
  collapsed: boolean;
  openGroups: Record<string, boolean>;
  onToggleGroup: (key: string) => void;
  activeNav: ActiveNavApi;
  pendingApprovalsCount: number;
  onExpandSidebar: () => void;
};

const NavItemRow = memo(function NavItemRow({
  item,
  collapsed,
  openGroups,
  onToggleGroup,
  activeNav,
  pendingApprovalsCount,
  onExpandSidebar,
}: NavItemRowProps) {
  const { isActive } = activeNav;
  const children = item.children ?? [];
  const isOpen = openGroups[item.key] ?? false;
  const parentActive =
    isActive(item.href) || children.some((c) => isActive(c.href));

  if (!item.expandable) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        prefetch
        title={collapsed ? item.label : undefined}
        className={directLinkClasses(active, collapsed)}
      >
        <NavIcon iconName={item.icon} size={20} className="shrink-0 opacity-90" />
        {!collapsed ? (
          <span className="truncate text-[13px] font-medium leading-tight">{item.label}</span>
        ) : null}
      </Link>
    );
  }

  const toggle = () => {
    if (collapsed) {
      onExpandSidebar();
      onToggleGroup(item.key);
      return;
    }
    onToggleGroup(item.key);
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.04]">
      <button
        type="button"
        onClick={toggle}
        title={collapsed ? item.label : undefined}
        aria-expanded={isOpen}
        className={[
          "flex min-h-[44px] w-full items-center rounded-xl text-left transition-all duration-150 ease-in-out",
          collapsed ? "justify-center px-2" : "gap-2 px-3 py-2.5",
          parentActive
            ? "bg-[rgba(255,255,255,0.15)] text-white"
            : "text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
        ].join(" ")}
      >
        <NavIcon iconName={item.icon} size={18} className="shrink-0 opacity-90" />
        {!collapsed ? (
          <>
            <span className="flex-1 truncate text-[13px] font-semibold leading-tight">{item.label}</span>
            <NavIcon
              iconName="ChevronDown"
              size={16}
              className={`shrink-0 text-white/60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </>
        ) : null}
      </button>
      {!collapsed ? (
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <ul className="space-y-0.5 px-2 pb-2 pt-0.5" role="list">
              {children.map((child) => {
                const active = isActive(child.href);
                const showBadge =
                  child.key === "approbations" && pendingApprovalsCount > 0;
                return (
                  <li key={child.key}>
                    <Link
                      href={child.href}
                      prefetch
                      className={[
                        "flex min-h-[40px] items-center gap-2 rounded-lg py-2 pl-[14px] pr-2.5 text-[12px] font-medium transition-all duration-150 ease-in-out",
                        active
                          ? "border-l-2 border-white bg-[rgba(255,255,255,0.15)] text-white"
                          : "border-l-2 border-transparent text-white/65 hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
                      ].join(" ")}
                    >
                      <NavIcon iconName={child.icon} size={15} className="shrink-0 opacity-90" />
                      <span className="min-w-0 flex-1 truncate">{child.label}</span>
                      {showBadge ? (
                        <span
                          className="shrink-0 rounded-full bg-[rgba(239,68,68,0.85)] px-1.5 py-px text-[10px] font-semibold text-white tabular-nums"
                          aria-label={`${pendingApprovalsCount} approbation(s) en attente`}
                        >
                          {pendingApprovalsCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export type ErpNavSidebarProps = {
  userDisplayName: string;
  userRole: string;
  isSuperAdmin: boolean;
  shellRail: ShellRailVisibility;
  pendingApprovalsCount: number;
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export const ErpNavSidebar = memo(function ErpNavSidebar({
  userDisplayName,
  userRole,
  isSuperAdmin,
  shellRail,
  pendingApprovalsCount,
  onLogout,
  onCollapsedChange,
}: ErpNavSidebarProps) {
  const activeNav = useActiveNav();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const d: Record<string, boolean> = {};
    for (const key of getNavExpandableKeys()) d[key] = key === "actions";
    return d;
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (c === "1") setCollapsed(true);
      setOpenGroups(readOpenGroups());
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    onCollapsedChange?.(collapsed);
  }, [collapsed, hydrated, onCollapsedChange]);

  const sections = useMemo(
    () => filterNavConfig(userRole, { isSuperAdmin, shellRail }),
    [userRole, isSuperAdmin, shellRail],
  );

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(SIDEBAR_OPEN_GROUPS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const avatarInitials = initialsFromName(userDisplayName);

  return (
    <div className="flex h-full w-full flex-col border-r border-white/10">
      <div
        className={`flex shrink-0 items-center py-4 ${collapsed ? "flex-col gap-3 px-2" : "justify-between px-3"}`}
      >
        <Link href={ROUTES.home} prefetch className="flex min-w-0 shrink-0 items-center gap-2" title={appConfig.name}>
          <Image
            src={getLogoUrl()}
            alt={appConfig.name}
            width={36}
            height={36}
            className="rounded-xl object-contain"
            unoptimized
          />
          {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight text-white">{appConfig.name}</span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelRightOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <nav
        className={`flex flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden ${collapsed ? "px-1.5 pb-2" : "px-2 pb-2"}`}
        aria-label="Navigation ERP"
      >
        {sections.map((section) => (
          <div key={section.section} className="space-y-1">
            {!collapsed ? (
              <p
                className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.4)]"
              >
                {section.section}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavItemRow
                  key={item.key}
                  item={item}
                  collapsed={collapsed}
                  openGroups={openGroups}
                  onToggleGroup={toggleGroup}
                  activeNav={activeNav}
                  pendingApprovalsCount={pendingApprovalsCount}
                  onExpandSidebar={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      try {
                        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "0");
                      } catch {
                        /* ignore */
                      }
                    }
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`mt-auto shrink-0 border-t border-white/10 py-3 ${collapsed ? "px-1.5" : "px-2"}`}>
        <div
          className={`flex items-center ${collapsed ? "flex-col justify-center gap-2" : "justify-between gap-2 px-1"}`}
        >
          <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold text-white"
              title={userDisplayName}
            >
              {avatarInitials}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white">{userDisplayName}</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.5)]">Connecté</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <NavIcon iconName="LogOut" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});
