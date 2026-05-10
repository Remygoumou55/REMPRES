import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlarmClock,
  LayoutDashboard,
  ListChecks,
  Radio,
  Shield,
  Workflow,
} from "lucide-react";

const BASE = "/admin/automation";

export type AutomationNavItem = { href: string; label: string; icon: LucideIcon };

export const AUTOMATION_NAV: AutomationNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/workflows`, label: "Workflows", icon: Workflow },
  { href: `${BASE}/runs`, label: "Exécutions", icon: ListChecks },
  { href: `${BASE}/schedules`, label: "Planifications", icon: AlarmClock },
  { href: `${BASE}/events`, label: "Bus événements", icon: Radio },
  { href: `${BASE}/analytics`, label: "Analytics", icon: Activity },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
];
