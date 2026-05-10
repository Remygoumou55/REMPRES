import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ClipboardList,
  Gauge,
  LayoutDashboard,
  LineChart,
  Shield,
  ShoppingBag,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

const BASE = "/vente/crm";

export type CrmNavItem = { href: string; label: string; icon: LucideIcon };

export const CRM_NAV: CrmNavItem[] = [
  { href: BASE, label: "Pilotage CRM", icon: LayoutDashboard },
  { href: `${BASE}/clients`, label: "Clients", icon: Users },
  { href: `${BASE}/leads`, label: "Leads", icon: UserPlus },
  { href: `${BASE}/pipeline`, label: "Pipeline", icon: Gauge },
  { href: `${BASE}/opportunities`, label: "Opportunités", icon: Target },
  { href: `${BASE}/quotes`, label: "Devis", icon: ClipboardList },
  { href: `${BASE}/orders`, label: "Commandes vente", icon: ShoppingBag },
  { href: `${BASE}/activities`, label: "Activités", icon: Activity },
  { href: `${BASE}/forecasting`, label: "Prévisions", icon: TrendingUp },
  { href: `${BASE}/analytics`, label: "Analytics", icon: LineChart },
  { href: `${BASE}/reporting`, label: "Reporting", icon: ClipboardList },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
];

export const CRM_AUDIT_PATH = `${BASE}/governance`;
