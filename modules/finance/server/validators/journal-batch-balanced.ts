import { assertBalancedJournal, type DebitCreditLine } from "@/modules/finance/utils/assert-balanced-lines";

export function validateJournalLinesForPost(lines: readonly DebitCreditLine[]): void {
  assertBalancedJournal(lines);
}
