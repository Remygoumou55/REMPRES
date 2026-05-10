"use client";

import { useMemo, useState } from "react";
import type { EmployeeContract } from "@/modules/hr/contracts/types";

export function useContracts(contracts: EmployeeContract[]) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contracts.filter((contract) => {
      const byStatus = !status || contract.status === status;
      const byText =
        !q ||
        contract.contractType.toLowerCase().includes(q) ||
        String(contract.title ?? "").toLowerCase().includes(q) ||
        contract.employeeId.toLowerCase().includes(q);
      return byStatus && byText;
    });
  }, [contracts, query, status]);
  return { query, setQuery, status, setStatus, filtered };
}

