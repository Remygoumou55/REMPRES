import type { LucideIcon } from "lucide-react";
import {
  Archive,
  ArrowLeftRight,
  BarChart3,
  ClipboardList,
  FileEdit,
  FileText,
  History,
  LayoutDashboard,
  Package,
  PlusCircle,
  Receipt,
  Settings2,
  ShoppingCart,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";

export type BreadcrumbItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const UUID_RE =
  /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i;

function isDynamicId(seg: string): boolean {
  return UUID_RE.test(seg) || /^\d+$/.test(seg);
}

function humanizeSegment(seg: string): string {
  return seg
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const home: BreadcrumbItem = {
  href: "/dashboard",
  label: "Accueil",
  icon: LayoutDashboard,
};

export function generateBreadcrumb(pathname: string): BreadcrumbItem[] {
  const path = (pathname.split("?")[0] ?? "").replace(/\/+$/, "") || "/";

  if (path === "/dashboard") {
    return [
      {
        href: "/dashboard",
        label: "Tableau de bord",
        icon: LayoutDashboard,
      },
    ];
  }

  const segments = path.split("/").filter(Boolean);
  const [s0, s1, s2, s3] = segments;

  // ── Vente ─────────────────────────────────────────────────────────────
  if (s0 === "vente") {
    const items: BreadcrumbItem[] = [home];

    if (s1 === "clients") {
      items.push({
        href: "/vente/clients",
        label: "Clients",
        icon: Users,
      });
      if (s2 === "new") {
        items.push({
          href: "/vente/clients/new",
          label: "Nouveau client",
          icon: PlusCircle,
        });
        return items;
      }
      if (s2 === "archives") {
        items.push({
          href: "/vente/clients/archives",
          label: "Archives clients",
          icon: Archive,
        });
        return items;
      }
      if (s2 && isDynamicId(s2)) {
        const base = `/vente/clients/${s2}`;
        items.push({
          href: base,
          label: "Fiche client",
          icon: FileText,
        });
        if (s3 === "edit") {
          items.push({
            href: `${base}/edit`,
            label: "Modifier",
            icon: FileEdit,
          });
        }
        return items;
      }
      return items;
    }

    if (s1 === "produits") {
      items.push({
        href: "/vente/produits",
        label: "Produits",
        icon: Package,
      });
      if (s2 === "new") {
        items.push({
          href: "/vente/produits/new",
          label: "Nouveau produit",
          icon: PlusCircle,
        });
        return items;
      }
      if (s2 === "archives") {
        items.push({
          href: "/vente/produits/archives",
          label: "Archives produits",
          icon: Archive,
        });
        return items;
      }
      if (s2 && isDynamicId(s2)) {
        const base = `/vente/produits/${s2}`;
        items.push({
          href: base,
          label: "Fiche produit",
          icon: FileText,
        });
        if (s3 === "edit") {
          items.push({
            href: `${base}/edit`,
            label: "Modifier",
            icon: FileEdit,
          });
        }
        return items;
      }
      return items;
    }

    if (s1 === "nouvelle-vente") {
      items.push({
        href: "/vente/nouvelle-vente",
        label: "Nouvelle vente",
        icon: ShoppingCart,
      });
      return items;
    }

    if (s1 === "historique") {
      items.push({
        href: "/vente/historique",
        label: "Historique",
        icon: History,
      });
      if (s2 && isDynamicId(s2)) {
        items.push({
          href: `/vente/historique/${s2}`,
          label: "Détail vente",
          icon: Receipt,
        });
      }
      return items;
    }

    if (s1 === "recu" && s2) {
      items.push({
        href: `/vente/recu/${s2}`,
        label: "Reçu",
        icon: Receipt,
      });
      return items;
    }

    return fallbackFromSegments(items, segments);
  }

  // ── Finance ───────────────────────────────────────────────────────────
  if (s0 === "finance") {
    const items: BreadcrumbItem[] = [home];
    items.push({
      href: "/finance",
      label: "Finance",
      icon: BarChart3,
    });
    if (s1 === "depenses") {
      items.push({
        href: "/finance/depenses",
        label: "Dépenses",
        icon: Wallet,
      });
    }
    return items;
  }

  // ── Admin ─────────────────────────────────────────────────────────────
  if (s0 === "admin") {
    const items: BreadcrumbItem[] = [home];
    items.push({
      href: "/admin/activity-logs",
      label: "Administration",
      icon: ClipboardList,
    });
    if (s1 === "activity-logs") {
      items.push({
        href: "/admin/activity-logs",
        label: "Journal d'activité",
        icon: ClipboardList,
      });
      return dedupeSameHref(items);
    }
    if (s1 === "archives") {
      items.push({
        href: "/admin/archives",
        label: "Archives",
        icon: Archive,
      });
      return items;
    }
    if (s1 === "users") {
      items.push({
        href: "/admin/users",
        label: "Utilisateurs",
        icon: UserCog,
      });
      return items;
    }
    if (s1 === "currency") {
      items.push({
        href: "/admin/currency",
        label: "Taux de change",
        icon: ArrowLeftRight,
      });
      return items;
    }
    return fallbackFromSegments([home], segments);
  }

  // ── Paramètres ─────────────────────────────────────────────────────────
  if (s0 === "settings" && segments.length === 1) {
    return [
      home,
      {
        href: "/settings",
        label: "Paramètres",
        icon: Settings2,
      },
    ];
  }

  return fallbackFromSegments(path === "/" ? [] : [home], segments);
}

/** Évite deux entrées avec le même href (ex. administration + journal). */
function dedupeSameHref(items: BreadcrumbItem[]): BreadcrumbItem[] {
  const out: BreadcrumbItem[] = [];
  let prevHref: string | null = null;
  for (const it of items) {
    if (it.href === prevHref) {
      out[out.length - 1] = it;
    } else {
      out.push(it);
      prevHref = it.href;
    }
  }
  return out;
}

function fallbackFromSegments(
  base: BreadcrumbItem[],
  segments: string[],
): BreadcrumbItem[] {
  const items = [...base];
  let acc = "";
  for (const seg of segments) {
    acc += `/${seg}`;
    const label = isDynamicId(seg) ? "Détail" : humanizeSegment(seg);
    items.push({
      href: acc,
      label,
      icon: FileText,
    });
  }
  return items;
}
