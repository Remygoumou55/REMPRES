export const FR_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
] as const;

export type BankReconciliationStatus = "draft" | "in_progress" | "validated";

export type BankReconciliation = {
  id: string;
  month: number;
  year: number;
  period_label: string;
  system_balance_gnf: number;
  bank_balance_gnf: number | null;
  discrepancy_gnf: number | null;
  status: BankReconciliationStatus;
  notes: string | null;
  validated_at: string | null;
  created_at: string;
};

export type DiscrepancyLevel = "none" | "positive" | "negative";

export function periodLabel(month: number, year: number): string {
  return `${FR_MONTHS[month - 1] ?? month} ${year}`;
}

export function getDiscrepancyLevel(disc: number | null): DiscrepancyLevel {
  if (disc === null) return "none";
  if (disc === 0) return "none";
  if (disc > 0) return "positive";
  return "negative";
}

export function getDiscrepancyColor(disc: number | null): { bg: string; text: string } {
  const level = getDiscrepancyLevel(disc);
  if (level === "none") return { bg: "#EAF3DE", text: "#27500A" };
  if (level === "positive") return { bg: "#FAEEDA", text: "#633806" };
  return { bg: "#FCEBEB", text: "#791F1F" };
}
