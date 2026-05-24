export type DeptNavItem = {
  key: string;
  label: string;
  icon: string;
  href: string;
};

export type DeptNavSection = {
  section: string;
  items: DeptNavItem[];
};

export const DEPT_NAV_CONFIGS: Record<string, DeptNavSection[]> = {
  responsable_vente: [
    {
      section: "Vente",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "clients", label: "Clients", icon: "Users", href: "/vente/clients" },
        { key: "produits", label: "Produits", icon: "Package", href: "/vente/produits" },
        { key: "nouvelle-vente", label: "Nouvelle vente", icon: "ShoppingCart", href: "/vente/nouvelle-vente" },
        { key: "historique", label: "Historique", icon: "History", href: "/vente/historique" },
      ],
    },
  ],

  comptable: [
    {
      section: "Finance",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "finance", label: "Vue d'ensemble", icon: "BarChart3", href: "/finance" },
        { key: "depenses", label: "Dépenses", icon: "Receipt", href: "/finance/depenses" },
      ],
    },
  ],

  responsable_rh: [
    {
      section: "Ressources Humaines",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "employes", label: "Employés", icon: "Users", href: "/rh/employes" },
        { key: "conges", label: "Congés", icon: "Calendar", href: "/rh/conges" },
        { key: "presences", label: "Présences", icon: "Clock", href: "/rh/presences" },
      ],
    },
  ],

  responsable_formation: [
    {
      section: "Formation",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "formations", label: "Formations", icon: "GraduationCap", href: "/formation/formations" },
        { key: "apprenants", label: "Apprenants", icon: "Users", href: "/formation/apprenants" },
        { key: "inscriptions", label: "Inscriptions", icon: "ClipboardList", href: "/formation/inscriptions" },
        { key: "presences", label: "Présences", icon: "CheckCircle", href: "/formation/presences" },
        { key: "certificats", label: "Certificats", icon: "Award", href: "/formation/certificats" },
      ],
    },
  ],

  responsable_consultation: [
    {
      section: "Consultation",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "missions", label: "Missions", icon: "Briefcase", href: "/consultation/missions" },
        { key: "agenda", label: "Agenda", icon: "Calendar", href: "/consultation/agenda" },
        { key: "clients", label: "Clients", icon: "Building2", href: "/consultation/clients" },
      ],
    },
  ],

  responsable_marketing: [
    {
      section: "Marketing",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "campagnes", label: "Campagnes", icon: "Megaphone", href: "/marketing/campagnes" },
        { key: "leads", label: "Leads", icon: "Target", href: "/marketing/leads" },
      ],
    },
  ],

  responsable_logistique: [
    {
      section: "Logistique",
      items: [
        { key: "accueil", label: "Accueil", icon: "LayoutDashboard", href: "/dashboard" },
        { key: "articles", label: "Articles", icon: "Package", href: "/logistique/articles" },
        { key: "mouvements", label: "Mouvements", icon: "ArrowLeftRight", href: "/logistique/mouvements" },
      ],
    },
  ],
};

export const FULL_SIDEBAR_ROLES = ["super_admin", "directeur_general"];

function normalizeRole(role: string): string {
  return String(role ?? "").trim().toLowerCase();
}

export function isDeptRole(role: string): boolean {
  const key = normalizeRole(role);
  return !FULL_SIDEBAR_ROLES.includes(key) && key in DEPT_NAV_CONFIGS;
}

export function getDeptNavConfig(role: string): DeptNavSection[] | null {
  const key = normalizeRole(role);
  return DEPT_NAV_CONFIGS[key] ?? null;
}
