import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Archive,
  FileWarning,
  FolderLock,
  Gavel,
  LayoutDashboard,
  Scale,
  Shield,
  UploadCloud,
} from "lucide-react";

const BASE = "/admin/compliance";

export type ComplianceNavItem = { href: string; label: string; icon: LucideIcon };

export const COMPLIANCE_NAV: ComplianceNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/periods`, label: "Périodes", icon: FolderLock },
  { href: `${BASE}/fiscal`, label: "Verrou fiscal", icon: Scale },
  { href: `${BASE}/retention`, label: "Rétention", icon: Archive },
  { href: `${BASE}/snapshots`, label: "Snapshots", icon: UploadCloud },
  { href: `${BASE}/risks`, label: "Risques", icon: FileWarning },
  { href: `${BASE}/exports`, label: "Exports", icon: Shield },
  { href: `${BASE}/sod`, label: "SoD", icon: Gavel },
  { href: `${BASE}/monitoring`, label: "Monitoring", icon: Activity },
  { href: `${BASE}/governance`, label: "Gouvernance", icon: Shield },
];
