import type { Page } from "@playwright/test";

const IGNORE_CONSOLE_PATTERNS = [/Download the React DevTools/i];

function ignoreConsoleMessage(text: string): boolean {
  return IGNORE_CONSOLE_PATTERNS.some((re) => re.test(text));
}

/** Collecte erreurs console / exceptions non gérées ; à assert après le test. */
export function attachStrictPageDiagnostics(page: Page, failures: string[]): void {
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ignoreConsoleMessage(text)) return;
    failures.push(`[console.${msg.type()}] ${text}`);
  });
  page.on("pageerror", (err) => {
    failures.push(`[pageerror] ${err.message}`);
  });
}
