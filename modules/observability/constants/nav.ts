import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BrainCircuit,
  GitBranch,
  HeartPulse,
  LayoutDashboard,
  Link2,
  Radar,
  Shield,
  Siren,
} from "lucide-react";

const BASE = "/admin/observability";

export type ObservabilityNavItem = { href: string; label: string; icon: LucideIcon };

export const OBSERVABILITY_NAV: ObservabilityNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/health`, label: "Santé", icon: HeartPulse },
  { href: `${BASE}/incidents`, label: "Incidents", icon: Siren },
  { href: `${BASE}/anomalies`, label: "Anomalies", icon: Radar },
  { href: `${BASE}/traces`, label: "Traces", icon: GitBranch },
  { href: `${BASE}/correlations`, label: "Corrélations", icon: Link2 },
  { href: `${BASE}/predictive`, label: "Prédictif", icon: BrainCircuit },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
];
