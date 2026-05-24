"use client";

import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { PanelLeftClose, PanelRightOpen } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import type { DeptNavSection } from "@/lib/constants/dept-nav-configs";
import { NavIcon } from "@/components/ui/nav-icon";
import { useActiveNav } from "@/hooks/use-active-nav";
import { ROUTES } from "@/lib/constants/routes";

const NAV_COLLAPSED_KEY = "rempres-dept-nav-collapsed";

function initialsFromName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

function itemClasses(active: boolean): string {
  return [
    "flex w-full items-center rounded-lg border-l-2 transition-all duration-150 ease-in-out",
    active
      ? "border-white bg-[rgba(255,255,255,0.15)] text-white"
      : "border-transparent text-white/80 hover:bg-[rgba(255,255,255,0.08)] hover:text-white",
  ].join(" ");
}

export type DeptSidebarNavProps = {
  config: DeptNavSection[];
  userRole: string;
  userDisplayName: string;
  onLogout: () => void;
  onCollapsedChange?: (collapsed: boolean) => void;
};

export const DeptSidebarNav = memo(function DeptSidebarNav({
  config,
  userDisplayName,
  onLogout,
  onCollapsedChange,
}: DeptSidebarNavProps) {
  const { isActive } = useActiveNav();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const c = localStorage.getItem(NAV_COLLAPSED_KEY);
      if (c === "1") setCollapsed(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    onCollapsedChange?.(collapsed);
  }, [collapsed, hydrated, onCollapsedChange]);

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
        aria-label="Navigation département"
      >
        {config.map((section, sectionIndex) => (
          <div key={section.section}>
            {sectionIndex > 0 ? <div className="my-1 h-px bg-white/10" aria-hidden /> : null}
            {!collapsed ? (
              <p className="px-2 pb-[2px] pt-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-[rgba(255,255,255,0.35)]">
                {section.section}
              </p>
            ) : null}
            <div>
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    prefetch
                    title={collapsed ? item.label : undefined}
                    className={`${itemClasses(active)} ${collapsed ? "justify-center py-[7px] px-2" : "gap-2 py-[7px] px-2.5"} mb-px`}
                  >
                    <NavIcon iconName={item.icon} size={18} className="shrink-0 opacity-90" />
                    {!collapsed ? <span className="truncate text-[12px] font-medium">{item.label}</span> : null}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
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
