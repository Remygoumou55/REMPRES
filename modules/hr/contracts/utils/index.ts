export function isContractNearExpiration(endDate: string | null, renewalWindowDays: number, now = new Date()): boolean {
  if (!endDate) return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  const threshold = new Date(now.getTime() + renewalWindowDays * 24 * 60 * 60 * 1000);
  return end.getTime() <= threshold.getTime();
}

/** Contrat encore valide mais dont la date de fin entre dans la fenêtre de renouvellement. */
export function shouldMarkRenewalDue(
  endDate: string | null,
  renewalWindowDays: number,
  now = new Date(),
): boolean {
  if (!endDate) return false;
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (end < today) return false;
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + renewalWindowDays);
  return end <= horizon;
}

