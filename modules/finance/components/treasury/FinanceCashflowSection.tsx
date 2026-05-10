"use client";

import { FinanceCashflowMiniChart } from "@/modules/finance/ui/charts/FinanceCashflowMiniChart";

export function FinanceCashflowSection({
  points,
}: {
  points: { date: string; closing: number }[];
}) {
  return <FinanceCashflowMiniChart points={points} />;
}
