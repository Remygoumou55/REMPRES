import { expect, test, type Page } from "@playwright/test";

export function skipWithoutE2ECredentials(): void {
  test.skip(
    !process.env.E2E_USER_EMAIL?.trim() || !process.env.E2E_USER_PASSWORD,
    "Définir E2E_USER_EMAIL et E2E_USER_PASSWORD pour les tests E2E.",
  );
}

export async function loginAsTestUser(page: Page): Promise<void> {
  const email = process.env.E2E_USER_EMAIL!.trim();
  const password = process.env.E2E_USER_PASSWORD!;

  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 45_000 });
  await expect(page).not.toHaveURL(/\/error-profile$/);
}
