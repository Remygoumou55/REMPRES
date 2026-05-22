"use client";

import Link from "next/link";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { memo, useCallback, useEffect, useState } from "react";

export type CollapsibleNavLinkItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

function pathMatches(
  href: string,
  pathname: string,
  searchParams: Pick<URLSearchParams, "get"> | null,
): boolean {
  const [path, query] = href.split("?");
  const baseOk = path.endsWith("/export-json")
    ? pathname === path || pathname.startsWith(`${path}/`)
    : pathname === path || pathname.startsWith(`${path}/`);
  if (!baseOk) return false;
  if (!query?.trim()) return true;
  if (!searchParams) return false;
  const expected = new URLSearchParams(query);
  let mismatch = false;
  expected.forEach((value, key) => {
    if (searchParams.get(key) !== value) mismatch = true;
  });
  return !mismatch;
}

type CollapsibleNavGroupProps = {
  groupId: string;
  title: string;
  groupIcon: LucideIcon;
  pathname: string;
  /** Pour distinguer les liens audit / journaux qui partagent le même chemin avec des filtres différents. */
  searchParams?: Pick<URLSearchParams, "get"> | null;
  isRailExpanded: boolean;
  onExpandRail: () => void;
  links: CollapsibleNavLinkItem[];
  segmentActive: boolean;
  /** Après navigation (ex. fermer le drawer mobile). */
  onNavigate?: () => void;
};

export const CollapsibleNavGroup = memo(function CollapsibleNavGroup({
  groupId,
  title,
  groupIcon: GroupGlyph,
  pathname,
  searchParams = null,
  isRailExpanded,
  onExpandRail,
  links,
  segmentActive,
  onNavigate,
}: CollapsibleNavGroupProps) {
  const storageKey = groupId.startsWith("dept_") || groupId.startsWith("mobile_dept_")
    ? `rempres_dept_nav:${groupId}`
    : `rempres_super_admin_nav:${groupId}`;
  const hasActiveChild = links.some((l) => pathMatches(l.href, pathname, searchParams));
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v === "0") setOpen(false);
      else if (v === "1") setOpen(true);
    } catch {
      /* ignore */
    }
  }, [storageKey]);

  useEffect(() => {
    if (hasActiveChild) setOpen(true);
  }, [hasActiveChild, pathname]);

  const toggle = useCallback(() => {
    if (!isRailExpanded) {
      onExpandRail();
      setOpen(true);
      return;
    }
    setOpen((o) => {
      const n = !o;
      try {
        localStorage.setItem(storageKey, n ? "1" : "0");
      } catch {
        /* ignore */
      }
      return n;
    });
  }, [isRailExpanded, onExpandRail, storageKey]);

  const headerBase =
    "flex w-full items-center rounded-xl text-left transition-colors min-h-[44px] " +
    (segmentActive || hasActiveChild ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white");

  if (!isRailExpanded) {
    return (
      <div className="flex justify-center py-0.5">
        <button
          type="button"
          title={title}
          aria-expanded={open}
          onClick={toggle}
          className={`rounded-xl p-2.5 ${headerBase}`}
        >
          <GroupGlyph size={20} className="shrink-0 opacity-90" />
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`${headerBase} gap-2 px-3 py-2.5`}
      >
        <GroupGlyph size={18} className="shrink-0 opacity-90" />
        <span className="flex-1 truncate text-[13px] font-semibold leading-tight">{title}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <ul className="space-y-0.5 px-2 pb-2 pt-0.5" role="list">
            {links.map((item) => {
              const active = pathMatches(item.href, pathname, searchParams);
              const Icon = item.icon;
              return (
                <li key={`${groupId}-${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    prefetch
                    onClick={() => onNavigate?.()}
                    className={`flex min-h-[40px] items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors ${
                      active ? "bg-white/20 text-white shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon size={15} className="shrink-0 opacity-90" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
});
