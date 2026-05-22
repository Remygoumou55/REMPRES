"use client";

type CrmMutationFeedbackProps = {
  success?: string | null;
  error?: string | null;
};

export function CrmMutationFeedback({ success, error }: CrmMutationFeedbackProps) {
  if (!success && !error) return null;
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-sm ${
        error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"
      }`}
      role="status"
    >
      {error ?? success}
    </div>
  );
}
