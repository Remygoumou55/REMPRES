"use server";

import { redirect } from "next/navigation";
import { revalidateRH } from "@/lib/cache/revalidation-map";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { assertRhWrite, canRhManageLeaves } from "@/lib/server/rh-access";
import { createLeaveRequest, updateLeaveStatus } from "@/lib/server/rh";
import type { LeaveType } from "@/lib/types/rh";

function field(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

export async function createLeaveRequestAction(formData: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  await assertRhWrite(user.id);

  const employeeId = field(formData, "employee_id");
  const result = await createLeaveRequest({
    employee_id: employeeId,
    leave_type: (field(formData, "leave_type") || "annual") as LeaveType,
    start_date: field(formData, "start_date"),
    end_date: field(formData, "end_date"),
    reason: field(formData, "reason") || undefined,
    requested_by: user.id,
  });

  if (!result.success) {
    redirect(`/rh/conges/new?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(`/rh/conges?success=${encodeURIComponent("Demande de congé enregistrée.")}`);
}

export async function approveLeaveAction(id: string) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canRhManageLeaves(user.id))) redirect("/access-denied");

  const result = await updateLeaveStatus(id, "approved", undefined, user.id);
  if (!result.success) {
    redirect(`/rh/conges?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(`/rh/conges?success=${encodeURIComponent("Demande approuvée.")}`);
}

export async function rejectLeaveAction(id: string, formData?: FormData) {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  if (!(await canRhManageLeaves(user.id))) redirect("/access-denied");

  const reason = formData ? field(formData, "reason") : "";
  const result = await updateLeaveStatus(
    id,
    "rejected",
    reason || undefined,
    user.id,
  );
  if (!result.success) {
    redirect(`/rh/conges?error=${encodeURIComponent(result.error ?? "Erreur")}`);
  }
  await revalidateRH();
  redirect(`/rh/conges?success=${encodeURIComponent("Demande refusée.")}`);
}
