"use client";

import { memo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { LayoutDashboard, LogOut, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { appConfig, getLogoUrl } from "@/lib/config";
import { NAV_LABELS } from "@/lib/constants/nav-labels";
import { ROUTES } from "@/lib/constants/routes";
import { SUPER_ADMIN_NAV_GROUPS, getSuperAdminNavSegment } from "@/lib/navigation/super-admin-nav";
import { UserAvatar } from "./UserAvatar";
import { CollapsibleNavGroup } from "./CollapsibleNavGroup";

function homeItemClasses(active: boolean, expanded: boolean) {
  return [
    "flex min-h-[44px] w-full items-center rounded-xl transition-colors",
    expanded ? "gap-3 px-3" : "justify-center px-2",
    active ? "bg-white/20 text-white shadow-sm" : "text-white/70 hover:bg-white/10 hover:text-white",
  ].join(" ");
}

type InnerProps = {
  pathname: string;
  searchParams: Pick<URLSearchParams, "get"> | null;
  userAvatarInitial: string;
  onLogout: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
};

const SuperAdminPrimarySidebarInner = memo(function SuperAdminPrimarySidebarInner({
  pathname,
  searchParams,
  userAvatarInitial,
  onLogout,
  isExpanded,
  onToggleExpanded,
}: InnerProps) {
  const segment = getSuperAdminNavSegment(pathname, searchParams);

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
          className={homeItemClasses(segment === "dashboard", isExpanded)}
        >
          <LayoutDashboard size={20} className="shrink-0 opacity-90" />
          {isExpanded ? <span className="truncate text-[13px] font-medium leading-tight">Accueil</span> : null}
        </Link>
      </div>

      <div className={`mx-3 mb-2 h-px bg-white/15 ${isExpanded ? "" : "mx-2"}`} />

      <nav
        className={`flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden ${isExpanded ? "px-2 pb-2" : "px-1.5 pb-2"}`}
        aria-label="Navigation super administrateur"
      >
        {SUPER_ADMIN_NAV_GROUPS.map((g) => (
          <CollapsibleNavGroup
            key={g.id}
            groupId={g.id}
            title={g.label}
            groupIcon={g.icon}
            pathname={pathname}
            searchParams={searchParams}
            isRailExpanded={isExpanded}
            onExpandRail={() => {
              if (!isExpanded) onToggleExpanded();
            }}
            links={g.links}
            segmentActive={segment === g.id}
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

function SuperAdminPrimarySidebarWithSearch(props: Omit<InnerProps, "searchParams">) {
  const searchParams = useSearchParams();
  return <SuperAdminPrimarySidebarInner {...props} searchParams={searchParams} />;
}

export const SuperAdminPrimarySidebar = memo(function SuperAdminPrimarySidebar(
  props: Omit<InnerProps, "searchParams">,
) {
  return (
    <Suspense fallback={<SuperAdminPrimarySidebarInner {...props} searchParams={null} />}>
      <SuperAdminPrimarySidebarWithSearch {...props} />
    </Suspense>
  );
});
