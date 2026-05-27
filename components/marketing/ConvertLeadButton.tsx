"use client";

import { memo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  UserCheck,
} from "lucide-react";
import { convertLeadToClientAction } from "@/app/(app)/marketing/leads/actions";

type Props = {
  leadId: string;
  leadName: string;
  leadEmail: string | null;
  currentStatus: string;
};

type UiState = "idle" | "confirm" | "loading" | "success" | "already_exists" | "error" | "approval";

function ConvertLeadButtonInner({
  leadId,
  leadName,
  leadEmail,
  currentStatus,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [ui, setUi] = useState<UiState>("idle");
  const [clientId, setClientId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (currentStatus === "converted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
        <CheckCircle className="h-3.5 w-3.5" />
        Déjà converti
      </span>
    );
  }

  if (currentStatus === "lost") {
    return null;
  }

  const runConvert = () => {
    startTransition(async () => {
      setUi("loading");
      setMessage(null);
      const result = await convertLeadToClientAction(leadId);
      if (result.requiresApproval) {
        setUi("approval");
        setMessage(
          result.error ??
            "Demande d'approbation envoyée — un responsable validera la conversion.",
        );
        return;
      }
      if (result.alreadyExists && result.clientId) {
        setClientId(result.clientId);
        setUi("already_exists");
        setMessage(result.error ?? "Un client existe déjà avec cet email.");
        router.refresh();
        return;
      }
      if (!result.success || !result.clientId) {
        setUi("error");
        setMessage(result.error ?? "Conversion impossible.");
        return;
      }
      setClientId(result.clientId);
      setUi("success");
      router.refresh();
    });
  };

  if (ui === "success" && clientId) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <CheckCircle className="h-3.5 w-3.5" />
          Client créé
        </span>
        <Link
          href={`/vente/clients/${clientId}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Voir dans Vente →
        </Link>
      </span>
    );
  }

  if (ui === "already_exists" && clientId) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700">
          <AlertCircle className="h-3.5 w-3.5" />
          Client existant
        </span>
        <Link
          href={`/vente/clients/${clientId}`}
          className="text-xs font-medium text-primary hover:underline"
        >
          Voir le client →
        </Link>
      </span>
    );
  }

  if (ui === "approval") {
    return (
      <span className="max-w-[200px] text-right text-xs text-blue-700">
        {message}
      </span>
    );
  }

  if (ui === "error") {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <span className="text-xs text-red-600">{message}</span>
        <button
          type="button"
          onClick={() => setUi("idle")}
          className="text-xs text-gray-500 underline"
        >
          Réessayer
        </button>
      </span>
    );
  }

  if (ui === "confirm" || pending) {
    return (
      <span className="inline-flex flex-wrap items-center justify-end gap-2">
        <span className="text-xs text-gray-600">Confirmer la conversion ?</span>
        <button
          type="button"
          disabled={pending}
          onClick={runConvert}
          className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800"
        >
          {pending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <CheckCircle className="h-3 w-3" />
          )}
          Confirmer
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setUi("idle")}
          className="text-xs text-gray-500 underline"
        >
          Annuler
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setUi("confirm")}
      className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-900"
      title={leadEmail ? `Convertir ${leadName} (${leadEmail})` : leadName}
    >
      <UserCheck className="h-3.5 w-3.5" />
      Convertir en client
    </button>
  );
}

export const ConvertLeadButton = memo(ConvertLeadButtonInner);
