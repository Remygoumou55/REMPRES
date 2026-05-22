"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, X, LogOut, ChevronRight, Settings2 } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import type { ModuleDef, ModuleId } from "./types";
import { UserAvatar } from "./UserAvatar";
import { SuperAdminMobileNav } from "./SuperAdminMobileNav";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";

function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/finance") return pathname === "/finance";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export const MobileSidebar = memo(function MobileSidebar({
  modules,
  activeModule,
  userDisplayName,
  userAvatarInitial,
  pathname,
  onClose,
  onLogout,
  isSuperAdmin = false,
  showSettingsLink = false,
}: {
  modules: ModuleDef[];
  activeModule: ModuleId;
  userDisplayName: string;
  userAvatarInitial: string;
  pathname: string;
  onClose: () => void;
  onLogout: () => void;
  isSuperAdmin?: boolean;
  showSettingsLink?: boolean;
}) {
  if (isSuperAdmin) {
    return (
      <SuperAdminMobileNav
        pathname={pathname}
        userDisplayName={userDisplayName}
        userAvatarInitial={userAvatarInitial}
        onClose={onClose}
        onLogout={onLogout}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Image
            src={getLogoUrl()}
            alt={appConfig.name}
            width={32}
            height={32}
            className="rounded-xl object-contain"
            unoptimized
          />
          <div>
            <p className="text-sm font-bold text-white">{appConfig.name}</p>
            <p className="text-xs font-medium text-white/50">ERP</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-white/60 hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <Link
          href={ROUTES.home}
          prefetch
          onClick={onClose}
          className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all ${
            activeModule === "dashboard"
              ? "bg-white/15 text-white"
              : "text-white/75 hover:bg-white/8 hover:text-white"
          }`}
        >
          <LayoutDashboard size={18} className="shrink-0 text-white/70" />
          <span>{NAV_LABELS.home}</span>
          {activeModule === "dashboard" ? <ChevronRight size={12} className="ml-auto text-white/40" /> : null}
        </Link>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-1">
        {modules
          .filter((m) => m.visible)
          .map((m) => {
            const visibleItems = m.items.filter((i) => i.visible);
            if (visibleItems.length === 0) return null;
            return (
              <div key={m.id}>
                <p className="mb-2 px-2 text-xs font-semibold text-white/50">{m.label}</p>
                <div className="space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = isNavItemActive(item.href, pathname);
                    const ItemIcon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        prefetch
                        onClick={onClose}
                        className={`flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all ${
                          isActive ? "bg-white/15 text-white shadow-sm" : "text-white/80 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <ItemIcon size={16} className={`shrink-0 ${isActive ? "text-white" : "text-white/55"}`} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {isActive ? <ChevronRight size={11} className="shrink-0 text-white/40" /> : null}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        {showSettingsLink ? (
          <Link
            href={ROUTES.settings}
            prefetch
            onClick={onClose}
            className={`mb-2 flex min-h-[44px] items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-all ${
              activeModule === "settings" ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
            }`}
          >
            <Settings2 size={18} className="shrink-0 text-white/70" />
            <span>{NAV_LABELS.settings}</span>
          </Link>
        ) : null}
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <UserAvatar initial={userAvatarInitial} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userDisplayName}</p>
            <p className="text-[11px] text-white/45">Connecté</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="shrink-0 rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </div>
  );
});
