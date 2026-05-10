export function employeeFullName(firstName: string | null, lastName: string | null, email: string | null, id: string): string {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName || email || id.slice(0, 8);
}

