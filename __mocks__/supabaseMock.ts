export type MockQueryResult = {
  data: unknown;
  error: null | { message: string };
};

/** Chainable Supabase query mock — terminal methods resolve with `defaultResult`. */
export function createSupabaseMock(
  defaultResult: MockQueryResult = { data: null, error: null },
) {
  const chain: Record<string, jest.Mock> = {
    from: jest.fn(),
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    eq: jest.fn(),
    neq: jest.fn(),
    is: jest.fn(),
    in: jest.fn(),
    gte: jest.fn(),
    lte: jest.fn(),
    order: jest.fn(),
    limit: jest.fn(),
    range: jest.fn(),
    single: jest.fn().mockResolvedValue(defaultResult),
    maybeSingle: jest.fn().mockResolvedValue(defaultResult),
  };

  for (const key of Object.keys(chain)) {
    if (key !== "single" && key !== "maybeSingle") {
      chain[key].mockReturnValue(chain);
    }
  }

  Object.defineProperty(chain, "then", {
    get() {
      return (resolve: (value: MockQueryResult) => void) =>
        Promise.resolve(defaultResult).then(resolve);
    },
    configurable: true,
  });

  return chain;
}

export function mockSupabaseClient(result: MockQueryResult) {
  return createSupabaseMock(result);
}
