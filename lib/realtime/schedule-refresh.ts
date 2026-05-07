type ScheduleRefreshOptions = {
  debounceMs: number;
  minIntervalMs: number;
};

export function createRefreshScheduler(
  refresh: () => void,
  options: ScheduleRefreshOptions,
) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastRefreshAt = 0;

  const schedule = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      const now = Date.now();
      if (now - lastRefreshAt < options.minIntervalMs) return;
      lastRefreshAt = now;
      refresh();
    }, options.debounceMs);
  };

  const cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return { schedule, cancel };
}
