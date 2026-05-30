"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import { createReview, type CreateReviewInput } from "@/lib/server/rh";

export async function createReviewAction(
  input: Omit<CreateReviewInput, "reviewer_id">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await createReview({
    ...input,
    reviewer_id: user.id,
  });

  if (result.success) {
    revalidatePath("/rh/evaluations");
    revalidatePath(`/rh/collaborateurs/${input.employee_id}`);
  }

  return result;
}
