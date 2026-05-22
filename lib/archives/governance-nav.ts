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
import { ROUTES } from "@/lib/constants/routes";
import { NAV_LABELS } from "@/lib/constants/nav-labels";

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

/**
 * Structure officielle module Archives (supervision historique, lecture / traçabilité).
 * Les entrées « finance / RH / formation » pointent vers l’audit filtré faute d’écrans d’archives métier dédiés.
 */
export const ARCHIVES_GOVERNANCE_NAV: readonly ArchivesGovernanceNavItem[] = [
  { id: "hub", href: ROUTES.archives, label: NAV_LABELS.archivesOverview, icon: Archive },
  { id: "sales", href: "/vente/clients/archives", label: "Archives ventes", icon: ShoppingCart },
  { id: "finance", href: "/admin/audit?department=finance", label: "Archives finance", icon: Receipt },
  { id: "hr", href: "/admin/audit?department=rh", label: "Archives RH", icon: Users },
  { id: "training", href: "/admin/audit?department=formation", label: "Archives formation", icon: GraduationCap },
  { id: "exports", href: "/admin/activity-logs/export", label: "Exports", icon: FileJson },
  { id: "deletions", href: "/admin/activity-logs?actionKey=delete", label: "Suppressions", icon: Trash2 },
  { id: "systemHistory", href: "/admin/audit?category=system", label: "Historique système", icon: Shield },
] as const;

/** Vues audit réservées au bandeau Archives (pas le hub Actions générique). */
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

export function archivesNavActiveId(pathname: string, search: Pick<URLSearchParams, "get"> | null): ArchivesGovernanceNavItem["id"] {
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
