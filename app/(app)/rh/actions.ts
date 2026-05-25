"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { revalidateRH } from "@/lib/cache/revalidation-map";
import { recordHrAttendance } from "@/modules/hr/server/services/hr-attendance-mutations";
import {
  submitHrLeaveRequest,
  updateHrLeaveStatus,
} from "@/modules/hr/server/services/hr-leave-mutations";

export async function submitRhLeaveRequestAction(
  input: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await submitHrLeaveRequest(data.user.id, input);
  if (result.success) {
    await revalidateRH();
  }
  return result;
}

export async function submitRhAttendanceAction(
  input: { eventType: "check_in" | "check_out"; notes?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await recordHrAttendance(data.user.id, input);
  if (result.success) {
    await revalidateRH();
  }
  return result;
}

export async function updateRhLeaveStatusAction(
  input: { leaveRequestId: string; status: "approved" | "rejected" | "cancelled"; rejectionReason?: string },
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = getSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");

  const result = await updateHrLeaveStatus(data.user.id, input);
  if (result.success) {
    await revalidateRH();
  }
  return result;
}
