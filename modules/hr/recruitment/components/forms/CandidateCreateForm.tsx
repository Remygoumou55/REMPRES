"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { SOURCE_CHANNELS } from "@/modules/hr/recruitment/constants";
import { createCandidateAction } from "@/modules/hr/recruitment/server/actions/recruitment-actions";

export function CandidateCreateForm() {
  const router = useRouter();
  const { t } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentKey, setDepartmentKey] = useState("");
  const [sourceChannel, setSourceChannel] = useState<(typeof SOURCE_CHANNELS)[number]>("direct");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-2 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await createCandidateAction({
            fullName,
            email,
            phone: phone || null,
            jobTitle,
            departmentKey: departmentKey.trim() || null,
            sourceChannel,
            notes: notes.trim() || null,
          });
          if (!result.success) {
            setError(result.error);
            return;
          }
          setFullName("");
          setEmail("");
          setPhone("");
          setJobTitle("");
          setDepartmentKey("");
          setNotes("");
          router.refresh();
        });
      }}
    >
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.recruitment.form.fullName", "Nom complet")}
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.recruitment.form.email", "Email")}
        required
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.recruitment.form.phone", "Telephone")}
      />
      <input
        value={jobTitle}
        onChange={(e) => setJobTitle(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.recruitment.form.jobTitle", "Intitule du poste")}
        required
      />
      <input
        value={departmentKey}
        onChange={(e) => setDepartmentKey(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
        placeholder={t("dashboard.rh.recruitment.form.department", "Departement (cle)")}
      />
      <select
        value={sourceChannel}
        onChange={(e) => setSourceChannel(e.target.value as (typeof SOURCE_CHANNELS)[number])}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
      >
        {SOURCE_CHANNELS.map((ch) => (
          <option key={ch} value={ch}>
            {ch}
          </option>
        ))}
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm md:col-span-2"
        rows={2}
        placeholder={t("dashboard.rh.recruitment.form.notes", "Notes")}
      />
      <button type="submit" disabled={pending} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white md:col-span-2">
        {pending ? t("dashboard.rh.recruitment.form.pending", "Enregistrement...") : t("dashboard.rh.recruitment.form.submit", "Creer candidat")}
      </button>
      {error ? <p className="text-xs text-red-600 md:col-span-2">{error}</p> : null}
    </form>
  );
}
