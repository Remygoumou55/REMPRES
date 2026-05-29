"use client";

import { memo, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import type { EmployeeContractData } from "@/lib/server/rh";

type Props = {
  data: EmployeeContractData;
};

const ContratButton = memo(function ContratButton({ data }: Props) {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { default: ContratPDF }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./ContratPDF"),
      ]);

      const blob = await pdf(<ContratPDF data={data} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeName = data.full_name
        .replace(/\s+/g, "_")
        .replace(/[^a-zA-Z0-9_-]/g, "");
      link.href = url;
      link.download = `${data.contract_number}_${safeName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ContratPDF error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      {loading ? "Génération..." : "Générer le contrat"}
    </button>
  );
});

export default ContratButton;
