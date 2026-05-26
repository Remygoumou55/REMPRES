"use client";

import { memo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, Loader2 } from "lucide-react";
import { CertificateDownloadButton } from "@/components/formation/CertificateDownloadButton";
import { issueCertificateFromEnrollmentAction } from "@/app/(app)/formation/inscriptions/actions";

type Props = {
  enrollmentId: string;
  status: string;
  certificate?: { id: string; certificate_number: string } | null;
};

export const EnrollmentCertificateCell = memo(function EnrollmentCertificateCell({
  enrollmentId,
  status,
  certificate,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (status !== "completed") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  if (certificate) {
    return (
      <CertificateDownloadButton
        certificateId={certificate.id}
        certificateNumber={certificate.certificate_number}
        variant="button"
      />
    );
  }

  function handleIssue() {
    startTransition(async () => {
      const res = await issueCertificateFromEnrollmentAction(enrollmentId);
      if (res.success && res.certificateId) {
        router.push(
          `/formation/certificats?success=${encodeURIComponent(`Certificat ${res.certNumber ?? ""} émis.`)}&issuedId=${res.certificateId}`,
        );
      } else {
        router.push(
          `/formation/inscriptions?error=${encodeURIComponent(res.error ?? "Erreur")}`,
        );
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleIssue}
      disabled={isPending}
      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-50"
    >
      {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
      Émettre
    </button>
  );
});
