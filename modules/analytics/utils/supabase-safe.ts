export async function safeCount(promise: PromiseLike<{ count: number | null }>): Promise<number> {
  try {
    const result = await promise;
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

export async function safeData<T>(promise: PromiseLike<{ data: T | null }>, fallback: T): Promise<T> {
  try {
    const result = await promise;
    return result.data ?? fallback;
  } catch {
    return fallback;
  }
}
