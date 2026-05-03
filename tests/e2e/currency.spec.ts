import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";

test.describe("Devise — conversion UI", () => {
  test("change la devise globale sans erreur console ni gel", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    await loginAsTestUser(page);
    await page.goto("/dashboard");
    await expect(page.locator("body")).toBeVisible();

    const switcher = page.getByLabel("Changer la devise");
    await expect(switcher).toBeVisible();
    await switcher.selectOption("USD");
    await expect(switcher).toHaveValue("USD");

    await switcher.selectOption("EUR");
    await expect(switcher).toHaveValue("EUR");

    await switcher.selectOption("GNF");
    await expect(switcher).toHaveValue("GNF");

    expect(page.url()).not.toContain("/login");
    await expect(page.locator("body")).toBeVisible();

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
