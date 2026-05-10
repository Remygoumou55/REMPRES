export type ContractStatus =
  | "draft"
  | "pending_approval"
  | "active"
  | "expired"
  | "terminated"
  | "renewal_due";

export type EmployeeContract = {
  id: string;
  employeeId: string;
  contractType: string;
  status: ContractStatus;
  startDate: string;
  endDate: string | null;
  salaryGnf: number | null;
  title: string | null;
  renewalWindowDays: number;
  approvalRequestId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ContractDocument = {
  id: string;
  contractId: string;
  documentType: string;
  fileName: string;
  storagePath: string;
  createdAt: string;
};

export type ContractHistoryEvent = {
  id: string;
  contractId: string;
  eventType: string;
  eventLabel: string;
  createdAt: string;
};

