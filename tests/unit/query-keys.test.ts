import { describe, expect, it } from "vitest";
import { queryKeys } from "@/lib/query/query-keys";

describe("queryKeys", () => {
  it("keeps deterministic finance snapshot keys", () => {
    const a = queryKeys.finance.snapshot({
      from: "2026-05-01",
      to: "2026-05-31",
      categoryIds: ["b", "a"],
      createdBy: "u1",
    });
    const b = queryKeys.finance.snapshot({
      from: "2026-05-01",
      to: "2026-05-31",
      categoryIds: ["a", "b"],
      createdBy: "u1",
    });
    expect(a).toEqual(b);
  });

  it("namespaces domains to avoid cross-module pollution", () => {
    expect(queryKeys.vente.clients[0]).toBe("vente");
    expect(queryKeys.finance.expenses[0]).toBe("finance");
    expect(queryKeys.admin.activityLogs[0]).toBe("admin");
  });
});
