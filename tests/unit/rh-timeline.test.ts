import { describe, expect, it } from "vitest";
import { buildRhTimeline } from "@/lib/rh/timeline";

describe("buildRhTimeline", () => {
  it("orders items by newest date first", () => {
    const result = buildRhTimeline([
      { id: "a", label: "older", source: "activity", createdAt: "2026-05-01T10:00:00.000Z" },
      { id: "b", label: "newer", source: "leave", createdAt: "2026-05-02T10:00:00.000Z" },
    ]);
    expect(result.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("enforces upper limit", () => {
    const result = buildRhTimeline(
      [
        { id: "1", label: "1", source: "activity", createdAt: "2026-05-01T00:00:00.000Z" },
        { id: "2", label: "2", source: "leave", createdAt: "2026-05-02T00:00:00.000Z" },
        { id: "3", label: "3", source: "attendance", createdAt: "2026-05-03T00:00:00.000Z" },
      ],
      2,
    );
    expect(result).toHaveLength(2);
    expect(result.map((item) => item.id)).toEqual(["3", "2"]);
  });
});

