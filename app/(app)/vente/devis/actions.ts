"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSessionUser } from "@/lib/server/auth-session";
import {
  acceptQuote,
  createQuote,
  deleteQuote,
  expireQuote,
  getQuoteById,
  refuseQuote,
  sendQuote,
  type CreateQuoteInput,
  type Quote,
} from "@/lib/server/quotes";

function revalidateQuotePaths(id?: string) {
  revalidatePath("/vente/devis");
  if (id) revalidatePath(`/vente/devis/${id}`);
}

export async function createQuoteAction(
  input: Omit<CreateQuoteInput, "created_by">,
): Promise<{
  success: boolean;
  id?: string;
  quote_number?: string;
  error?: string;
}> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await createQuote({
    ...input,
    created_by: user.id,
  });

  if (result.success) {
    revalidateQuotePaths(result.id);
  }

  return result;
}

export async function sendQuoteAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await sendQuote(id);
  if (result.success) revalidateQuotePaths(id);
  return result;
}

export async function acceptQuoteAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await acceptQuote(id);
  if (result.success) revalidateQuotePaths(id);
  return result;
}

export async function refuseQuoteAction(
  id: string,
  reason?: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await refuseQuote(id, reason);
  if (result.success) revalidateQuotePaths(id);
  return result;
}

export async function expireQuoteAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await expireQuote(id);
  if (result.success) revalidateQuotePaths(id);
  return result;
}

export async function deleteQuoteAction(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");

  const result = await deleteQuote(id);
  if (result.success) revalidatePath("/vente/devis");
  return result;
}

export async function getQuotePdfAction(id: string): Promise<Quote | null> {
  const user = await getServerSessionUser();
  if (!user) redirect("/login");
  return getQuoteById(id);
}
