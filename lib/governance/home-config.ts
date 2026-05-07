import { ROLE_KEYS, type AppRoleKey } from "@/lib/auth/roles";
import { DEPARTMENT_NAVIGATION, type DepartmentKey } from "@/lib/departments/department-config";
import type { SupervisionScope } from "@/lib/auth/permissions";

export type GovernanceHomeModel = {
  title: string;
  subtitle: string;
  roleMission: string;
  departmentOverview: string;
  allowedActions: readonly string[];
  restrictedActions: readonly string[];
  governanceRules: readonly string[];
  bestPractices: readonly string[];
  securityNotices: readonly string[];
  supervisionNotes?: readonly string[];
};

type HomeContext = {
  roleKey: string | null;
  departmentKey: string | null;
  supervisionScope: SupervisionScope;
};

const ROLE_LABELS: Record<AppRoleKey, string> = {
  [ROLE_KEYS.SUPER_ADMIN]: "Super administrateur",
  [ROLE_KEYS.MANAGER]: "Manager",
  [ROLE_KEYS.AGENT]: "Agent",
  [ROLE_KEYS.AUDITOR]: "Auditeur",
  [ROLE_KEYS.ACCOUNTANT]: "Comptable",
};

const BASE_RULES = [
  "Toutes les actions sensibles doivent rester traçables dans l’audit.",
  "Respectez strictement le périmètre de votre département.",
  "Signalez immédiatement toute anomalie de session ou d’accès.",
] as const;

const BASE_SECURITY = [
  "Ne partagez jamais vos identifiants ni vos sessions.",
  "Vérifiez les données critiques avant chaque mutation.",
  "Utilisez uniquement les workflows officiels ERP.",
] as const;

const DEPARTMENT_OVERVIEW: Record<DepartmentKey, string> = {
  VENTE: "Le département Vente pilote les clients, produits et flux de vente avec discipline opérationnelle.",
  FINANCE: "Le département Finance gère les dépenses, consolidations et cohérence des totaux financiers.",
  RH: "Le département RH structure les ressources humaines, conformité et suivi des responsabilités.",
  FORMATION: "Le département Formation orchestre les programmes, sessions et montée en compétence.",
  CONSULTATION: "Le département Consultation coordonne les interventions, comptes-rendus et qualité de service.",
  MARKETING: "Le département Marketing supervise campagnes, positionnement et exécution commerciale.",
  LOGISTIQUE: "Le département Logistique sécurise les flux physiques, disponibilités et délais.",
  ADMINISTRATION: "Le périmètre Administration pilote la gouvernance et la coordination transversale.",
  AUDIT: "Le périmètre Audit garantit la traçabilité, les contrôles et l’intégrité opérationnelle.",
};

const DEPARTMENT_ALLOWED: Partial<Record<DepartmentKey, readonly string[]>> = {
  VENTE: ["Gérer les clients", "Gérer le catalogue produits", "Exécuter les ventes et le suivi d’historique"],
  FINANCE: ["Gérer les dépenses", "Suivre les indicateurs financiers", "Préparer les exports et rapports"],
  RH: ["Gérer les dossiers collaborateurs", "Suivre les cycles RH", "Appliquer les politiques de conformité RH"],
  FORMATION: ["Structurer les sessions", "Gérer les participants", "Suivre la progression de formation"],
  CONSULTATION: ["Planifier les consultations", "Documenter les comptes-rendus", "Suivre les engagements client"],
  MARKETING: ["Piloter les campagnes", "Suivre les canaux", "Analyser la performance des actions marketing"],
  LOGISTIQUE: ["Piloter les flux logistiques", "Suivre les disponibilités", "Coordonner les opérations de terrain"],
};

