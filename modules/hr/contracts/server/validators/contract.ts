import { CONTRACT_STATUSES, CONTRACT_TYPES } from "@/modules/hr/contracts/constants";

export function isValidContractType(value: string): value is (typeof CONTRACT_TYPES)[number] {
  return (CONTRACT_TYPES as readonly string[]).includes(value);
}

export function isValidContractStatus(value: string): value is (typeof CONTRACT_STATUSES)[number] {
  return (CONTRACT_STATUSES as readonly string[]).includes(value);
}

