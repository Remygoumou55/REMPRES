export const ROUTES = {
  home: "/dashboard",
  executive: "/dashboard/executive",
  adminPlatformDashboard: "/admin/platform-dashboard",
  rhVisual: "/rh/visual",
  financeVisual: "/finance/visual",
  crmVisual: "/vente/crm/visual",
  logisticsVisual: "/logistique/visual",
  // direction remains accessible via direct URL, but hidden from sidebar
  direction: "/direction",
  dept: "/dept",
  vente: "/vente",
  rh: "/rh",
  formation: "/formation",
  consultation: "/consultation",
  marketing: "/marketing",
  logistics: "/logistique",
  crm: "/vente/crm",
  actions: "/actions",
  archives: "/archives",
  admin: "/admin",
  parametres: "/settings",
  /** @deprecated Utiliser SETTINGS_OFFICIAL_ROUTES.permissions — redirection middleware */
  config: "/config",
  settings: "/settings",
  clients: "/vente/clients",
  produits: "/vente/produits",
  newSale: "/vente/nouvelle-vente",
  history: "/vente/historique",
  finance: "/finance",
  depenses: "/finance/depenses",
} as const;

export { SETTINGS_OFFICIAL_ROUTES } from "@/lib/settings/official-routes";
