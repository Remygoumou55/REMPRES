export type CampaignType =
  | "email"
  | "social"
  | "sms"
  | "event"
  | "radio"
  | "affichage"
  | "autre";

export type CampaignStatus =
  | "draft"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type LeadSource =
  | "campaign"
  | "referral"
  | "website"
  | "social"
  | "event"
  | "cold"
  | "autre";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "converted"
  | "lost";

export type Campaign = {
  id: string;
  title: string;
  description: string | null;
  type: CampaignType;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget_gnf: number;
  target_audience: string | null;
  goal: string | null;
  channel: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  leads_count?: number;
};

export type Lead = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: LeadSource;
  campaign_id: string | null;
  status: LeadStatus;
  estimated_value_gnf: number;
  notes: string | null;
  converted_client_id: string | null;
  converted_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  campaign?: { title: string } | null;
};

export type CreateCampaignInput = {
  title: string;
  description?: string;
  type: CampaignType;
  status?: CampaignStatus;
  start_date?: string;
  end_date?: string;
  budget_gnf?: number;
  target_audience?: string;
  goal?: string;
  channel?: string;
  created_by?: string;
};

export type UpdateCampaignInput = Partial<
  Omit<CreateCampaignInput, "created_by">
>;

export type CreateLeadInput = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  source: LeadSource;
  campaign_id?: string;
  status?: LeadStatus;
  estimated_value_gnf?: number;
  notes?: string;
  created_by?: string;
};

export type UpdateLeadInput = Partial<Omit<CreateLeadInput, "created_by">>;

export const CAMPAIGN_TYPE_LABELS: Record<CampaignType, string> = {
  email: "Email",
  social: "Réseaux sociaux",
  sms: "SMS",
  event: "Événement",
  radio: "Radio",
  affichage: "Affichage",
  autre: "Autre",
};

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  draft: "Brouillon",
  active: "Active",
  paused: "En pause",
  completed: "Terminée",
  cancelled: "Annulée",
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  campaign: "Campagne",
  referral: "Recommandation",
  website: "Site web",
  social: "Réseaux sociaux",
  event: "Événement",
  cold: "Prospection",
  autre: "Autre",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Nouveau",
  contacted: "Contacté",
  qualified: "Qualifié",
  proposal: "Proposition",
  converted: "Converti",
  lost: "Perdu",
};

export const LEAD_PIPELINE_ORDER: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "converted",
];

export function leadPipelineProgress(status: LeadStatus): number {
  if (status === "lost") return 0;
  const idx = LEAD_PIPELINE_ORDER.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / LEAD_PIPELINE_ORDER.length) * 100);
}
