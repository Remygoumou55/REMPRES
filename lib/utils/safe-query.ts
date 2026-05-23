export async function safeCount(
  query: PromiseLike<{ count: number | null; error: unknown }>,
): Promise<number> {
  try {
    const { count, error } = await query;
    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function safeSum(
  query: PromiseLike<{ data: Record<string, unknown>[] | null; error: unknown }>,
  column: string,
): Promise<number> {
  try {
    const { data, error } = await query;
    if (error || !data) return 0;
    return data.reduce((acc, row) => acc + (Number(row[column]) || 0), 0);
  } catch {
    return 0;
  }
}

export async function safeRows<T>(
  query: PromiseLike<{ data: T[] | null; error: unknown }>,
): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

export async function safeFirst<T>(
  query: PromiseLike<{ data: T | null; error: unknown }>,
): Promise<T | null> {
  try {
    const { data, error } = await query;
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

export function currentMonthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
  return { from, to };
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}
