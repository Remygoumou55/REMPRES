beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

jest.mock("react", () => {
  const actual = jest.requireActual<typeof import("react")>("react");
  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T): T => fn,
  };
});

afterAll(() => {
  jest.restoreAllMocks();
});
