import { expect, test, type Page } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";

/**
 * Fumée responsive automatisée : ne remplace pas une QA device matrix humaine,
 * mais détecte régressions grossières (layout qui déborde en largeur document).
 */
const ROUTES = [
  "/dashboard",
  "/finance",
  "/vente/clients",
  "/vente/produits",
  "/vente/historique",
] as const;

const VIEWPORTS = [
  { name: "mobile-small", width: 360, height: 740 },
  { name: "tablet-portrait", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
] as const;

async function assertNoHorizontalDocumentOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `Débordement horizontal document (scrollWidth=${scrollWidth} > clientWidth=${clientWidth})`,
  ).toBeLessThanOrEqual(clientWidth + 2);
}

test.describe("Responsive layout smoke", () => {
  for (const vp of VIEWPORTS) {
    test(`aucun débordement document sur routes clés (${vp.name})`, async ({ page }) => {
      skipWithoutE2ECredentials();
      const diagnostics: string[] = [];
      attachStrictPageDiagnostics(page, diagnostics);

      await page.setViewportSize({ width: vp.width, height: vp.height });
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
        await assertNoHorizontalDocumentOverflow(page);
      }

      expect(diagnostics, diagnostics.join("\n")).toEqual([]);
    });
  }
});
