"use client";

import { useEffect, useState } from "react";
import type { EmployeeHistoryEvent } from "@/modules/hr/employees/types";

export function useEmployeeHistory(employeeId: string | null) {
  const [history, setHistory] = useState<EmployeeHistoryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!employeeId) {
        setHistory([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/rh/employees/${employeeId}/history`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { history?: EmployeeHistoryEvent[] };
        if (!cancelled) setHistory(payload.history ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return { history, loading, setHistory };
}

