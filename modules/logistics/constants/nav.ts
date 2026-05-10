import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowLeftRight,
  Building2,
  ClipboardList,
  LayoutDashboard,
  Package,
  Shield,
  ShoppingBag,
  Truck,
  Warehouse,
} from "lucide-react";

const BASE = "/logistique";

export type LogisticsNavItem = { href: string; label: string; icon: LucideIcon };

export const LOGISTICS_NAV: LogisticsNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/entrepots`, label: "Entrepôts", icon: Warehouse },
  { href: `${BASE}/stock`, label: "Stock", icon: Package },
  { href: `${BASE}/mouvements`, label: "Mouvements", icon: ArrowLeftRight },
  { href: `${BASE}/fournisseurs`, label: "Fournisseurs", icon: Building2 },
  { href: `${BASE}/achats`, label: "Achats", icon: ShoppingBag },
  { href: `${BASE}/livraisons`, label: "Livraisons", icon: Truck },
  { href: `${BASE}/alertes`, label: "Alertes", icon: AlertTriangle },
  { href: `${BASE}/reporting`, label: "Reporting", icon: ClipboardList },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
];

/** Routes hors navigation tabs mais depuis pilotage. */
export const LOGISTICS_AUDIT_PATH = `${BASE}/governance`;
