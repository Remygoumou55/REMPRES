"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Printer, RotateCcw, History } from "lucide-react";

type CompletedSale = {
  id: string;
  reference: string | null;
  total_amount_gnf: number;
  displayTotal: string;
};

export function SuccessContent({
  sale,
  onNewSale,
}: {
  sale: CompletedSale;
  onNewSale: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white p-10 shadow-sm">
      <div className="w-full max-w-sm text-center">

        {/* Icône succès animée */}
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle size={44} className="text-emerald-500" />
        </div>

        <h2 className="text-2xl font-extrabold text-darktext">Vente enregistrée !</h2>

        {sale.reference && (
          <div className="mt-2 inline-flex items-center rounded-full bg-primary/8 px-3 py-1">
            <span className="font-mono text-sm font-bold text-primary">{sale.reference}</span>
          </div>
        )}

        <div className="mt-4 rounded-2xl bg-gray-50 px-4 py-3">
          <p className="text-xs text-gray-400">Montant total</p>
          <p className="text-3xl font-extrabold tabular-nums text-darktext">
            {sale.displayTotal}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <a
            href={`/vente/recu/${sale.id}?print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-darktext transition hover:bg-gray-50"
          >
            <Printer size={15} />
            Imprimer le reçu
          </a>
          <button
            type="button"
            onClick={onNewSale}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
          >
            <RotateCcw size={15} />
            Nouvelle vente
          </button>
          <button
            type="button"
            onClick={() => router.push("/vente/historique")}
            className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <History size={15} />
            Voir l&apos;historique
          </button>
        </div>
      </div>
    </div>
  );
}
