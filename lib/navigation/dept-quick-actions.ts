/**
 * Actions rapides officielles — homepage cockpit /dept/[slug] (max 6, libellés métier).
 * Aligné sur OFFICIAL_*_COCKPIT_QUICK_ACTIONS (vente/finance) — fichier client-safe.
 */
import type { DepartmentKey } from "@/lib/constants/departments";

export type DeptQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
};

const MAX_QUICK_ACTIONS = 6;

/** Miroir de OFFICIAL_VENTE_COCKPIT_QUICK_ACTIONS (B2.3). */
const VENTE_ACTIONS: DeptQuickAction[] = [
  { id: "new_sale", label: "Nouvelle vente", description: "Enregistrer une vente", href: "/vente/nouvelle-vente" },
  { id: "new_client", label: "Clients", description: "Gérer la base clients", href: "/vente/clients" },
  { id: "new_lead", label: "Nouveau lead", description: "Prospection CRM", href: "/vente/crm/leads" },
  { id: "new_quote", label: "Devis", description: "Créer ou suivre les devis", href: "/vente/crm/quotes" },
  { id: "pipeline", label: "Pipeline", description: "Vue pipeline commercial", href: "/vente/crm/pipeline" },
  { id: "crm_hub", label: "Pilotage CRM", description: "Hub opérationnel CRM", href: "/vente/crm" },
];

/** Miroir de OFFICIAL_FINANCE_COCKPIT_QUICK_ACTIONS (B3). */
const FINANCE_ACTIONS: DeptQuickAction[] = [
  { id: "cfo", label: "Pilotage CFO", description: "Vue trésorerie et filtres", href: "/finance" },
  { id: "expenses", label: "Dépenses", description: "Suivi des dépenses", href: "/finance/depenses" },
  { id: "enterprise", label: "Comptabilité", description: "Hub enterprise", href: "/finance/enterprise" },
  { id: "treasury", label: "Trésorerie", description: "Positions et flux", href: "/finance/enterprise/tresorerie" },
  { id: "invoicing", label: "Facturation", description: "Créances clients", href: "/finance/enterprise/facturation" },
  { id: "reporting", label: "Reporting", description: "Rapports financiers", href: "/finance/enterprise/reporting" },
];

const RH_ACTIONS: DeptQuickAction[] = [
  { id: "rh_hub", label: "Pilotage RH", description: "Vue d'ensemble RH", href: "/rh" },
  {
    id: "collaborateurs",
    label: "Collaborateurs",
    description: "Fiches et profils actifs",
    href: "/rh/collaborateurs",
  },
  { id: "conges", label: "Congés", description: "Demandes et validations", href: "/rh/conges" },
  { id: "presences", label: "Présences", description: "Suivi du jour", href: "/rh/presences" },
  { id: "contrats", label: "Contrats", description: "Contrats et avenants", href: "/rh/contrats" },
  {
    id: "recrutement",
    label: "Recrutement",
    description: "Pipeline de recrutement",
    href: "/rh/recrutement",
  },
];

/** Formation + Consultation — département unifié. */
const FORMATION_ACTIONS: DeptQuickAction[] = [
  {
    id: "dept_formation",
    label: "Tableau de bord",
    description: "KPIs formation et consultation",
    href: "/dept/formation",
  },
  {
    id: "formations",
    label: "Formations",
    description: "Catalogue et sessions actives",
    href: "/formation/formations",
  },
  {
    id: "apprenants",
    label: "Apprenants",
    description: "Participants inscrits",
    href: "/formation/apprenants",
  },
  {
    id: "missions",
    label: "Missions",
    description: "Missions de conseil actives",
    href: "/consultation/missions",
  },
  {
    id: "agenda",
    label: "Agenda",
    description: "Planning et rendez-vous",
    href: "/consultation/agenda",
  },
  {
    id: "certificats",
    label: "Certificats",
    description: "Certificats délivrés",
    href: "/formation/certificats",
  },
];

const MARKETING_ACTIONS: DeptQuickAction[] = [
  {
    id: "marketing_hub",
    label: "Pilotage marketing",
    description: "Vue campagnes et performance",
    href: "/marketing",
  },
  {
    id: "campagnes",
    label: "Campagnes",
    description: "Campagnes actives",
    href: "/marketing/campagnes",
  },
  { id: "leads", label: "Leads", description: "Prospects et nurturing", href: "/marketing/leads" },
  {
    id: "crm_leads",
    label: "Leads CRM",
    description: "Prospection commerciale",
    href: "/vente/crm/leads",
  },
  {
    id: "crm_pipeline",
    label: "Pipeline",
    description: "Opportunités en cours",
    href: "/vente/crm/pipeline",
  },
  {
    id: "reporting",
    label: "Reporting CRM",
    description: "Synthèse commerciale",
    href: "/vente/crm/reporting",
  },
];

const LOGISTIQUE_ACTIONS: DeptQuickAction[] = [
  { id: "log_hub", label: "Pilotage logistique", description: "Vue stock et flux", href: "/logistique" },
  { id: "stock", label: "Stock", description: "Niveaux et articles", href: "/logistique/stock" },
  {
    id: "mouvements",
    label: "Mouvements",
    description: "Entrées et sorties",
    href: "/logistique/mouvements",
  },
  {
    id: "entrepots",
    label: "Entrepôts",
    description: "Sites et emplacements",
    href: "/logistique/entrepots",
  },
  {
    id: "alertes",
    label: "Alertes stock",
    description: "Seuils et ruptures",
    href: "/logistique/alertes",
  },
  { id: "achats", label: "Achats", description: "Commandes fournisseurs", href: "/logistique/achats" },
];

const ACTIONS_BY_DEPT: Record<DepartmentKey, DeptQuickAction[]> = {
  vente: VENTE_ACTIONS.slice(0, MAX_QUICK_ACTIONS),
  finance: FINANCE_ACTIONS.slice(0, MAX_QUICK_ACTIONS),
  rh: RH_ACTIONS,
  formation: FORMATION_ACTIONS,
  consultation: FORMATION_ACTIONS,
  marketing: MARKETING_ACTIONS,
  logistique: LOGISTIQUE_ACTIONS,
};

export function getDeptQuickActions(dept: DepartmentKey): DeptQuickAction[] {
  return ACTIONS_BY_DEPT[dept] ?? [];
}
