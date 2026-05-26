"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApprovalPendingNoticeModal } from "@/components/governance/approvals/ApprovalPendingNoticeModal";
import {
  APPROVAL_PENDING_QUERY_PARAM,
  isApprovalPendingMessage,
  stripApprovalNoticeParams,
} from "@/lib/governance/approvals/pending-notice";

/**
 * Pont global : ouvre la modale d’approbation en attente quand l’URL le signale
 * (`?approval_pending=1` ou ancien `?error=` avec message gouvernance).
 */
export function ApprovalPendingNoticeBridge() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const pendingFlag = searchParams.get(APPROVAL_PENDING_QUERY_PARAM) === "1";
    const errorParam = searchParams.get("error");
    const errorDecoded = errorParam ? decodeURIComponent(errorParam) : "";
    const shouldOpen = pendingFlag || isApprovalPendingMessage(errorDecoded);
    setOpen(shouldOpen);
  }, [searchParams]);

  const close = useCallback(() => {
    setOpen(false);
    const qs = searchParams.toString();
    const next = stripApprovalNoticeParams(pathname, qs ? `?${qs}` : "");
    router.replace(next);
  }, [pathname, router, searchParams]);

  return <ApprovalPendingNoticeModal open={open} onClose={close} />;
}
