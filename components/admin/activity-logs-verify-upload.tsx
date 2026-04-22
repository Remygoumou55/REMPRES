"use client";

import { useRef, useState } from "react";

type VerifyResult = {
  valid: boolean;
  reason?: string;
};

export function ActivityLogsVerifyUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleVerify() {
    const file = inputRef.current?.files?.[0];
    if (!file) return;

    setLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);

      const response = await fetch("/admin/activity-logs/verify-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const json: VerifyResult = await response.json();
      setResult(json);
    } catch {
      setResult({ valid: false, reason: "Impossible de lire ou envoyer le fichier." });
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setFileName(file?.name ?? null);
    setResult(null);
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="text-base font-semibold text-darktext">
        Vérifier l&apos;intégrité d&apos;un export JSON
      </h2>
      <p className="mt-1 text-xs text-darktext/70">
        Importez un fichier JSON signé exporté depuis ce journal pour confirmer qu&apos;il n&apos;a
        pas été modifié.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label
          htmlFor="json-upload"
          className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-darktext hover:bg-graylight"
        >
          {fileName ?? "Choisir un fichier JSON"}
        </label>
        <input
          ref={inputRef}
          id="json-upload"
          type="file"
          accept=".json,application/json"
          className="sr-only"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={!fileName || loading}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Vérification..." : "Vérifier l'intégrité"}
        </button>
      </div>

      {result !== null ? (
        <div
          className={`mt-4 rounded-md border px-4 py-3 text-sm font-medium ${
            result.valid
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {result.valid ? (
            <span>✅ Fichier authentique — intégrité confirmée.</span>
          ) : (
            <span>
              ❌ Fichier modifié ou corrompu.
              {result.reason ? (
                <span className="ml-1 font-normal opacity-80">({result.reason})</span>
              ) : null}
            </span>
          )}
        </div>
      ) : null}
    </div>
  );
}
