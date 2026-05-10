import {
  EVALUATION_RECOMMENDATIONS,
  INTERVIEW_STATUSES,
  INTERVIEW_TYPES,
  ONBOARDING_STATUSES,
  PIPELINE_STAGES,
  SOURCE_CHANNELS,
} from "@/modules/hr/recruitment/constants";

export function isValidPipelineStage(value: string): value is (typeof PIPELINE_STAGES)[number] {
  return (PIPELINE_STAGES as readonly string[]).includes(value);
}

export function isValidSourceChannel(value: string): value is (typeof SOURCE_CHANNELS)[number] {
  return (SOURCE_CHANNELS as readonly string[]).includes(value);
}

export function isValidInterviewType(value: string): value is (typeof INTERVIEW_TYPES)[number] {
  return (INTERVIEW_TYPES as readonly string[]).includes(value);
}

export function isValidInterviewStatus(value: string): value is (typeof INTERVIEW_STATUSES)[number] {
  return (INTERVIEW_STATUSES as readonly string[]).includes(value);
}

export function isValidRecommendation(value: string): value is (typeof EVALUATION_RECOMMENDATIONS)[number] {
  return (EVALUATION_RECOMMENDATIONS as readonly string[]).includes(value);
}

export function isValidOnboardingStatus(value: string): value is (typeof ONBOARDING_STATUSES)[number] {
  return (ONBOARDING_STATUSES as readonly string[]).includes(value);
}
