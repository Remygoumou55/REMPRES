import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowLeftRight,
  BarChart3,
  Brain,
  Cpu,
  Gauge,
  Globe2,
  LayoutDashboard,
  Lock,
  Network,
  Radar,
  Radio,
  RefreshCw,
  Route,
  ScrollText,
} from "lucide-react";

const BASE = "/admin/cloud";

export type CloudNavItem = { href: string; label: string; icon: LucideIcon };

export const CLOUD_NAV: CloudNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/orchestration`, label: "Orchestration", icon: Network },
  { href: `${BASE}/regions`, label: "Régions & infra", icon: Globe2 },
  { href: `${BASE}/edge`, label: "Edge ERP", icon: Cpu },
  { href: `${BASE}/realtime`, label: "Temps réel", icon: Radio },
  { href: `${BASE}/routing`, label: "Routage analytics", icon: Route },
  { href: `${BASE}/analytics`, label: "Intelligence régionale", icon: BarChart3 },
  { href: `${BASE}/observability`, label: "Observabilité", icon: Radar },
  { href: `${BASE}/ai`, label: "IA distribuée", icon: Brain },
  { href: `${BASE}/workloads`, label: "SLA & charges", icon: Gauge },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: ScrollText },
  { href: `${BASE}/recovery`, label: "Disaster recovery", icon: RefreshCw },
  { href: `${BASE}/failover`, label: "Failover", icon: ArrowLeftRight },
  { href: `${BASE}/security`, label: "Sécurité fédération", icon: Lock },
  { href: `${BASE}/performance`, label: "Performance", icon: Activity },
];
