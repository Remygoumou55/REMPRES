import { memo } from "react";
import {
  ATTENDANCE_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  LEAVE_STATUS_LABELS,
  LEAVE_TYPE_LABELS,
} from "@/lib/types/rh";

const ACTIVE_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  inactive: "bg-red-100 text-red-800",
  on_leave: "bg-orange-100 text-orange-800",
};

const ACTIVE_LABELS: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  on_leave: "Congé",
};

function EmployeeStatusBadgeInner({ isActive }: { isActive: boolean }) {
  const key = isActive ? "active" : "inactive";
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ACTIVE_STYLES[key]}`}>
      {ACTIVE_LABELS[key]}
    </span>
  );
}
export const EmployeeStatusBadge = memo(EmployeeStatusBadgeInner);

const CONTRACT_STYLES: Record<string, string> = {
  cdi: "bg-blue-100 text-blue-800",
  cdd: "bg-amber-100 text-amber-800",
  stage: "bg-gray-100 text-gray-700",
  freelance: "bg-purple-100 text-purple-800",
};

function ContractTypeBadgeInner({ type }: { type: string }) {
  const key = (type ?? "cdi").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CONTRACT_STYLES[key] ?? CONTRACT_STYLES.cdi}`}>
      {CONTRACT_TYPE_LABELS[key as keyof typeof CONTRACT_TYPE_LABELS] ?? type}
    </span>
  );
}
export const ContractTypeBadge = memo(ContractTypeBadgeInner);

const LEAVE_TYPE_STYLES: Record<string, string> = {
  annual: "bg-blue-100 text-blue-800",
  sick: "bg-red-100 text-red-800",
  special: "bg-purple-100 text-purple-800",
  unpaid: "bg-gray-100 text-gray-700",
};

function LeaveTypeBadgeInner({ type }: { type: string }) {
  const key = (type ?? "annual").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_TYPE_STYLES[key] ?? LEAVE_TYPE_STYLES.annual}`}>
      {LEAVE_TYPE_LABELS[key as keyof typeof LEAVE_TYPE_LABELS] ?? type}
    </span>
  );
}
export const LeaveTypeBadge = memo(LeaveTypeBadgeInner);

const LEAVE_STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
};

function LeaveStatusBadgeInner({ status }: { status: string }) {
  const key = (status ?? "pending").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${LEAVE_STATUS_STYLES[key] ?? LEAVE_STATUS_STYLES.pending}`}>
      {LEAVE_STATUS_LABELS[key as keyof typeof LEAVE_STATUS_LABELS] ?? status}
    </span>
  );
}
export const LeaveStatusBadge = memo(LeaveStatusBadgeInner);

const ATTENDANCE_STYLES: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-800",
  absent: "bg-red-100 text-red-800",
  late: "bg-amber-100 text-amber-800",
  half_day: "bg-blue-100 text-blue-800",
};

function AttendanceStatusBadgeInner({ status }: { status: string }) {
  const key = (status ?? "present").toLowerCase();
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${ATTENDANCE_STYLES[key] ?? ATTENDANCE_STYLES.present}`}>
      {ATTENDANCE_STATUS_LABELS[key as keyof typeof ATTENDANCE_STATUS_LABELS] ?? status}
    </span>
  );
}
export const AttendanceStatusBadge = memo(AttendanceStatusBadgeInner);

function EmployeeAvatarInner({
  firstName,
  lastName,
  size = 40,
}: {
  firstName: string;
  lastName: string;
  size?: number;
}) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/70 to-primary text-xs font-semibold text-white"
      style={{ width: size, height: size, fontSize: size / 2.8 }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
}
export const EmployeeAvatar = memo(EmployeeAvatarInner);
