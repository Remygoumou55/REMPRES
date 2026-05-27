"use client";

import { memo, useMemo, useState, useTransition } from "react";
import { updateCampaignMetricsAction } from "@/app/(app)/marketing/campagnes/[id]/actions";
import {
  computeRates,
  formatRate,
  getRateBg,
  getRateColor,
  type CampaignMetrics,
} from "@/lib/utils/campaign-analytics";

type Props = {
  campaignId: string;
  currentMetrics: CampaignMetrics;
  onSuccess: () => void;
};

function CampaignMetricsFormInner({
  campaignId,
  currentMetrics,
  onSuccess,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(String(currentMetrics.sent_count));
  const [open, setOpen] = useState(String(currentMetrics.open_count));
  const [click, setClick] = useState(String(currentMetrics.click_count));
  const [conversion, setConversion] = useState(
    String(currentMetrics.conversion_count),
  );

  const draft: CampaignMetrics = useMemo(
    () => ({
      sent_count: Math.max(0, Number(sent) || 0),
      open_count: Math.max(0, Number(open) || 0),
      click_count: Math.max(0, Number(click) || 0),
      conversion_count: Math.max(0, Number(conversion) || 0),
    }),
    [sent, open, click, conversion],
  );

  const rates = useMemo(() => computeRates(draft), [draft]);

  const validationWarning =
    draft.open_count > draft.sent_count
      ? "Les ouvertures ne peuvent pas dépasser les envois."
      : draft.click_count > draft.open_count
        ? "Les clics ne peuvent pas dépasser les ouvertures."
        : draft.conversion_count > draft.sent_count
          ? "Les conversions ne peuvent pas dépasser les envois."
          : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validationWarning) return;

    startTransition(async () => {
      setError(null);
      const result = await updateCampaignMetricsAction(campaignId, draft);
      if (!result.success) {
        setError(result.error ?? "Enregistrement impossible.");
        return;
      }
      onSuccess();
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-darktext">
        Mettre à jour les métriques
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricInput label="Envoyés" value={sent} onChange={setSent} />
        <MetricInput label="Ouverts" value={open} onChange={setOpen} />
        <MetricInput label="Cliqués" value={click} onChange={setClick} />
        <MetricInput
          label="Convertis"
          value={conversion}
          onChange={setConversion}
        />
      </div>

      {validationWarning ? (
        <p className="text-xs text-amber-700" role="alert">
          {validationWarning}
        </p>
      ) : null}

      <div className="space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-3 text-xs">
        <RatePreview label="Taux d'ouverture" rate={rates.open_rate} />
        <RatePreview label="Taux de clic" rate={rates.click_rate} />
        <RatePreview label="Taux de conversion" rate={rates.conversion_rate} />
      </div>

      {error ? (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || !!validationWarning}
        className="btn-primary w-full text-sm disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer les métriques"}
      </button>
    </form>
  );
}

function MetricInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-gray-600">
      {label}
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input mt-1 w-full"
      />
    </label>
  );
}

function RatePreview({ label, rate }: { label: string; rate: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-600">{label}</span>
      <span
        className="rounded-full px-2 py-0.5 font-semibold tabular-nums"
        style={{
          color: getRateColor(rate),
          backgroundColor: getRateBg(rate),
        }}
      >
        {formatRate(rate)}
      </span>
    </div>
  );
}

export const CampaignMetricsForm = memo(CampaignMetricsFormInner);
