import type { AdminPlatformCommandLink } from "../types/domain";

/** Liens vers les consoles admin déjà livrées — aucune route parallèle. */
export const ADMIN_PLATFORM_COMMAND_LINKS: readonly AdminPlatformCommandLink[] = [
  {
    surface: "observability",
    href: "/admin/observability",
    labelKey: "admin.platformDashboard.link.observability",
    descriptionKey: "admin.platformDashboard.desc.observability",
  },
  {
    surface: "infrastructure",
    href: "/admin/automation",
    labelKey: "admin.platformDashboard.link.automation",
    descriptionKey: "admin.platformDashboard.desc.automation",
  },
  {
    surface: "ai",
    href: "/admin/ai",
    labelKey: "admin.platformDashboard.link.ai",
    descriptionKey: "admin.platformDashboard.desc.ai",
  },
  {
    surface: "cloud",
    href: "/admin/cloud",
    labelKey: "admin.platformDashboard.link.cloud",
    descriptionKey: "admin.platformDashboard.desc.cloud",
  },
  {
    surface: "governance",
    href: "/admin/governance-platform",
    labelKey: "admin.platformDashboard.link.governance",
    descriptionKey: "admin.platformDashboard.desc.governance",
  },
  {
    surface: "resilience",
    href: "/admin/resilience",
    labelKey: "admin.platformDashboard.link.resilience",
    descriptionKey: "admin.platformDashboard.desc.resilience",
  },
  {
    surface: "multitenant",
    href: "/admin/multitenant",
    labelKey: "admin.platformDashboard.link.multitenant",
    descriptionKey: "admin.platformDashboard.desc.multitenant",
  },
  {
    surface: "platform",
    href: "/admin/platform",
    labelKey: "admin.platformDashboard.link.platform",
    descriptionKey: "admin.platformDashboard.desc.platform",
  },
  {
    surface: "ecosystem",
    href: "/admin/ecosystem",
    labelKey: "admin.platformDashboard.link.ecosystem",
    descriptionKey: "admin.platformDashboard.desc.ecosystem",
  },
  {
    surface: "compliance",
    href: "/admin/compliance",
    labelKey: "admin.platformDashboard.link.compliance",
    descriptionKey: "admin.platformDashboard.desc.compliance",
  },
] as const;
