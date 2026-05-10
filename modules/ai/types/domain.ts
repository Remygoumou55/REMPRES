import type { Database } from "@/types/database.types";

export type AiInsightRow = Database["public"]["Tables"]["erp_ai_insights"]["Row"];
export type AiRecommendationRow = Database["public"]["Tables"]["erp_ai_recommendations"]["Row"];
export type AiPipelineRunRow = Database["public"]["Tables"]["erp_ai_pipeline_runs"]["Row"];
export type AiForecastArtifactRow = Database["public"]["Tables"]["erp_ai_forecast_artifacts"]["Row"];
export type AiAssistantEventRow = Database["public"]["Tables"]["erp_ai_assistant_events"]["Row"];
