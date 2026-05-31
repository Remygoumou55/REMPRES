import {
  ASSIGNABLE_ROLE_OPTIONS_UI,
  ROLE_KEYS,
  type AppRoleKey,
} from "@/lib/auth/roles";
import {
  DEPARTMENT_KEYS,
  DEPARTMENT_NAVIGATION,
  DEPARTMENT_OPTIONS_UI,
  normalizeDepartmentKey,
  type DepartmentKey,
} from "@/lib/departments/department-config";

export type UserAssignmentOption = {
  /** Encodage formulaire : `{roleKey}:{departmentKey}` */
  value: string;
  /** Libellé affiché, ex. « Manager Vente » */
  label: string;
  roleKey: AppRoleKey;
  departmentKey: DepartmentKey;
};

const ASSIGNMENT_VALUE_SEP = ":";

function encodeAssignment(roleKey: AppRoleKey, departmentKey: DepartmentKey): string {
  return `${roleKey}${ASSIGNMENT_VALUE_SEP}${departmentKey}`;
}

function buildLabel(roleLabel: string, departmentLabel: string): string {
  return `${roleLabel} ${departmentLabel}`;
}

function departmentsForRole(roleKey: AppRoleKey): readonly { key: DepartmentKey; label: string }[] {
  if (roleKey === ROLE_KEYS.ACCOUNTANT) {
    return [{ key: DEPARTMENT_KEYS.FINANCE, label: DEPARTMENT_NAVIGATION.FINANCE.label }];
  }
  if (roleKey === ROLE_KEYS.AUDITOR) {
    return [{ key: DEPARTMENT_KEYS.AUDIT, label: DEPARTMENT_NAVIGATION.AUDIT.label }];
  }
  return DEPARTMENT_OPTIONS_UI;
}

/** Options combinées rôle + département pour invitation / édition utilisateur. */
export const USER_ASSIGNMENT_OPTIONS_UI: readonly UserAssignmentOption[] =
  ASSIGNABLE_ROLE_OPTIONS_UI.flatMap((role) =>
    departmentsForRole(role.key).map((dept) => ({
      value: encodeAssignment(role.key, dept.key),
      label: buildLabel(role.label, dept.label),
      roleKey: role.key,
      departmentKey: dept.key,
    })),
  );

export function parseUserAssignment(
  raw: string | null | undefined,
): { roleKey: AppRoleKey; departmentKey: DepartmentKey } | null {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  const match = USER_ASSIGNMENT_OPTIONS_UI.find((option) => option.value === value);
  if (match) {
    return { roleKey: match.roleKey, departmentKey: match.departmentKey };
  }

  const sep = value.indexOf(ASSIGNMENT_VALUE_SEP);
  if (sep <= 0) return null;

  const roleKey = value.slice(0, sep).trim() as AppRoleKey;
  const departmentKey = normalizeDepartmentKey(value.slice(sep + 1)) as DepartmentKey;
  const valid = USER_ASSIGNMENT_OPTIONS_UI.some(
    (option) => option.roleKey === roleKey && option.departmentKey === departmentKey,
  );
  if (!valid) return null;

  return { roleKey, departmentKey };
}

export function resolveUserAssignmentValue(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
): string {
  const role = String(roleKey ?? "").trim();
  const dept = normalizeDepartmentKey(departmentKey) as DepartmentKey;
  const match = USER_ASSIGNMENT_OPTIONS_UI.find(
    (option) => option.roleKey === role && option.departmentKey === dept,
  );
  return match?.value ?? encodeAssignment(role as AppRoleKey, dept);
}

export function formatUserAssignmentLabel(
  roleKey: string | null | undefined,
  departmentKey: string | null | undefined,
  roleLabel?: string | null,
): string {
  const match = USER_ASSIGNMENT_OPTIONS_UI.find(
    (option) =>
      option.roleKey === String(roleKey ?? "").trim() &&
      option.departmentKey === normalizeDepartmentKey(departmentKey),
  );
  if (match) return match.label;
  if (roleLabel && departmentKey) {
    return `${roleLabel} ${normalizeDepartmentKey(departmentKey)}`;
  }
  return roleLabel ?? roleKey ?? "—";
}
