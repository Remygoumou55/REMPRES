"use client";

import { memo } from "react";
import { CheckCircle2 } from "lucide-react";
import { CertificateDownloadButton } from "@/components/formation/CertificateDownloadButton";

type Props = {
  certificateId: string;
  certificateNumber: string;
  message: string;
};

export const CertificateIssueSuccessBanner = memo(function CertificateIssueSuccessBanner({
  certificateId,
  certificateNumber,
  message,
}: Props) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">{message}</p>
          <p className="mt-1 text-xs text-emerald-800">
            Certificat N°{certificateNumber} — téléchargez le PDF ci-dessous.
          </p>
        </div>
      </div>
      <CertificateDownloadButton
        certificateId={certificateId}
        certificateNumber={certificateNumber}
        variant="button"
      />
    </div>
  );
});
