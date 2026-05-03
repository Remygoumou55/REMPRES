import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";

const ROUTES = [
  "/dashboard",
  "/finance",
  "/vente/clients",
  "/vente/produits",
  "/vente/nouvelle-vente",
  "/vente/historique",
  "/settings",
] as const;

test.describe("Navigation & stabilité", () => {
  test("parcours des routes principales sans crash", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    await loginAsTestUser(page);

    for (const path of ROUTES) {
      await page.goto(path);
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      if (url.includes("/access-denied")) continue;
      if (url.includes("/login")) {
        throw new Error(`Session expirée ou refus sur ${path}`);
      }
      await expect(page.locator("body")).toBeVisible();
    }

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
