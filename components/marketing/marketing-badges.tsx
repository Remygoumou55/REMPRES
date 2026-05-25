import { memo } from "react";
import {
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
  LEAD_PIPELINE_ORDER,
  LEAD_SOURCE_LABELS,
  LEAD_STATUS_LABELS,
  leadPipelineProgress,
  type CampaignStatus,
  type CampaignType,
  type LeadSource,
  type LeadStatus,
} from "@/lib/types/marketing";

const CAMPAIGN_TYPE_STYLES: Record<CampaignType, string> = {
  email: "bg-blue-100 text-blue-800",
  social: "bg-purple-100 text-purple-800",
  sms: "bg-emerald-100 text-emerald-800",
  event: "bg-orange-100 text-orange-800",
  radio: "bg-amber-100 text-amber-800",
  affichage: "bg-gray-100 text-gray-700",
  autre: "bg-slate-100 text-slate-700",
};

function CampaignTypeBadgeInner({ type }: { type: CampaignType }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_TYPE_STYLES[type]}`}
    >
      {CAMPAIGN_TYPE_LABELS[type]}
    </span>
  );
}
export const CampaignTypeBadge = memo(CampaignTypeBadgeInner);

const CAMPAIGN_STATUS_STYLES: Record<CampaignStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  active: "bg-emerald-100 text-emerald-800",
  paused: "bg-amber-100 text-amber-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

function CampaignStatusBadgeInner({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CAMPAIGN_STATUS_STYLES[status]}`}
    >
      {CAMPAIGN_STATUS_LABELS[status]}
    </span>
  );
}
export const CampaignStatusBadge = memo(CampaignStatusBadgeInner);

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-amber-100 text-amber-800",
  qualified: "bg-purple-100 text-purple-800",
  proposal: "bg-orange-100 text-orange-800",
  converted: "bg-emerald-100 text-emerald-800",
  lost: "bg-red-100 text-red-800",
};

function LeadStatusBadgeInner({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAD_STATUS_STYLES[status]}`}
    >
      {LEAD_STATUS_LABELS[status]}
      {status === "converted" ? " ✓" : ""}
    </span>
  );
}
export const LeadStatusBadge = memo(LeadStatusBadgeInner);

const LEAD_SOURCE_STYLES: Record<LeadSource, string> = {
  campaign: "bg-blue-100 text-blue-800",
  referral: "bg-emerald-100 text-emerald-800",
  website: "bg-purple-100 text-purple-800",
  social: "bg-pink-100 text-pink-800",
  event: "bg-orange-100 text-orange-800",
  cold: "bg-gray-100 text-gray-700",
  autre: "bg-slate-100 text-slate-700",
};

function LeadSourceBadgeInner({ source }: { source: LeadSource }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAD_SOURCE_STYLES[source]}`}
    >
      {LEAD_SOURCE_LABELS[source]}
    </span>
  );
}
export const LeadSourceBadge = memo(LeadSourceBadgeInner);

function LeadPipelineProgressInner({ status }: { status: LeadStatus }) {
  const progress = leadPipelineProgress(status);
  const isLost = status === "lost";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-gray-700">Progression du pipeline</span>
        <span className="font-semibold text-darktext">
          {isLost ? "Perdu" : `${progress}%`}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-2 rounded-full transition-all ${
            isLost
              ? "bg-red-500 w-full"
              : status === "converted"
                ? "bg-emerald-500"
                : "bg-primary"
          }`}
          style={{ width: isLost ? "100%" : `${progress}%` }}
        />
      </div>
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {LEAD_PIPELINE_ORDER.map((s, idx) => {
          const currIdx = LEAD_PIPELINE_ORDER.indexOf(status);
          const active = !isLost && currIdx >= idx;
          return (
            <span
              key={s}
              className={`rounded px-2 py-0.5 font-medium ${
                active
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {LEAD_STATUS_LABELS[s]}
            </span>
          );
        })}
      </div>
    </div>
  );
}
export const LeadPipelineProgress = memo(LeadPipelineProgressInner);
