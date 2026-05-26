"use server";

import { revalidatePath } from "next/cache";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createPayslip, deletePayslip } from "@/lib/server/payslips";
import type { PayslipData } from "@/components/rh/PayslipPDF";
import type { CreatePayslipInput } from "@/lib/server/payslips";

export type GeneratePayslipResult = {
  success: boolean;
  payslipId?: string;
  payslipData?: PayslipData;
  error?: string;
};

export async function generatePayslipAction(
  input: Omit<CreatePayslipInput, "generated_by">,
): Promise<GeneratePayslipResult> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await createPayslip({ ...input, generated_by: user.id });
  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath("/rh/fiches-de-paie");
  revalidatePath(`/rh/collaborateurs/${input.employee_id}`);

  return {
    success: true,
    payslipId: result.id,
    payslipData: result.payslipData,
  };
}

export async function deletePayslipAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) return { success: false, error: "Non authentifié." };

  const result = await deletePayslip(id);
  revalidatePath("/rh/fiches-de-paie");

  return result;
}
