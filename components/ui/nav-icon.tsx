import type { LucideIcon } from "lucide-react";
import { Archive } from "lucide-react";
import { BarChart3 } from "lucide-react";
import { Bell } from "lucide-react";
import { Briefcase } from "lucide-react";
import { Building2 } from "lucide-react";
import { CheckCircle } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { Cpu } from "lucide-react";
import { Download } from "lucide-react";
import { FolderArchive } from "lucide-react";
import { GraduationCap } from "lucide-react";
import { LayoutDashboard } from "lucide-react";
import { Lock } from "lucide-react";
import { LogOut } from "lucide-react";
import { Megaphone } from "lucide-react";
import { Package } from "lucide-react";
import { Settings } from "lucide-react";
import { Shield } from "lucide-react";
import { ShoppingCart } from "lucide-react";
import { Trash2 } from "lucide-react";
import { UserCog } from "lucide-react";
import { Users } from "lucide-react";
import { Zap } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  BarChart3,
  Users,
  GraduationCap,
  Briefcase,
  Megaphone,
  Package,
  Zap,
  Archive,
  Shield,
  Settings,
  CheckCircle,
  Bell,
  ClipboardList,
  FolderArchive,
  Download,
  Trash2,
  UserCog,
  Lock,
  Cpu,
  ChevronDown,
  LogOut,
};

type NavIconProps = {
  iconName: string;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean;
};

export function NavIcon({ iconName, size = 20, className, "aria-hidden": ariaHidden = true }: NavIconProps) {
  const Icon = ICON_MAP[iconName];
  if (!Icon) return null;
  return <Icon size={size} className={className} aria-hidden={ariaHidden} />;
}
