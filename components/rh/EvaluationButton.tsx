"use client";

import { memo, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import type { PerformanceReview } from "@/lib/rh/performance-reviews-shared";

type Props = {
  review: PerformanceReview;
  employeeName: string;
};

const EvaluationButton = memo(function EvaluationButton({
  review,
  employeeName,
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { default: EvaluationPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./EvaluationPDF"),
      ]);

      const blob = await pdf(<EvaluationPDF review={review} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safePeriod = review.period_label
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      const safeName = employeeName
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      link.href = url;
      link.download = `EVAL-${safePeriod}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("EvaluationPDF error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <ClipboardCheck className="h-4 w-4" />
      )}
      {loading ? "Génération..." : "Télécharger l'évaluation"}
    </button>
  );
});

export default EvaluationButton;
