import { describe, expect, it } from "vitest";
import { buildAuthErrorHref, mapAuthCallbackError } from "@/lib/auth/callback-errors";

describe("mapAuthCallbackError", () => {
  it("maps expired links", () => {
    expect(mapAuthCallbackError("otp_expired", null)).toBe("Invitation expirée");
  });

  it("maps already-used links", () => {
    expect(mapAuthCallbackError("invalid_grant", "already redeemed")).toBe(
      "Invitation déjà utilisée",
    );
  });

  it("maps malformed links", () => {
    expect(mapAuthCallbackError("bad_code", null)).toBe("Lien invalide");
  });

  it("falls back to generic message", () => {
    expect(mapAuthCallbackError("unexpected_error", "boom")).toBe("Erreur lors de l'invitation");
  });
});

describe("buildAuthErrorHref", () => {
  it("encodes message safely", () => {
    expect(buildAuthErrorHref("Lien invalide")).toBe("/auth/error?message=Lien%20invalide");
  });
});
