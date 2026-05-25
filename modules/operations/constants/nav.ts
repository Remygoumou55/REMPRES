import type { LucideIcon } from "lucide-react";
import {
  CheckSquare,
  ClipboardList,
  FolderKanban,
  GitBranch,
  LayoutDashboard,
  PackageCheck,
  Truck,
} from "lucide-react";

const BASE = "/operations";

export type OperationsNavItem = { href: string; label: string; icon: LucideIcon };

export const OPERATIONS_NAV: OperationsNavItem[] = [
  { href: BASE, label: "Pilotage", icon: LayoutDashboard },
  { href: `${BASE}/tasks`, label: "Tâches", icon: CheckSquare },
  { href: `${BASE}/projects`, label: "Projets", icon: FolderKanban },
  { href: `${BASE}/workflows`, label: "Workflows", icon: GitBranch },
  { href: `${BASE}/delivery`, label: "Livraison", icon: PackageCheck },
  { href: `${BASE}/reporting`, label: "Reporting", icon: ClipboardList },
  { href: `${BASE}/dashboard`, label: "Cockpit", icon: Truck },
];
