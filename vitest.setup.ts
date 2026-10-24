import { vi } from "vitest";

/** `React.cache` n'existe qu'avec le runtime Next.js (React canary) — identité en tests. */
vi.mock("react", async () => {
  const actual = await vi.importActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  };
});
