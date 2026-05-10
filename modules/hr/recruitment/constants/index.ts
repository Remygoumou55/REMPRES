export const PIPELINE_STAGES = [
  "sourced",
  "screening",
  "interview",
  "offer",
  "pending_hire_approval",
  "hired",
  "rejected",
  "withdrawn",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const SOURCE_CHANNELS = ["direct", "referral", "agency", "website", "other"] as const;

export const INTERVIEW_TYPES = ["phone", "technical", "hr", "panel", "other"] as const;

export const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no_show"] as const;

export const EVALUATION_RECOMMENDATIONS = ["hire", "hold", "no_hire"] as const;

export const ONBOARDING_STATUSES = ["not_started", "in_progress", "completed"] as const;

export const RECRUITMENT_HIRE_ENTITY = "rh_recruitment_hire";

export const RECRUITMENT_HIRE_APPROVAL_ACTION = "rh_recruitment_hire";
