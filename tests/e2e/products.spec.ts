import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";
import { e2eRunId } from "./helpers/run-id";

test.describe("Produits — création", () => {
  test("ouvre la modale Nouveau produit et crée un article", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    const rid = e2eRunId();
    const sku = `E2E-${rid}`;
    const name = `Produit Playwright ${rid}`;

    await loginAsTestUser(page);
    await page.goto("/vente/produits");

    await expect(page.getByRole("heading", { name: "Produits" })).toBeVisible();

    await page.getByRole("link", { name: "+ Nouveau produit" }).click();
    const dialog = page.getByRole("dialog", { name: "Nouveau produit" });
    await expect(dialog).toBeVisible();

    await dialog.locator('input[name="sku"]').fill(sku);
    await dialog.locator('input[name="name"]').fill(name);

    const priceBox = dialog.locator('input[placeholder="0"]').first();
    await priceBox.click();
    await priceBox.fill("25000");

    await dialog.locator('input[name="stock_quantity"]').fill("25");
    await dialog.locator('input[name="stock_threshold"]').fill("3");

    await dialog.getByRole("button", { name: /Créer le produit/ }).click();

    await expect(dialog).not.toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Produit créé avec succès")).toBeVisible();
    await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 15_000 });

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
