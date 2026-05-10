import type { LucideIcon } from "lucide-react";
import {
  Activity,
  CreditCard,
  Database,
  Globe2,
  LayoutDashboard,
  Network,
  Radar,
  RefreshCw,
  Scale,
  ScrollText,
  Server,
  Shield,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const BASE = "/admin/multitenant";

export type MultitenantNavItem = { href: string; label: string; icon: LucideIcon };

export const MULTITENANT_NAV: MultitenantNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/tenants`, label: "Tenants", icon: Users },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
  { href: `${BASE}/analytics`, label: "Analytics", icon: Database },
  { href: `${BASE}/cache`, label: "Cache", icon: Zap },
  { href: `${BASE}/queues`, label: "Files", icon: Server },
  { href: `${BASE}/observability`, label: "Observabilité", icon: Radar },
  { href: `${BASE}/automation`, label: "Automation", icon: Workflow },
  { href: `${BASE}/sla`, label: "SLA & quotas", icon: Scale },
  { href: `${BASE}/regions`, label: "Régions", icon: Globe2 },
  { href: `${BASE}/orchestration`, label: "Orchestration", icon: Network },
  { href: `${BASE}/billing`, label: "Billing", icon: CreditCard },
  { href: `${BASE}/compliance`, label: "Conformité", icon: ScrollText },
  { href: `${BASE}/recovery`, label: "Recovery", icon: RefreshCw },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
];
