import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    /** Playwright utilise aussi `*.spec.ts` — ne pas les exécuter avec Vitest. */
    exclude: ["**/node_modules/**", "**/tests/e2e/**"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    passWithNoTests: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
