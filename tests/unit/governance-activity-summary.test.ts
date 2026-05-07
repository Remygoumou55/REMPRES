import { describe, expect, it } from "vitest";
import { summarizeDepartmentActivity } from "@/lib/governance/analytics/activity-summary";

describe("governance activity summary", () => {
  it("maps module activity to department counters", () => {
    const result = summarizeDepartmentActivity(
      [
        { module_key: "clients", created_at: "2026-01-01T00:00:00Z" },
        { module_key: "finance", created_at: "2026-01-01T00:00:00Z" },
        { module_key: "unknown", created_at: "2026-01-01T00:00:00Z" },
      ],
      ["VENTE", "FINANCE"],
    );

    expect(result.VENTE).toBe(1);
    expect(result.FINANCE).toBe(1);
  });
});
