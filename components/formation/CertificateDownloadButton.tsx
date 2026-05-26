"use client";

import { memo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { getCertificateDataAction } from "@/app/(app)/formation/certificats/actions";

type Props = {
  certificateId: string;
  certificateNumber?: string;
  variant?: "button" | "icon";
};

export const CertificateDownloadButton = memo(function CertificateDownloadButton({
  certificateId,
  certificateNumber,
  variant = "button",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await getCertificateDataAction(certificateId);
      if (!res.success || !res.certificate || !res.trainee || !res.training) {
        setError(res.error ?? "Données introuvables.");
        return;
      }
      const { downloadCertificatePDF } = await import("@/components/formation/CertificatePDF");
      await downloadCertificatePDF(res.certificate, res.trainee, res.training);
    } catch {
      setError("Échec de la génération du PDF.");
    } finally {
      setLoading(false);
    }
  }

  if (variant === "icon") {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={handleDownload}
          disabled={loading}
          title={certificateNumber ? `Télécharger ${certificateNumber}` : "Télécharger PDF"}
          className="inline-flex items-center justify-center rounded-md border border-gray-200 p-1.5 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        </button>
        {error ? <span className="text-[10px] text-red-600">{error}</span> : null}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        Télécharger PDF
      </button>
      {error ? <span className="text-[10px] text-red-600">{error}</span> : null}
    </span>
  );
});
