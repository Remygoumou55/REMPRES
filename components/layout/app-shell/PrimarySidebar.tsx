"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelRightOpen,
  Settings2,
} from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import type { ModuleDef, ModuleId } from "./types";
import { UserAvatar } from "./UserAvatar";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";

function itemClasses(active: boolean, expanded: boolean) {
  return [
    "flex min-h-[44px] w-full items-center rounded-xl transition-colors",
    expanded ? "gap-3 px-3" : "justify-center px-2",
    active ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

export const PrimarySidebar = memo(function PrimarySidebar({
  modules,
  activeModule,
  userAvatarInitial,
  onLogout,
  isExpanded,
  onToggleExpanded,
  showSettingsLink = false,
}: {
  modules: ModuleDef[];
  activeModule: ModuleId;
  userAvatarInitial: string;
  onLogout: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  /** Alignement M2 — Paramètres réservés super_admin (pas de lien footer universel). */
  showSettingsLink?: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col border-r border-white/10">
      <div
        className={`flex shrink-0 items-center py-4 ${isExpanded ? "justify-between px-3" : "flex-col gap-3 px-2"}`}
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
          href={ROUTES.home}
          prefetch
          title={NAV_LABELS.home}
          className={itemClasses(activeModule === "dashboard", isExpanded)}
        >
          <LayoutDashboard size={20} className="shrink-0 opacity-90" />
          {isExpanded ? <span className="truncate text-[13px] font-medium leading-tight">{NAV_LABELS.home}</span> : null}
        </Link>
      </div>

      <div className={`mx-3 mb-2 h-px bg-white/15 ${isExpanded ? "" : "mx-2"}`} />

      <nav className={`flex flex-1 flex-col gap-0.5 overflow-y-auto ${isExpanded ? "px-2 pb-2" : "px-1.5 pb-2"}`}>
        {modules
          .filter((m) => m.visible)
          .map((m) => {
            const isActive = activeModule === m.id;
            const Icon = m.icon;
            return (
              <Link
                key={m.id}
                href={m.href}
                prefetch
                title={m.label}
                className={itemClasses(isActive, isExpanded)}
              >
                <Icon size={20} className="shrink-0 opacity-90" />
                {isExpanded ? <span className="truncate text-[13px] font-medium leading-tight">{m.label}</span> : null}
              </Link>
            );
          })}
      </nav>

      <div className={`mt-auto shrink-0 border-t border-white/10 py-3 ${isExpanded ? "px-2" : "px-1.5"}`}>
        {showSettingsLink ? (
          <Link
            href={ROUTES.settings}
            prefetch
            title={NAV_LABELS.settings}
            className={itemClasses(activeModule === "settings", isExpanded)}
          >
            <Settings2 size={20} className="shrink-0 opacity-90" />
            {isExpanded ? (
              <span className="truncate text-[13px] font-medium leading-tight">{NAV_LABELS.settings}</span>
            ) : null}
          </Link>
        ) : null}
        <div
          className={`flex items-center ${isExpanded ? "justify-between gap-2 px-1" : "flex-col gap-2"} ${showSettingsLink ? "mt-2" : ""}`}
        >
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
