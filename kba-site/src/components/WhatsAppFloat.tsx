import { waLink } from "@/lib/format";
import { WhatsAppGlyph } from "./icons";

export function WhatsAppFloat() {
  return (
    <a
      href={waLink("Bonjour KBA, j'ai une question.")}
      target="_blank"
      rel="noopener"
      aria-label="Écrire à KBA sur WhatsApp"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1A9E55] text-white shadow-[0_8px_24px_rgba(6,17,31,0.25)] transition-transform hover:scale-105"
    >
      <WhatsAppGlyph className="h-6 w-6" />
    </a>
  );
}
