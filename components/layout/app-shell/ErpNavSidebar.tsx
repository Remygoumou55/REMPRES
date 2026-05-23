"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import {
  filterNavConfig,
  getNavExpandableKeys,
  sectionHasVisibleItems,
  type NavChildItem,
  type NavItem,
  type NavSection,
} from "@/lib/constants/nav-config";
import { NavIcon } from "@/components/ui/nav-icon";
import { useActiveNav, type ActiveNavApi } from "@/hooks/use-active-nav";
import { ROUTES } from "@/lib/constants/routes";

const NAV_OPEN_KEY = "rempres-nav-open";
const NAV_COLLAPSED_KEY = "rempres-nav-collapsed";

function initialsFromName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function readOpenGroups(): Record<string, boolean> {
  const defaults: Record<string, boolean> = { departements: true };
  for (const key of getNavExpandableKeys()) {
    if (!(key in defaults)) defaults[key] = false;
  }
  try {
    const raw = localStorage.getItem(NAV_OPEN_KEY);
    if (!raw) return defaults;
    return { ...defaults, ...(JSON.parse(raw) as Record<string, boolean>) };
  } catch {
    return defaults;
  }
}

function itemClasses(active: boolean): string {
  return [
    "flex w-full items-center rounded-lg border-l-2 transition-all duration-150 ease-in-out",
    active
      ? "border-white bg-[rgba(255,255,255,0.15)] text-white"
      : "border-transparent text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
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
  const children = (item.children ?? []) as NavChildItem[];
  const isOpen = openGroups[item.key] ?? false;
  const parentActive =
    isActive(item.href) || children.some((c) => isActive(c.href));
  const isDepartements = item.key === "departements";

  if (!item.expandable) {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        prefetch
        title={collapsed ? item.label : undefined}
        className={`${itemClasses(active)} ${collapsed ? "justify-center py-[7px] px-2" : "gap-2 py-[7px] px-2.5"}`}
      >
        <NavIcon iconName={item.icon} size={18} className="shrink-0 opacity-90" />
        {!collapsed ? <span className="truncate text-[12px] font-medium">{item.label}</span> : null}
      </Link>
    );
  }

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (collapsed) {
      onExpandSidebar();
      onToggleGroup(item.key);
      return;
    }
    onToggleGroup(item.key);
  };

  return (
    <div className="mb-px">
      <div
        className={`flex items-center rounded-lg ${parentActive ? "bg-[rgba(255,255,255,0.12)]" : ""}`}
      >
        {isDepartements && !collapsed ? (
          <Link
            href={item.href}
            prefetch
            className={`${itemClasses(parentActive)} min-w-0 flex-1 gap-2 py-[7px] pl-2.5 pr-1`}
            onClick={(e) => e.stopPropagation()}
          >
            <NavIcon iconName={item.icon} size={18} className="shrink-0 opacity-90" />
            <span className="truncate text-[12px] font-medium">{item.label}</span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={toggle}
            title={collapsed ? item.label : undefined}
            className={`${itemClasses(parentActive)} flex-1 ${collapsed ? "justify-center py-[7px] px-2" : "gap-2 py-[7px] px-2.5"}`}
          >
            <NavIcon iconName={item.icon} size={18} className="shrink-0 opacity-90" />
            {!collapsed ? (
              <span className="flex-1 truncate text-left text-[12px] font-medium">{item.label}</span>
            ) : null}
            {!collapsed && !isDepartements ? (
              <NavIcon
                iconName="ChevronDown"
                size={14}
                className={`shrink-0 text-white/60 transition-transform duration-200 ease-in-out ${isOpen ? "rotate-180" : ""}`}
              />
            ) : null}
          </button>
        )}
        {isDepartements && !collapsed ? (
          <button
            type="button"
            onClick={toggle}
            aria-expanded={isOpen}
            className="shrink-0 rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
            title={isOpen ? "Replier" : "Déplier"}
          >
            <NavIcon
              iconName="ChevronDown"
              size={14}
              className={`transition-transform duration-200 ease-in-out ${isOpen ? "rotate-180" : ""}`}
            />
          </button>
        ) : null}
      </div>
      {!collapsed ? (
        <div
          className="overflow-hidden transition-[max-height,opacity] duration-[250ms,200ms] ease-in-out"
          style={{
            maxHeight: isOpen ? "500px" : "0px",
            opacity: isOpen ? 1 : 0,
          }}
        >
          <ul className="mb-px pt-px" role="list">
            {children.map((child) => {
              const active = isActive(child.href);
              const showBadge = child.badge === "pendingCount" && pendingApprovalsCount > 0;
              return (
                <li key={child.key} className="mb-px">
                  <Link
                    href={child.href}
                    prefetch
                    className={`${itemClasses(active)} gap-2 py-[5px] pl-4 pr-2.5 text-[12px] text-[rgba(255,255,255,0.6)]`}
                  >
                    <NavIcon iconName={child.icon} size={14} className="shrink-0 opacity-90" />
                    <span className="min-w-0 flex-1 truncate font-medium">{child.label}</span>
                    {showBadge ? (
                      <span className="shrink-0 rounded-full bg-[rgba(239,68,68,0.85)] px-1.5 py-px text-[10px] font-semibold text-white tabular-nums">
                        {pendingApprovalsCount}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
});

export type ErpNavSidebarProps = {
  userDisplayName: string;
  userRole: string;
  pendingApprovalsCount: number;
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export const ErpNavSidebar = memo(function ErpNavSidebar({
  userDisplayName,
  userRole,
  pendingApprovalsCount,
  onLogout,
  onCollapsedChange,
}: ErpNavSidebarProps) {
  const activeNav = useActiveNav();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ departements: true });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(NAV_COLLAPSED_KEY);
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

  const sections = useMemo(() => filterNavConfig(userRole), [userRole]);

  const toggleGroup = useCallback((key: string) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(NAV_OPEN_KEY, JSON.stringify(next));
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
        localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const expandSidebar = useCallback(() => {
    setCollapsed(false);
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  const avatarInitials = initialsFromName(userDisplayName);

  return (
    <div className="flex h-full w-full flex-col border-r border-white/10">
      <div
        className={`flex shrink-0 items-center py-3 ${collapsed ? "flex-col gap-2 px-2" : "justify-between px-2.5"}`}
      >
        <Link href={ROUTES.home} prefetch className="flex min-w-0 shrink-0 items-center gap-2" title={appConfig.name}>
          <Image
            src={getLogoUrl()}
            alt={appConfig.name}
            width={32}
            height={32}
            className="rounded-lg object-contain"
            unoptimized
          />
          {!collapsed ? (
            <span className="truncate text-sm font-semibold tracking-tight text-white">{appConfig.name}</span>
          ) : null}
        </Link>
        <button
          type="button"
          onClick={toggleCollapsed}
          className="rounded-lg p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
          title={collapsed ? "Agrandir le menu" : "Réduire le menu"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <PanelRightOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <nav
        className={`flex flex-1 flex-col overflow-x-hidden overflow-y-auto ${collapsed ? "px-1 pb-1" : "px-1.5 pb-1"}`}
        aria-label="Navigation ERP"
      >
        {sections.map((section: NavSection, sectionIndex) => {
          if (!sectionHasVisibleItems(section, userRole)) return null;
          return (
            <div key={section.section}>
              {sectionIndex > 0 ? <div className="my-1 h-px bg-white/10" aria-hidden /> : null}
              {!collapsed ? (
                <p className="px-2 pb-[2px] pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)]">
                  {section.section}
                </p>
              ) : null}
              <div>
                {section.items.map((item) => (
                  <NavItemRow
                    key={item.key}
                    item={item}
                    collapsed={collapsed}
                    openGroups={openGroups}
                    onToggleGroup={toggleGroup}
                    activeNav={activeNav}
                    pendingApprovalsCount={pendingApprovalsCount}
                    onExpandSidebar={expandSidebar}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      <div className={`mt-auto shrink-0 border-t border-white/10 py-2 ${collapsed ? "px-1" : "px-1.5"}`}>
        <div
          className={`flex items-center ${collapsed ? "flex-col justify-center gap-1.5" : "justify-between gap-2 px-1"}`}
        >
          <div className={`flex min-w-0 items-center ${collapsed ? "justify-center" : "gap-2"}`}>
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold text-white"
              title={userDisplayName}
            >
              {avatarInitials}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white">{userDisplayName}</p>
                <p className="text-[10px] text-[rgba(255,255,255,0.45)]">Connecté</p>
              </div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-lg p-1.5 text-white/50 transition hover:bg-white/10 hover:text-white"
          >
            <NavIcon iconName="LogOut" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
});
