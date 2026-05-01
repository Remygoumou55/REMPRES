"use client";

/**
 * Modal — primitif réutilisable pour TOUS les formulaires de saisie de l'ERP.
 *
 * Usage :
 *   <Modal open={open} onClose={() => setOpen(false)} title="Nouveau client" icon={<UserPlus />}>
 *     <form …>…</form>
 *   </Modal>
 *
 * Caractéristiques :
 *  - Overlay flouté (backdrop-blur-sm bg-black/50)
 *  - Carte centrée avec shadow-2xl + ring
 *  - Fermeture : bouton ✕, clic overlay, touche Échap
 *  - Scroll body bloqué pendant l'ouverture
 *  - Rendu via createPortal (z-index garanti)
 *  - Accessible : role="dialog" aria-modal aria-labelledby
 */

import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full";

const SIZE_CLASSES: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-xl",
  "2xl": "max-w-2xl",
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  full: "max-w-[min(1200px,calc(100vw-1rem))]",
};

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  /** Titre affiché dans l'en-tête */
  title: string;
  /** Sous-titre facultatif */
  subtitle?: string;
  /** Icône affichée à gauche du titre (élément JSX, ex : <UserPlus size={18} />) */
  icon?: React.ReactNode;
  /** Largeur de la carte. Défaut : "md" (448 px) */
  size?: ModalSize;
  /** Classes Tailwind pour le conteneur overlay (ex. padding réduit) */
  overlayClassName?: string;
  /** Classes Tailwind pour l'en-tête (padding, etc.) */
  headerClassName?: string;
  /** Classes Tailwind pour le corps (padding, overflow, hauteur max…) */
  bodyClassName?: string;
  /** Classes Tailwind pour la carte (hauteur max, flex…) */
  cardClassName?: string;
  /** Contenu du modal (formulaire, etc.) */
  children: React.ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  overlayClassName,
  headerClassName,
  bodyClassName,
  cardClassName,
  children,
}: ModalProps) {
  const titleId = useId();

  // Fermeture via Échap
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Verrouillage scroll body
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const modal = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className={`fixed inset-0 z-[300] flex items-center justify-center ${overlayClassName ?? "p-4"}`}
    >
      {/* Overlay flouté */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Carte */}
      <div
        className={`relative z-10 flex min-h-0 w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-black/5 ${SIZE_CLASSES[size]} ${cardClassName ?? ""}`}
      >
        {/* En-tête */}
        <div className={`flex shrink-0 items-center gap-3 border-b border-gray-100 px-6 py-5 ${headerClassName ?? ""}`}
        >
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h2
              id={titleId}
              className="text-base font-bold text-darktext leading-tight"
            >
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Corps — flex-1 pour laisser le pied (actions) visible quand max-h est appliqué */}
        <div
          className={`min-h-0 flex-1 overflow-y-auto px-6 py-5 ${bodyClassName ?? ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modal, document.body)
    : null;
}

// ---------------------------------------------------------------------------
// ModalField — label + input standardisé (DRY)
// ---------------------------------------------------------------------------

export function ModalField({
  label,
  required,
  htmlFor,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-xs font-medium text-gray-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModalInput — input stylisé uniforme
// ---------------------------------------------------------------------------

export function ModalInput(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return <Input {...props} />;
}

// ---------------------------------------------------------------------------
// ModalTextarea — textarea stylisé uniforme
// ---------------------------------------------------------------------------

export function ModalTextarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm",
        "outline-none transition resize-none",
        "focus:border-primary focus:ring-2 focus:ring-primary/15",
        "placeholder:text-gray-300",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

// ---------------------------------------------------------------------------
// ModalSelect — select stylisé uniforme
// ---------------------------------------------------------------------------

export function ModalSelect(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return <Select {...props} />;
}

// ---------------------------------------------------------------------------
// ModalError — bloc d'erreur standardisé
// ---------------------------------------------------------------------------

import { AlertCircle } from "lucide-react";

export function ModalError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
      <AlertCircle size={14} className="mt-0.5 shrink-0" />
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ModalActions — boutons en pied de modal (annuler + valider)
// ---------------------------------------------------------------------------

export function ModalActions({
  onCancel,
  submitLabel,
  loading,
  submitDisabled,
  submitIcon,
}: {
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
  submitDisabled?: boolean;
  submitIcon?: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 pt-2">
      <Button
        type="button"
        onClick={onCancel}
        variant="outline"
        className="flex-1 rounded-2xl py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
      >
        Annuler
      </Button>
      <Button
        type="submit"
        variant="primary"
        loading={loading}
        loadingText="Traitement en cours..."
        disabled={submitDisabled}
        className="flex-1 rounded-2xl py-3 text-sm font-bold text-white shadow-md shadow-primary/25 transition hover:bg-primary/90"
      >
        <>{submitIcon}{submitLabel}</>
      </Button>
    </div>
  );
}
