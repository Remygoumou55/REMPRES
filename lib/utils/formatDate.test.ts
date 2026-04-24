import { describe, expect, it } from "vitest";
import { formatDateDayFr } from "./formatDate";

describe("formatDateDayFr", () => {
  it("retourne une date lisible pour une ISO valide", () => {
    const s = formatDateDayFr("2024-01-15T10:00:00.000Z");
    expect(s).not.toBe("—");
    expect(s).toMatch(/15/);
    expect(s).toMatch(/2024/);
  });

  it("retourne un tiret pour une entrée invalide", () => {
    expect(formatDateDayFr("not-a-date")).toBe("—");
  });
});
