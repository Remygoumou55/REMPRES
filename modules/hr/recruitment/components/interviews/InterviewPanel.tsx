"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { INTERVIEW_TYPES } from "@/modules/hr/recruitment/constants";
import type { RecruitmentInterview } from "@/modules/hr/recruitment/types";
import { scheduleInterviewAction, updateInterviewStatusAction } from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function InterviewPanel({ candidateId, interviews }: { candidateId: string; interviews: RecruitmentInterview[] }) {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [interviewType, setInterviewType] = useState<(typeof INTERVIEW_TYPES)[number]>("hr");
  const [scheduledAt, setScheduledAt] = useState("");
  const [locationNote, setLocationNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const refresh = () => router.refresh();

  return (
    <div className="space-y-3">
      <form
        className="grid gap-2 md:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          startTransition(async () => {
            const iso = scheduledAt ? new Date(scheduledAt).toISOString() : "";
            if (!iso || Number.isNaN(new Date(iso).getTime())) {
              setError(t("dashboard.rh.recruitment.interviews.invalidDate", "Date/heure invalides."));
              return;
            }
            const result = await scheduleInterviewAction({
              candidateId,
              interviewType,
              scheduledAt: iso,
              locationNote: locationNote.trim() || null,
            });
            if (!result.success) {
              setError(result.error);
              return;
            }
            setScheduledAt("");
            setLocationNote("");
            refresh();
          });
        }}
      >
        <select
          value={interviewType}
          onChange={(e) => setInterviewType(e.target.value as (typeof INTERVIEW_TYPES)[number])}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
        >
          {INTERVIEW_TYPES.map((x) => (
            <option key={x} value={x}>
              {x}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs md:col-span-2"
        />
        <input
          value={locationNote}
          onChange={(e) => setLocationNote(e.target.value)}
          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
          placeholder={t("dashboard.rh.recruitment.interviews.location", "Lieu / lien")}
        />
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-2 py-1 text-xs font-semibold text-white md:col-span-4">
          {t("dashboard.rh.recruitment.interviews.schedule", "Planifier entretien")}
        </button>
      </form>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <ul className="space-y-1">
        {interviews.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 px-2 py-1 text-[11px]">
            <span>
              {row.interviewType} · {new Date(row.scheduledAt).toLocaleString()} · {row.status}
            </span>
            {row.status === "scheduled" ? (
              <button
                type="button"
                disabled={pending}
                className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] text-white"
                onClick={() => {
                  startTransition(async () => {
                    await updateInterviewStatusAction({
                      interviewId: row.id,
                      candidateId,
                      status: "completed",
                    });
                    refresh();
                  });
                }}
              >
                {t("dashboard.rh.recruitment.interviews.complete", "Marquer realise")}
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
