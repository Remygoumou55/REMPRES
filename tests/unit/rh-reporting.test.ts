import { describe, expect, it } from "vitest";
import { computeRhReportingSummary } from "@/lib/rh/reporting";

describe("computeRhReportingSummary", () => {
  it("computes SLA, rejection rate and pending older than 48h", () => {
    const summary = computeRhReportingSummary(
      [
        {
          requestedAt: "2026-05-01T00:00:00.000Z",
          approvedAt: "2026-05-01T12:00:00.000Z",
          status: "approved",
        },
        {
          requestedAt: "2026-05-02T00:00:00.000Z",
          approvedAt: null,
          status: "rejected",
        },
        {
          requestedAt: "2026-05-01T00:00:00.000Z",
          approvedAt: null,
          status: "pending",
        },
      ],
      new Date("2026-05-04T00:00:00.000Z"),
    );

    expect(summary.slaAvgHours).toBe(12);
    expect(summary.rejectionRatePct).toBe(50);
    expect(summary.pendingOver48h).toBe(1);
    expect(summary.proactiveAlerts.length).toBeGreaterThan(0);
  });
});

