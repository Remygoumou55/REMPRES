"use client";

import { memo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { Quote } from "@/lib/server/quotes";

type Props = {
  quote: Quote;
  variant?: "default" | "outline" | "small";
};

const QuoteButton = memo(function QuoteButton({
  quote,
  variant = "default",
}: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { default: QuotePDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./QuotePDF"),
      ]);

      const blob = await pdf(<QuotePDF quote={quote} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = quote.client_name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "")
        .slice(0, 30);

      link.href = url;
      link.download = `${quote.quote_number}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("QuotePDF error:", err);
    } finally {
      setLoading(false);
    }
  };

  const btnClass =
    variant === "small"
      ? "inline-flex items-center gap-1.5 rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50"
      : variant === "outline"
        ? "inline-flex items-center gap-2 rounded-lg border border-indigo-300 bg-white px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
        : "inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      title={`Télécharger ${quote.quote_number}`}
      className={btnClass}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {loading ? "Génération..." : "Télécharger PDF"}
    </button>
  );
});

export default QuoteButton;
