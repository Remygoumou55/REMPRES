import { defineConfig, devices } from "@playwright/test";

/**
 * E2E RemPres ERP — variables d’environnement :
 *   E2E_USER_EMAIL      — compte avec droits vente + clients + produits
 *   E2E_USER_PASSWORD
 *   PLAYWRIGHT_BASE_URL — défaut http://localhost:3030
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 25_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3030",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: process.env.CI ? "retain-on-failure" : "off",
    actionTimeout: 25_000,
    navigationTimeout: 60_000,
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3030",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
