import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { skipWithoutE2ECredentials } from "./helpers/auth";

test.describe("Auth — connexion", () => {
  test("connexion puis redirection vers l’app métier", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    const email = process.env.E2E_USER_EMAIL!.trim();
    const password = process.env.E2E_USER_PASSWORD!;

    await page.goto("/login");
    await page.fill("#email", email);
    await page.fill("#password", password);
    await page.getByRole("button", { name: "Se connecter" }).click();

    await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 });
    await expect(page).not.toHaveURL(/\/error-profile$/);

    const path = new URL(page.url()).pathname;
    expect(path.startsWith("/access-denied")).toBeFalsy();

    const allowed = [
      "/dashboard",
      "/vente/",
      "/finance",
      "/admin/",
      "/rh",
      "/formation",
      "/consultation",
      "/marketing",
      "/logistique",
    ];
    expect(allowed.some((prefix) => path === prefix || path.startsWith(prefix + "/"))).toBeTruthy();

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
