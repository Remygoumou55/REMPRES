import type { PipelineStage } from "@/modules/hr/recruitment/constants";

export type RecruitmentCandidate = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  jobTitle: string;
  departmentKey: string | null;
  pipelineStage: PipelineStage;
  sourceChannel: string;
  notes: string | null;
  hireApprovalRequestId: string | null;
  hiredProfileId: string | null;
  hiredContractId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecruitmentInterview = {
  id: string;
  candidateId: string;
  interviewType: string;
  scheduledAt: string;
  durationMinutes: number;
  locationNote: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
};

export type RecruitmentEvaluation = {
  id: string;
  candidateId: string;
  evaluatorUserId: string;
  score: number | null;
  recommendation: string;
  comments: string | null;
  createdAt: string;
};

export type RecruitmentDocument = {
  id: string;
  candidateId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
};

export type RecruitmentHistoryEvent = {
  id: string;
  candidateId: string;
  eventType: string;
  eventLabel: string;
  createdAt: string;
};

export type RecruitmentOnboarding = {
  id: string;
  candidateId: string;
  status: string;
  checklist: Record<string, unknown>;
  linkedProfileId: string | null;
  linkedContractId: string | null;
  updatedAt: string;
};
