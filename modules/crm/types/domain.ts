import type { Database } from "@/types/database.types";

/** CRM pipeline — table `crm_leads`. Distinct de `public.leads` (marketing, type `Lead`). */
export type CrmLeadRow = Database["public"]["Tables"]["crm_leads"]["Row"];
export type CrmOpportunityRow = Database["public"]["Tables"]["crm_opportunities"]["Row"];
export type CrmQuoteRow = Database["public"]["Tables"]["crm_quotes"]["Row"];
export type CrmActivityRow = Database["public"]["Tables"]["crm_activities"]["Row"];
export type CrmPipelineStageRow = Database["public"]["Tables"]["crm_pipeline_stages"]["Row"];
export type CrmForecastSnapshotRow = Database["public"]["Tables"]["crm_forecast_snapshots"]["Row"];
