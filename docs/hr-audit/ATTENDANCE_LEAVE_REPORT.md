# Attendance + leave — Bloc 3

**Attendance :** `hr-attendance-mutations.ts` → `rh_attendance_events` → `hr.attendance.recorded`.

**Leave types :** annual, sick, special, unpaid (`047_rh_domain_completion.sql`).

**Workflow :** submit → approval_requests → approve/reject + SQL trigger sync.

**Events :** requested, approved, rejected.
