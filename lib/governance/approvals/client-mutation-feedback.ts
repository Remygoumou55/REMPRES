"use client";

import {
  APPROVAL_PENDING_QUERY_PARAM,
  isApprovalPendingMessage,
  withApprovalPendingQuery,
} from "@/lib/governance/approvals/pending-notice";

type ListFlash = { success?: string; error?: string };

function withListFlash(pathname: string, queryString: string, flash: ListFlash): string {
  const p = new URLSearchParams(queryString.replace(/^\?/, ""));
  p.delete("success");
  p.delete("error");
  p.delete(APPROVAL_PENDING_QUERY_PARAM);
  if (flash.success) p.set("success", flash.success);
  if (flash.error) p.set("error", flash.error);
  const qs = p.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

type MutationFeedbackHandlers = {
  pushThenRefresh: (href: string) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
};

/**
 * Factorise le retour UI après mutation liste (vente, finance, etc.).
 * Les approbations en attente ouvrent la modale globale au lieu du bandeau rouge.
 */
export function applyListMutationFeedback(
  result: { success: boolean; error?: string },
  opts: {
    pathname: string;
    queryString: string;
    successMessage: string;
  } & MutationFeedbackHandlers,
): void {
  const { pathname, queryString, successMessage, pushThenRefresh, showSuccess, showError } = opts;

  if (result.success) {
    showSuccess(successMessage);
    pushThenRefresh(withListFlash(pathname, queryString, { success: successMessage }));
    return;
  }

  if (isApprovalPendingMessage(result.error)) {
    pushThenRefresh(withApprovalPendingQuery(pathname, queryString));
    return;
  }

  const err = result.error ?? "Impossible de terminer l'opération.";
  showError(err);
  pushThenRefresh(withListFlash(pathname, queryString, { error: err }));
}
