import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bot,
  BrainCircuit,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Radar,
  RotateCcw,
  Scale,
  Shield,
  Sparkles,
  Workflow,
} from "lucide-react";

const BASE = "/admin/ai";

export type AiNavItem = { href: string; label: string; icon: LucideIcon };

export const AI_NAV: AiNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/insights`, label: "Insights", icon: Lightbulb },
  { href: `${BASE}/recommendations`, label: "Recommandations", icon: Sparkles },
  { href: `${BASE}/predictive`, label: "Prédictif", icon: LineChart },
  { href: `${BASE}/forecasting`, label: "Forecasting", icon: BrainCircuit },
  { href: `${BASE}/assistants`, label: "Assistant", icon: Bot },
  { href: `${BASE}/optimization`, label: "Optimisation", icon: Workflow },
  { href: `${BASE}/risk`, label: "Risque AI", icon: Scale },
  { href: `${BASE}/observability`, label: "Observabilité", icon: Radar },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
  { href: `${BASE}/recovery`, label: "Récupération", icon: RotateCcw },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
];
