export type RhSlaSample = {
  requestedAt: string;
  approvedAt: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled" | "expired";
};

export type RhReportingSummary = {
  slaAvgHours: number;
  processedCount: number;
  rejectionRatePct: number;
  pendingOver48h: number;
  proactiveAlerts: string[];
};

export function computeRhReportingSummary(samples: RhSlaSample[], now = new Date()): RhReportingSummary {
  const approvedDurationsHours = samples
    .filter((sample) => sample.status === "approved" && sample.approvedAt)
    .map((sample) => {
      const requested = new Date(sample.requestedAt).getTime();
      const approved = new Date(sample.approvedAt as string).getTime();
      return (approved - requested) / (1000 * 60 * 60);
    })
    .filter((hours) => Number.isFinite(hours) && hours >= 0);

  const processed = samples.filter((sample) => sample.status === "approved" || sample.status === "rejected");
  const rejected = processed.filter((sample) => sample.status === "rejected");

  const pendingOver48h = samples.filter((sample) => {
    if (sample.status !== "pending") return false;
    const requested = new Date(sample.requestedAt).getTime();
    if (!Number.isFinite(requested)) return false;
    return now.getTime() - requested >= 48 * 60 * 60 * 1000;
  }).length;

  const slaAvgHours =
    approvedDurationsHours.length > 0
      ? Number((approvedDurationsHours.reduce((sum, value) => sum + value, 0) / approvedDurationsHours.length).toFixed(1))
      : 0;
  const rejectionRatePct =
    processed.length > 0 ? Number(((rejected.length / processed.length) * 100).toFixed(1)) : 0;

  const proactiveAlerts: string[] = [];
  if (pendingOver48h > 0) proactiveAlerts.push("dashboard.rh.alert.pendingOver48h");
  if (rejectionRatePct >= 40) proactiveAlerts.push("dashboard.rh.alert.highRejectionRate");
  if (slaAvgHours > 72) proactiveAlerts.push("dashboard.rh.alert.slaDegraded");

  return {
    slaAvgHours,
    processedCount: processed.length,
    rejectionRatePct,
    pendingOver48h,
    proactiveAlerts,
  };
}

