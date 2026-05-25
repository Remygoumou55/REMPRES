/**
 * Types de congés RH — Bloc 3 (aligné rh_leave_requests.leave_type).
 */
export const HR_LEAVE_TYPES = ["annual", "sick", "special", "unpaid"] as const;

export type HrLeaveType = (typeof HR_LEAVE_TYPES)[number];

export const HR_LEAVE_TYPE_LABELS: Record<HrLeaveType, string> = {
  annual: "Conge annuel",
  sick: "Conge maladie",
  special: "Conge special",
  unpaid: "Conge sans solde",
};

export function isValidHrLeaveType(value: string): value is HrLeaveType {
  return (HR_LEAVE_TYPES as readonly string[]).includes(value);
}
