"use client";

import { ShieldCheck } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { APPROVAL_PENDING_NOTICE } from "@/lib/governance/approvals/pending-notice";

type ApprovalPendingNoticeModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Modale professionnelle — action sensible soumise au Super Admin.
 */
export function ApprovalPendingNoticeModal({ open, onClose }: ApprovalPendingNoticeModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={APPROVAL_PENDING_NOTICE.title}
      subtitle={APPROVAL_PENDING_NOTICE.subtitle}
      icon={<ShieldCheck size={18} />}
      size="md"
      overlayClassName="p-4 z-[10050]"
      cardClassName="z-[10051]"
    >
      <p className="text-sm leading-relaxed text-darktext/85">{APPROVAL_PENDING_NOTICE.body}</p>
      <p className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950">
        {APPROVAL_PENDING_NOTICE.hint}
      </p>
      <div className="mt-6 flex justify-end">
        <Button type="button" variant="primary" onClick={onClose}>
          {APPROVAL_PENDING_NOTICE.confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
