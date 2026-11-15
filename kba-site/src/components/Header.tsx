"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { nav, site } from "@/data/site";
import { waLink } from "@/lib/format";
import { WhatsAppGlyph } from "./icons";

/** En-tête : transparent sur le haut de l'accueil (fond bleu nuit), blanc ailleurs. */
export function Header() {
  const path = usePathname();
  const onHome = path === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 24);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => setOpen(false), [path]);
  const dark = onHome && !scrolled && !open;

  return (
    <header className={clsx("fixed inset-x-0 top-0 z-50 transition-colors duration-200", dark ? "bg-transparent" : "border-b border-line bg-white/95 backdrop-blur")}>
      <div className="container flex h-[72px] items-center justify-between gap-6">
        <Logo variant={dark ? "dark" : "light"} />
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "text-[13px] font-medium transition-colors",
                dark ? "text-white/75 hover:text-white" : "text-muted hover:text-ink",
                path.startsWith(n.href) && (dark ? "text-white" : "text-ink"),
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a href={waLink("Bonjour KBA, je voudrais des informations sur vos voitures.")} target="_blank" rel="noopener" className="btn-whatsapp hidden px-4 py-2.5 sm:inline-flex">
            <WhatsAppGlyph className="h-4 w-4" /> WhatsApp
          </a>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={clsx("inline-flex h-10 w-10 items-center justify-center rounded-md lg:hidden", dark ? "text-white" : "text-ink")}
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-line bg-white lg:hidden">
          <nav className="container flex flex-col py-3" aria-label="Navigation mobile">
            {[{ href: "/", label: "Accueil" }, ...nav, { href: "/a-propos", label: "À propos" }, { href: "/contact", label: "Contact" }].map((n) => (
              <Link key={n.href} href={n.href} className="border-b border-line py-3.5 text-[15px] font-medium text-ink last:border-0">
                {n.label}
              </Link>
            ))}
            <a href={waLink("Bonjour KBA, je voudrais des informations.")} className="btn-whatsapp mt-3 w-full">
              <WhatsAppGlyph className="h-4 w-4" /> Écrire sur WhatsApp · {site.phoneDisplay}
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