const DEPARTMENT_RESTRICTED: Partial<Record<DepartmentKey, readonly string[]>> = {
  VENTE: ["Modifier les dépenses finance", "Accéder aux opérations RH", "Élever des privilèges utilisateurs"],
  FINANCE: ["Exécuter les ventes opérationnelles", "Modifier les workflows RH", "Contourner les validations gouvernance"],
  RH: ["Créer des ventes opérationnelles", "Modifier les écritures finance", "Accéder aux données hors périmètre RH"],
  FORMATION: ["Modifier les opérations vente", "Modifier les dépenses finance", "Bypasser les contrôles d’accès"],
  CONSULTATION: ["Exécuter des mutations vente hors périmètre", "Modifier les dépenses finance", "Modifier les rôles utilisateurs"],
  MARKETING: ["Muter les données finance critiques", "Modifier les rôles utilisateurs", "Contourner les workflows validés"],
  LOGISTIQUE: ["Muter les données finance", "Modifier les comptes utilisateurs", "Accéder aux données hors logistique"],
};

export function getGovernanceHomeModel(context: HomeContext): GovernanceHomeModel {
  const department = context.departmentKey && context.departmentKey in DEPARTMENT_NAVIGATION
    ? (context.departmentKey as DepartmentKey)
    : null;

  if (context.roleKey === ROLE_KEYS.SUPER_ADMIN) {
    return {
      title: "Centre de gouvernance entreprise",
      subtitle: "Supervision globale, sécurité et conformité inter-départements.",
      roleMission: "Vous pilotez la gouvernance ERP: supervision KPI, contrôle audit, gestion des accès et arbitrage critique.",
      departmentOverview: DEPARTMENT_OVERVIEW.ADMINISTRATION,
      allowedActions: [
        "Superviser les KPI globaux et les tendances par département",
        "Gérer les utilisateurs, invitations et affectations",
        "Contrôler les journaux d’activité et archives",
      ],
      restrictedActions: [
        "Créer ou modifier des opérations métier vente",
        "Exécuter des mutations finance opérationnelles",
        "Contourner les politiques d’approbation et d’audit",
      ],
      governanceRules: BASE_RULES,
      bestPractices: [
        "Validez les actions sensibles avec preuve d’audit.",
        "Isolez les décisions de gouvernance des opérations quotidiennes.",
        "Supervisez les anomalies avant escalade.",
      ],
      securityNotices: BASE_SECURITY,
      supervisionNotes: [
        "Ce centre est en mode supervision uniquement: aucun traitement operationnel direct.",
        "Toute action critique doit rester explicable et traçable.",
      ],
    };
  }

  const roleLabel = (context.roleKey && context.roleKey in ROLE_LABELS)
    ? ROLE_LABELS[context.roleKey as AppRoleKey]
    : "Collaborateur";
  const departmentLabel = department ? DEPARTMENT_NAVIGATION[department].label : "Non assigné";

  return {
    title: `Accueil gouvernance — ${departmentLabel}`,
    subtitle: `Rôle actif: ${roleLabel}`,
    roleMission:
      context.roleKey === ROLE_KEYS.MANAGER
        ? "Vous coordonnez les opérations du département, la discipline d’exécution et la qualité des résultats."
        : "Vous exécutez les opérations autorisées de votre département en respectant les contrôles de sécurité.",
    departmentOverview: department ? DEPARTMENT_OVERVIEW[department] : "Affectation département en attente de validation.",
    allowedActions: department ? (DEPARTMENT_ALLOWED[department] ?? ["Exécuter les workflows autorisés du département"]) : ["Consulter les informations de base"],
    restrictedActions: department ? (DEPARTMENT_RESTRICTED[department] ?? ["Accéder aux workflows des autres départements"]) : ["Exécuter des mutations hors périmètre"],
    governanceRules: BASE_RULES,
    bestPractices: [
      "Travaillez via les écrans dédiés à votre module.",
      "Évitez toute opération hors procédure officielle.",
      "Escaladez les cas sensibles vers la gouvernance.",
    ],
    securityNotices: BASE_SECURITY,
    supervisionNotes:
      context.supervisionScope === "global"
        ? ["Votre périmètre inclut une vue supervision globale."]
        : undefined,
  };
}
