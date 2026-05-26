"use client";

import { memo, useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImageIcon, Upload, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { updateProductImageAction } from "@/app/(app)/vente/produits/actions";

type Props = {
  /** URL actuellement stockée en base (initialValues.image_url). */
  currentImageUrl?: string | null;
  /**
   * Identifiant produit, requis pour persister l'URL immédiatement après upload.
   * Si absent, le composant est rendu en mode désactivé (création initiale).
   */
  productId?: string | null;
  /** Callback : URL publique (ou null après suppression). Le formulaire met à jour son hidden input. */
  onChange: (newUrl: string | null) => void;
  /** Force le mode désactivé même si productId est fourni. */
  disabled?: boolean;
  /** Message affiché en mode désactivé (création produit). */
  disabledHint?: string;
};

const MAX_BYTES = 2 * 1024 * 1024; // 2 Mo
const ACCEPTED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && fromName.length > 0 && fromName.length <= 5) return fromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export const ProductImageUpload = memo(function ProductImageUpload({
  currentImageUrl,
  productId,
  onChange,
  disabled = false,
  disabledHint = "Vous pourrez ajouter une image après la création du produit.",
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreview(currentImageUrl ?? null);
  }, [currentImageUrl]);

  const isDisabled = disabled || !productId;

  const handleFile = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!productId) {
        setError("Enregistrez d'abord le produit pour pouvoir ajouter une image.");
        return;
      }
      if (file.size > MAX_BYTES) {
        setError("Image trop lourde (max 2 Mo).");
        return;
      }
      if (!ACCEPTED_MIME.includes(file.type) && !file.type.startsWith("image/")) {
        setError("Format non supporté (JPG, PNG, WebP).");
        return;
      }

      setError(null);
      setUploading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const path = `${productId}/${Date.now()}.${extensionFor(file)}`;
        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(path, file, {
            contentType: file.type || "image/jpeg",
            upsert: true,
            cacheControl: "3600",
          });
        if (uploadError) {
          throw uploadError;
        }
        const { data: publicUrlData } = supabase.storage.from("products").getPublicUrl(path);
        const publicUrl = publicUrlData.publicUrl;

        // Persiste immédiatement côté base — ainsi l'image survit même si l'utilisateur ferme la modale.
        startTransition(() => {
          void updateProductImageAction(productId, publicUrl).then((result) => {
            if (!result.success) {
              setError(result.error ?? "Erreur lors de l'enregistrement de l'image.");
            }
          });
        });

        setPreview(publicUrl);
        onChange(publicUrl);
      } catch (err) {
        console.error("[ProductImageUpload] upload failed", err);
        setError("Erreur lors de l'upload. Réessayez.");
      } finally {
        setUploading(false);
        if (inputRef.current) {
          inputRef.current.value = "";
        }
      }
    },
    [productId, onChange],
  );

  const handleRemove = useCallback(() => {
    if (!productId) {
      setPreview(null);
      onChange(null);
      return;
    }
    setError(null);
    setUploading(true);
    startTransition(() => {
      void updateProductImageAction(productId, null)
        .then((result) => {
          if (!result.success) {
            setError(result.error ?? "Erreur lors de la suppression de l'image.");
            return;
          }
          setPreview(null);
          onChange(null);
        })
        .finally(() => setUploading(false));
    });
  }, [productId, onChange]);

  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
        Image du produit
        <span className="ml-2 normal-case text-[10px] font-normal text-gray-400">
          (optionnel · JPG, PNG, WebP · max 2 Mo)
        </span>
      </p>

      {preview ? (
        <div className="relative inline-flex h-28 w-28 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
          <Image
            src={preview}
            alt="Image produit"
            fill
            unoptimized
            sizes="112px"
            style={{ objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            aria-label="Supprimer l'image"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isDisabled || uploading}
          className={`flex h-28 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed text-[11px] transition ${
            isDisabled
              ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
              : uploading
              ? "cursor-wait border-gray-200 bg-gray-50 text-gray-400"
              : "cursor-pointer border-gray-300 bg-white text-gray-500 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
          }`}
        >
          {uploading ? (
            <span>Upload…</span>
          ) : (
            <>
              <ImageIcon size={20} className="opacity-70" />
              <span>{isDisabled ? "Image indisponible" : "Ajouter une photo"}</span>
              {!isDisabled ? <Upload size={11} className="opacity-50" /> : null}
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
      />

      {isDisabled ? (
        <p className="mt-2 max-w-[180px] text-[11px] leading-snug text-gray-400">{disabledHint}</p>
      ) : null}

      {error ? <p className="mt-2 text-[11px] font-medium text-red-600">{error}</p> : null}
    </div>
  );
});
