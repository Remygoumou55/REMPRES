/**
 * HR domain completion registry — Bloc 3 Étape 1.
 */
export const HR_DOMAIN_COMPLETION_VERSION = "hr-domain-completion-bloc3-v1" as const;

export const HR_DOMAIN_COMPLETION_MATRIX = [
  { area: "employee_lifecycle", expected: "profiles + history + events", result: "active" as const },
  { area: "attendance", expected: "rh_attendance_events + bus", result: "active" as const },
  { area: "leave_governance", expected: "approval + types + sync", result: "active" as const },
  { area: "hr_event_bus", expected: "14+ hr.* events wired", result: "active" as const },
  { area: "dept_cockpit", expected: "live KPIs non-placeholder", result: "active" as const },
] as const;

export const HR_LEAVE_TYPES_OFFICIAL = ["annual", "sick", "special", "unpaid"] as const;
