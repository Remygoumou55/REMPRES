export type DebitCreditLine = { debit_credit: "D" | "C"; amount_gnf: number };

export function sumDebitCredit(lines: readonly DebitCreditLine[]): { debit: number; credit: number } {
  let debit = 0;
  let credit = 0;
  for (const l of lines) {
    if (l.debit_credit === "D") debit += Number(l.amount_gnf);
    else credit += Number(l.amount_gnf);
  }
  return { debit, credit };
}

export function assertBalancedJournal(lines: readonly DebitCreditLine[]): void {
  const { debit, credit } = sumDebitCredit(lines);
  if (debit <= 0) throw new Error("Journal vide ou débits invalides.");
  if (debit !== credit) throw new Error(`Journal déséquilibré : débits ${debit} ≠ crédits ${credit}.`);
}
