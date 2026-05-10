import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Brain,
  ClipboardCheck,
  Flame,
  Gauge,
  Globe2,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Scale,
  Server,
  Shield,
  Shuffle,
  Users,
  Workflow,
  Zap,
} from "lucide-react";

const BASE = "/admin/resilience";

export type ResilienceNavItem = { href: string; label: string; icon: LucideIcon };

export const RESILIENCE_NAV: ResilienceNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/chaos`, label: "Chaos", icon: Flame },
  { href: `${BASE}/load-testing`, label: "Charge distribuée", icon: Gauge },
  { href: `${BASE}/failover`, label: "Failover multi-région", icon: Shuffle },
  { href: `${BASE}/realtime`, label: "Realtime flood", icon: Radio },
  { href: `${BASE}/queues`, label: "Files & queues", icon: Server },
  { href: `${BASE}/orchestration`, label: "Orchestration stress", icon: Workflow },
  { href: `${BASE}/ai`, label: "Charge IA", icon: Brain },
  { href: `${BASE}/tenants`, label: "Tenants", icon: Users },
  { href: `${BASE}/ecosystem`, label: "Écosystème", icon: Globe2 },
  { href: `${BASE}/recovery`, label: "Recovery / DR", icon: RefreshCw },
  { href: `${BASE}/reliability`, label: "Fiabilité", icon: Shield },
  { href: `${BASE}/analytics`, label: "Analytics résilience", icon: BarChart3 },
  { href: `${BASE}/governance`, label: "Validation gouvernance", icon: ClipboardCheck },
  { href: `${BASE}/sla`, label: "SLA & stabilité", icon: Scale },
  { href: `${BASE}/performance`, label: "Performance", icon: Zap },
];
