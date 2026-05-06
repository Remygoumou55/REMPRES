"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutDashboard, LogOut } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import type { ModuleDef, ModuleId } from "./types";
import { UserAvatar } from "./UserAvatar";

export const PrimarySidebar = memo(function PrimarySidebar({
  modules,
  activeModule,
  userAvatarInitial,
  onLogout,
}: {
  modules: ModuleDef[];
  activeModule: ModuleId;
  userAvatarInitial: string;
  onLogout: () => void;
}) {
  return (
    <div className="flex h-full w-full flex-col items-center">
      {/* Logo */}
      <div className="flex shrink-0 items-center justify-center py-5">
        <Image
          src={getLogoUrl()}
          alt={appConfig.name}
          width={36}
          height={36}
          className="rounded-xl object-contain"
          unoptimized
        />
      </div>

      {/* Dashboard */}
      <div className="w-full shrink-0 px-2 pb-3">
        <Link
          href="/dashboard"
          prefetch
          title="Tableau de bord"
          className={`flex w-full flex-col items-center gap-1 rounded-xl px-1 py-2.5 transition-all ${
            activeModule === "dashboard"
              ? "bg-white/20 text-white shadow-sm"
              : "text-white/50 hover:bg-white/10 hover:text-white/80"
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[8px] font-bold uppercase tracking-wide leading-none">Accueil</span>
        </Link>
      </div>

      {/* Séparateur */}
      <div className="mx-auto mb-3 h-px w-10 bg-white/15" />

      {/* Modules */}
      <nav className="flex w-full flex-1 flex-col gap-1 overflow-y-auto px-2">
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
                className={`group flex w-full flex-col items-center gap-1.5 rounded-xl px-1 py-3 transition-all ${
                  isActive
                    ? "bg-white/20 text-white shadow-sm"
                    : "text-white/45 hover:bg-white/10 hover:text-white/80"
                }`}
              >
                <Icon size={19} />
                <span className="text-center text-[8px] font-bold uppercase tracking-wide leading-none">
                  {m.shortLabel}
                </span>
              </Link>
            );
          })}
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3">
        <div className="flex flex-col items-center gap-2">
          <UserAvatar initial={userAvatarInitial} />
          <button
            type="button"
            onClick={onLogout}
            title="Se déconnecter"
            className="rounded-lg p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
});
