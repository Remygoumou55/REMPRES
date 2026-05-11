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
  actions: "/actions",
  archives: "/archives",
  admin: "/admin",
  config: "/config",
  clients: "/vente/clients",
  produits: "/vente/produits",
  newSale: "/vente/nouvelle-vente",
  history: "/vente/historique",
  finance: "/finance",
  depenses: "/finance/depenses",
} as const;

