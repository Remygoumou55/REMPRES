"use client";

import { memo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, LogOut, X } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import { ROUTES } from "@/lib/constants/routes";
import { SUPER_ADMIN_NAV_GROUPS, getSuperAdminNavSegment } from "@/lib/navigation/super-admin-nav";
import { UserAvatar } from "./UserAvatar";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";

type InnerProps = {
  pathname: string;
  searchParams: Pick<URLSearchParams, "get"> | null;
  userDisplayName: string;
  userAvatarInitial: string;
  onClose: () => void;
  onLogout: () => void;
};

const SuperAdminMobileNavInner = memo(function SuperAdminMobileNavInner({
  pathname,
  searchParams,
  userDisplayName,
  userAvatarInitial,
  onClose,
  onLogout,
}: InnerProps) {
  const segment = getSuperAdminNavSegment(pathname, searchParams);

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
            <p className="text-xs font-medium text-white/50">Supervision</p>
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
            segment === "dashboard" ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
          }`}
        >
          <LayoutDashboard size={18} className="shrink-0 text-white/70" />
          <span>Accueil</span>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-1" aria-label="Navigation super administrateur">
        {SUPER_ADMIN_NAV_GROUPS.map((g) => (
          <CollapsibleNavGroup
            key={g.id}
            groupId={g.id}
            title={g.label}
            groupIcon={g.icon}
            pathname={pathname}
            searchParams={searchParams}
            isRailExpanded
            onExpandRail={() => {}}
            links={g.links}
            segmentActive={segment === g.id}
            onNavigate={onClose}
          />
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <div className="flex items-center gap-2.5 rounded-xl p-2">
          <UserAvatar initial={userAvatarInitial} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-white">{userDisplayName}</p>
            <p className="text-[11px] text-white/45">Super administrateur</p>
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

function SuperAdminMobileNavWithSearch(props: Omit<InnerProps, "searchParams">) {
  const searchParams = useSearchParams();
  return <SuperAdminMobileNavInner {...props} searchParams={searchParams} />;
}

export const SuperAdminMobileNav = memo(function SuperAdminMobileNav(props: Omit<InnerProps, "searchParams">) {
  return (
    <Suspense fallback={<SuperAdminMobileNavInner {...props} searchParams={null} />}>
      <SuperAdminMobileNavWithSearch {...props} />
    </Suspense>
  );
});
