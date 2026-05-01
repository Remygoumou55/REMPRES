"use client";

import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FEEDBACK_MESSAGES } from "@/lib/messages";

type ToastKind = "success" | "error";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

type ToastContextValue = {
  showSuccess: (message?: string) => void;
  showError: (message?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_SUCCESS = FEEDBACK_MESSAGES.OPERATION_SUCCESS;
const DEFAULT_ERROR = FEEDBACK_MESSAGES.OPERATION_FAILED;
const TOAST_LIFETIME_MS = 3200;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seqRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++seqRef.current;
    setToasts((prev) => [...prev, { id, kind, message }]);
    window.setTimeout(() => {
      dismiss(id);
    }, TOAST_LIFETIME_MS);
  }, [dismiss]);

  const value = useMemo<ToastContextValue>(() => ({
    showSuccess: (message = DEFAULT_SUCCESS) => push("success", message),
    showError: (message = DEFAULT_ERROR) => push("error", message),
  }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[800] flex w-[min(92vw,380px)] flex-col gap-2">
        {toasts.map((toast) => {
          const success = toast.kind === "success";
          return (
            <div
              key={toast.id}
              role="status"
              aria-live="polite"
              className={`pointer-events-auto flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm shadow-lg ${
                success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {success ? (
                <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
              )}
              <p className="min-w-0 flex-1 leading-5">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="rounded-md p-0.5 opacity-70 transition hover:bg-black/5 hover:opacity-100"
                aria-label="Fermer la notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
