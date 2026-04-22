type FlashMessageProps = {
  success?: string;
  error?: string;
};

export function FlashMessage({ success, error }: FlashMessageProps) {
  const message = error ?? success;
  if (!message) return null;

  const isError = Boolean(error);
  const classes = isError
    ? "border-danger/30 bg-danger/10 text-danger"
    : "border-success/30 bg-success/10 text-success";

  return (
    <div className={`rounded-md border px-4 py-3 text-sm ${classes}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
