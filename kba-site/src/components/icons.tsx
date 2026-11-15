/** Pictogramme « bulle de discussion » pour les boutons WhatsApp (dessin simple, non officiel). */
export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z" />
      <path d="M9 9.2c.2 1.9 1.9 3.9 4 4.7l1.2-1.1 1.8.8-.4 1.6c-3.6.2-7-3.3-7-6.9l1.6-.4.8 1.8z" fill="currentColor" stroke="none" />
    </svg>
  );
}
