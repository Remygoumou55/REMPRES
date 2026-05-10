/**
 * Micro-batch événements applicatifs (flush synchrone ou timer léger),
 * sans broker externe — réduit la pression réseau realtime / audit.
 */
export class MicroEventBatch<T> {
  private readonly buffer: T[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly flushFn: (batch: readonly T[]) => void | Promise<void>,
    private readonly options?: { maxSize?: number; maxWaitMs?: number },
  ) {}

  push(item: T): void {
    const maxSize = this.options?.maxSize ?? 50;
    this.buffer.push(item);
    if (this.buffer.length >= maxSize) {
      void this.flushNow();
      return;
    }
    this.schedule();
  }

  private schedule(): void {
    const wait = this.options?.maxWaitMs ?? 120;
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flushNow();
    }, wait);
  }

  async flushNow(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (!this.buffer.length) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    await this.flushFn(batch);
  }
}
