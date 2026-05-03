import { describe, expect, it } from "vitest";
import { formatGNF } from "./formatCurrency";

/** Normalise les espaces insécables (U+202F fin, U+00A0 classique — tous deux utilisés selon le formatage). */
function norm(s: string): string {
  return s.replace(/\u202f/g, " ").replace(/\u00a0/g, " ");
}

describe("formatGNF", () => {
  it("sépare les milliers (fr-FR) et ajoute GNF", () => {
    expect(norm(formatGNF(1_500_000))).toBe("1 500 000 GNF");
    expect(norm(formatGNF(0))).toBe("0 GNF");
  });
});
