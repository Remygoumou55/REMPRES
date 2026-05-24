import type { LucideIcon } from "lucide-react";
import {
  Archive,
  FileJson,
  GraduationCap,
  Receipt,
  Shield,
  ShoppingCart,
  Trash2,
  Users,
} from "lucide-react";
import { findNavItemByKey, NAV_ARCHIVES_HUB_EXTRAS } from "@/lib/constants/nav-config";
import { ROUTES } from "@/lib/constants/routes";

export type ArchivesGovernanceNavItem = {
  id:
    | "hub"
    | "sales"
    | "finance"
    | "hr"
    | "training"
    | "exports"
    | "deletions"
    | "systemHistory";
  href: string;
  label: string;
  icon: LucideIcon;
};

const SIDEBAR_ICONS: Record<string, LucideIcon> = {
  "archives-exports": FileJson,
  "archives-suppressions": Trash2,
};

const HUB_EXTRA_ICONS: Record<string, LucideIcon> = {
  "archives-ventes": ShoppingCart,
  "archives-finance": Receipt,
  "archives-rh": Users,
  "archives-formation": GraduationCap,
  "historique-systeme": Shield,
};

const HUB_EXTRA_IDS: Record<string, ArchivesGovernanceNavItem["id"]> = {
  "archives-ventes": "sales",
  "archives-finance": "finance",
  "archives-rh": "hr",
  "archives-formation": "training",
  "historique-systeme": "systemHistory",
};

const archivesItem = findNavItemByKey("archives");

export const ARCHIVES_GOVERNANCE_NAV: readonly ArchivesGovernanceNavItem[] = [
  ...(archivesItem
    ? [{ id: "hub" as const, href: archivesItem.href ?? ROUTES.archives, label: archivesItem.label, icon: Archive }]
    : []),
  ...(archivesItem?.children ?? []).map((c) => ({
    id: (c.key === "archives-exports"
      ? "exports"
      : c.key === "archives-suppressions"
        ? "deletions"
        : "hub") as ArchivesGovernanceNavItem["id"],
    href: c.href,
    label: c.label,
    icon: SIDEBAR_ICONS[c.key] ?? Archive,
  })),
  ...NAV_ARCHIVES_HUB_EXTRAS.map((e) => ({
    id: HUB_EXTRA_IDS[e.key] ?? "sales",
    href: e.href,
    label: e.label,
    icon: HUB_EXTRA_ICONS[e.key] ?? Archive,
  })),
];

export function isArchivesGovernanceAuditView(pathname: string, search: Pick<URLSearchParams, "get"> | null): boolean {
  if (!pathname.startsWith("/admin/audit")) return false;
  if (!search) return false;
  const dept = (search.get("department") ?? "").toLowerCase();
  if (dept === "finance" || dept === "rh" || dept === "formation") return true;
  if ((search.get("category") ?? "").toLowerCase() === "system") return true;
  return false;
}

export function isArchivesGovernancePath(pathname: string, search: Pick<URLSearchParams, "get"> | null): boolean {
  if (pathname === ROUTES.archives || pathname.startsWith(`${ROUTES.archives}/`)) return true;
  if (pathname.startsWith("/admin/archives")) return true;
  if (pathname.startsWith("/vente/clients/archives")) return true;
  if (pathname.startsWith("/vente/produits/archives")) return true;
  if (pathname === ROUTES.history || pathname.startsWith(`${ROUTES.history}/`)) return true;
  if (pathname === "/vente/recu" || pathname.startsWith("/vente/recu/")) return true;
  if (pathname.startsWith("/admin/activity-logs/export")) return true;
  if (isArchivesGovernanceAuditView(pathname, search)) return true;
  if (pathname.startsWith("/admin/activity-logs")) {
    return search?.get("actionKey") === "delete";
  }
  return false;
}

export function archivesNavActiveId(
  pathname: string,
  search: Pick<URLSearchParams, "get"> | null,
): ArchivesGovernanceNavItem["id"] {
  if (pathname === ROUTES.archives || pathname.startsWith(`${ROUTES.archives}/`)) return "hub";
  if (pathname.startsWith("/vente/clients/archives") || pathname.startsWith("/vente/produits/archives")) return "sales";
  if (pathname === ROUTES.history || pathname.startsWith(`${ROUTES.history}/`)) return "sales";
  if (pathname.startsWith("/admin/archives")) return "sales";
  if (pathname.startsWith("/vente/recu")) return "sales";
  if (pathname.startsWith("/admin/activity-logs/export")) return "exports";
  if (pathname.startsWith("/admin/activity-logs") && search?.get("actionKey") === "delete") return "deletions";
  if (pathname.startsWith("/admin/audit") && search) {
    const dept = (search.get("department") ?? "").toLowerCase();
    if (dept === "finance") return "finance";
    if (dept === "rh") return "hr";
    if (dept === "formation") return "training";
    if ((search.get("category") ?? "").toLowerCase() === "system") return "systemHistory";
  }
  return "hub";
}
