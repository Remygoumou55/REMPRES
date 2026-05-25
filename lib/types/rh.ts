export type ContractType = "cdi" | "cdd" | "stage" | "freelance";
export type LeaveType = "annual" | "sick" | "special" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  position: string;
  department: string;
  hire_date: string;
  salary_gnf: number;
  contract_type: ContractType;
  is_active: boolean;
  user_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type LeaveRequest = {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: LeaveStatus;
  review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  requested_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  employee?: {
    first_name: string;
    last_name: string;
    position: string | null;
    department: string | null;
  } | null;
};

export type AttendanceRow = {
  id: string;
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  arrival_time: string | null;
  departure_time: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
  updated_at: string;
  employee?: {
    first_name: string;
    last_name: string;
    position: string | null;
    department: string | null;
  } | null;
};

export type CreateEmployeeInput = {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  position: string;
  department: string;
  hire_date: string;
  salary_gnf?: number;
  contract_type: ContractType;
  is_active?: boolean;
  notes?: string;
  created_by?: string;
};

export type UpdateEmployeeInput = Partial<
  Omit<CreateEmployeeInput, "created_by">
>;

export type CreateLeaveRequestInput = {
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason?: string;
  requested_by?: string;
};

export type RecordAttendanceInput = {
  employee_id: string;
  date: string;
  status: AttendanceStatus;
  arrival_time?: string;
  departure_time?: string;
  notes?: string;
  recorded_by?: string;
};

export const CONTRACT_TYPE_LABELS: Record<ContractType, string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  freelance: "Freelance",
};

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Congé annuel",
  sick: "Congé maladie",
  special: "Congé spécial",
  unpaid: "Sans solde",
};

export const LEAVE_STATUS_LABELS: Record<LeaveStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  cancelled: "Annulé",
};

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  absent: "Absent",
  late: "En retard",
  half_day: "Demi-journée",
};
