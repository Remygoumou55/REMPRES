import { expect, test } from "@playwright/test";
import { attachStrictPageDiagnostics } from "./helpers/strict-console";
import { loginAsTestUser, skipWithoutE2ECredentials } from "./helpers/auth";
import { e2eRunId } from "./helpers/run-id";

/**
 * Parcours vente complet : données créées dans ce test pour éviter la dépendance à une seed DB.
 */
test.describe.serial("Vente — parcours POS", () => {
  test("crée client + produit puis valide une vente", async ({ page }) => {
    skipWithoutE2ECredentials();
    const diagnostics: string[] = [];
    attachStrictPageDiagnostics(page, diagnostics);

    const rid = e2eRunId();
    const clientFirst = `Vente${rid.slice(-8)}`;
    const clientEmail = `e2e.sale.${rid}@example.test`;
    const sku = `V-${rid}`;
    const productLabel = `Article vente ${rid}`;

    await loginAsTestUser(page);

    /* ── Client ─────────────────────────────────────── */
    await page.goto("/vente/clients");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await page.getByRole("link", { name: "+ Nouveau client" }).click();
    let dlg = page.getByRole("dialog", { name: "Nouveau client" });
    await dlg.getByPlaceholder("Malin").fill(clientFirst);
    await dlg.getByPlaceholder("Loua").fill("VenteE2E");
    await dlg.getByPlaceholder("email@exemple.com").fill(clientEmail);
    await dlg.getByRole("button", { name: /Créer le client/ }).click();
    await expect(dlg).not.toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Client créé avec succès")).toBeVisible();

    /* ── Produit ────────────────────────────────────── */
    await page.goto("/vente/produits");
    await expect(page.getByRole("heading", { name: "Produits" })).toBeVisible();
    await page.getByRole("link", { name: "+ Nouveau produit" }).click();
    dlg = page.getByRole("dialog", { name: "Nouveau produit" });
    await dlg.locator('input[name="sku"]').fill(sku);
    await dlg.locator('input[name="name"]').fill(productLabel);
    const priceBox = dlg.locator('input[placeholder="0"]').first();
    await priceBox.click();
    await priceBox.fill("10000");
    await dlg.locator('input[name="stock_quantity"]').fill("100");
    await dlg.locator('input[name="stock_threshold"]').fill("2");
    await dlg.getByRole("button", { name: /Créer le produit/ }).click();
    await expect(dlg).not.toBeVisible({ timeout: 45_000 });
    await expect(page.getByText("Produit créé avec succès")).toBeVisible();

    /* ── Vente ──────────────────────────────────────── */
    await page.goto("/vente/nouvelle-vente");
    await expect(page.getByRole("heading", { name: "Nouvelle vente" })).toBeVisible();

    await page.getByPlaceholder("Rechercher par nom ou SKU…").fill(sku);
    await page.getByRole("button", { name: new RegExp(productLabel) }).first().click();

    await page.getByRole("button", { name: /Panier/ }).click();
    const panier = page.getByRole("dialog", { name: "Panier" });
    await expect(panier).toBeVisible();

    await panier.getByLabel("Filtrer les clients").fill(clientFirst);
    await panier.getByRole("option", { name: new RegExp(clientFirst) }).first().click();

    await expect(panier.getByRole("button", { name: /Valider la vente/ })).toBeEnabled({ timeout: 30_000 });
    await panier.getByRole("button", { name: /Valider la vente/ }).click();

    await expect(page.getByRole("heading", { name: "Vente enregistrée !" })).toBeVisible({ timeout: 45_000 });

    expect(diagnostics, diagnostics.join("\n")).toEqual([]);
  });
});
