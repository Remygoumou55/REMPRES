"use client";

import { memo, useState, useTransition } from "react";
import {
  ArrowRightLeft,
  Check,
  Clock,
  Loader2,
  Send,
  X,
} from "lucide-react";
import {
  acceptQuoteAction,
  convertQuoteToSaleAction,
  expireQuoteAction,
  refuseQuoteAction,
  sendQuoteAction,
} from "@/app/(app)/vente/devis/actions";
import type { QuoteStatus } from "@/lib/server/quotes";

const QUOTE_STATUS_TRANSITIONS: Record<QuoteStatus, QuoteStatus[]> = {
  draft: ["sent", "accepted", "refused"],
  sent: ["accepted", "refused", "expired"],
  accepted: ["converted"],
  refused: [],
  expired: [],
  converted: [],
};

type Props = {
  quoteId: string;
  currentStatus: QuoteStatus;
  quoteNumber: string;
};

const QuoteStatusButton = memo(function QuoteStatusButton({
  quoteId,
  currentStatus,
  quoteNumber,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [showRefuseDialog, setShowRefuseDialog] = useState(false);
  const [refuseReason, setRefuseReason] = useState("");
  const [showConvertDialog, setShowConvertDialog] = useState(false);

  const allowed = QUOTE_STATUS_TRANSITIONS[currentStatus] ?? [];
  if (allowed.length === 0) return null;

  const handleSend = () =>
    startTransition(async () => {
      await sendQuoteAction(quoteId).catch(() => {});
    });

  const handleAccept = () =>
    startTransition(async () => {
      await acceptQuoteAction(quoteId).catch(() => {});
    });

  const handleRefuse = () => {
    setShowRefuseDialog(true);
  };

  const confirmRefuse = () =>
    startTransition(async () => {
      await refuseQuoteAction(quoteId, refuseReason || undefined).catch(() => {});
      setShowRefuseDialog(false);
      setRefuseReason("");
    });

  const handleExpire = () =>
    startTransition(async () => {
      await expireQuoteAction(quoteId).catch(() => {});
    });

  const handleConvert = () => {
    setShowConvertDialog(true);
  };

  const confirmConvert = () =>
    startTransition(async () => {
      const result = await convertQuoteToSaleAction(quoteId).catch(() => ({
        success: false,
        error: "Erreur réseau",
      }));
      setShowConvertDialog(false);
      if (result && !result.success) {
        alert(result.error ?? "Erreur conversion");
      }
    });

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {allowed.includes("sent") ? (
        <button
          type="button"
          onClick={handleSend}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          Envoyer au client
        </button>
      ) : null}

      {allowed.includes("accepted") ? (
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm font-medium text-green-700 transition-colors hover:bg-green-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Check className="h-3.5 w-3.5" />
          )}
          Marquer accepté
        </button>
      ) : null}

      {allowed.includes("expired") ? (
        <button
          type="button"
          onClick={handleExpire}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Clock className="h-3.5 w-3.5" />
          )}
          Marquer expiré
        </button>
      ) : null}

      {allowed.includes("refused") ? (
        <button
          type="button"
          onClick={handleRefuse}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Refuser
        </button>
      ) : null}

      {allowed.includes("converted") ? (
        <button
          type="button"
          onClick={handleConvert}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ArrowRightLeft className="h-4 w-4" />
          )}
          Convertir en vente
        </button>
      ) : null}

      {showRefuseDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-base font-semibold text-gray-900">
              Refuser le devis {quoteNumber}
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Vous pouvez indiquer une raison de refus (optionnel).
            </p>
            <textarea
              value={refuseReason}
              onChange={(e) => setRefuseReason(e.target.value)}
              placeholder="Raison du refus..."
              rows={3}
              className="mb-4 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRefuseDialog(false);
                  setRefuseReason("");
                }}
                disabled={isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRefuse}
                disabled={isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isPending ? "Traitement..." : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showConvertDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                <ArrowRightLeft className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900">Convertir en vente</h3>
            </div>
            <p className="mb-2 text-sm text-gray-600">
              Vous êtes sur le point de convertir le devis{" "}
              <span className="font-mono font-semibold text-gray-900">{quoteNumber}</span> en
              vente.
            </p>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="mb-1 text-xs font-semibold text-amber-800">
                ⚠️ Action irréversible
              </p>
              <p className="text-xs text-amber-700">
                Une nouvelle vente sera créée et le stock sera mis à jour automatiquement. Cette
                action ne peut pas être annulée.
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConvertDialog(false)}
                disabled={isPending}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmConvert}
                disabled={isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {isPending ? "Conversion en cours..." : "Confirmer la conversion"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default QuoteStatusButton;
