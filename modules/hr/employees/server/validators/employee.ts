import { EMPLOYEE_DOCUMENT_TYPES } from "@/modules/hr/employees/constants";

export function validateEmployeeDocumentType(value: string): value is (typeof EMPLOYEE_DOCUMENT_TYPES)[number] {
  return (EMPLOYEE_DOCUMENT_TYPES as readonly string[]).includes(value);
}

export function validateEmployeeId(value: string): boolean {
  return /^[0-9a-fA-F-]{8,}$/.test(String(value ?? "").trim());
}

