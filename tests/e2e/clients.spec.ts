import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";
import { e2eRunId } from "./helpers/run-id";

test.describe("Clients — création", () => {
  test("ouvre la modale Nouveau client et crée un particulier", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    const rid = e2eRunId();
    const firstName = `E2E${rid}`;
    const email = `e2e.client.${rid}@example.test`;

    await loginAsTestUser(page);
    await page.goto("/vente/clients");

    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();

    await page.getByRole("link", { name: /Nouveau client/i }).click();
    const dialog = page.getByRole("dialog", { name: "Nouveau client" });
    await expect(dialog).toBeVisible();

    await dialog.getByPlaceholder("Malin").fill(firstName);
    await dialog.getByPlaceholder("Loua").fill("Playwright");
    await dialog.getByPlaceholder("email@exemple.com").fill(email);

    await dialog.getByRole("button", { name: /Créer le client/ }).click();

    await expect(dialog).not.toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Client créé avec succès")).toBeVisible();
    await expect(page.getByText(email)).toBeVisible({ timeout: 15_000 });

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
