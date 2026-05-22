/**
 * Rôles gouvernés ERP — un département principal + un rôle générique par utilisateur.
 * Les libellés « MANAGER_* » décrivent l’association département + rôle manager (pas des clés DB parallèles).
 */
export const GOVERNED_ERP_ROLES = [
  { key: "super_admin", label: "SUPER_ADMIN", description: "Supervision globale, configuration et gouvernance." },
  { key: "manager:vente", label: "MANAGER_VENTE", description: "Manager — département Vente (un rôle, un département)." },
  { key: "manager:finance", label: "MANAGER_FINANCE", description: "Manager — département Finance." },
  { key: "manager:rh", label: "MANAGER_RH", description: "Manager — département RH." },
  { key: "manager:formation", label: "MANAGER_FORMATION", description: "Manager — département Formation." },
  { key: "manager:logistique", label: "MANAGER_LOGISTIQUE", description: "Manager — département Logistique." },
  { key: "manager:marketing", label: "MANAGER_MARKETING", description: "Manager — département Marketing." },
] as const;
