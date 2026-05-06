import { expect, test } from "@playwright/test";

/**
 * Garde-fous sans identifiants : vérifie que le middleware renvoie vers /login
 * (stabilité navigation — pas de rendu partiel authentifié).
 */
const PROTECTED_SAMPLES = [
  "/dashboard",
  "/vente/nouvelle-vente",
  "/vente/clients",
  "/finance",
  "/finance/depenses",
  "/admin/users",
  "/settings",
  "/rh",
] as const;

test.describe("Routes protégées — utilisateur non connecté", () => {
  for (const path of PROTECTED_SAMPLES) {
    test(`redirige ${path} vers la page de connexion`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login(\?|$)/);
    });
  }

  test("ne boucle pas entre /login et la racine lorsque déconnecté", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/");
    await expect(page).toHaveURL(/^http:\/\/[^/]+\/?$/);
  });
});
