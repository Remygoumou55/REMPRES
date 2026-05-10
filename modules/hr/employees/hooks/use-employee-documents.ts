"use client";

import { useEffect, useState } from "react";
import type { EmployeeDocument } from "@/modules/hr/employees/types";

export function useEmployeeDocuments(employeeId: string | null) {
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!employeeId) {
        setDocuments([]);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`/api/rh/employees/${employeeId}/documents`, { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { documents?: EmployeeDocument[] };
        if (!cancelled) setDocuments(payload.documents ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  return { documents, loading, setDocuments };
}

