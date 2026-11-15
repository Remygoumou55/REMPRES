import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { CtaBand } from "@/components/CtaBand";
import { getGuide, guides } from "@/data/guides";

export function generateStaticParams() {
  return guides.map((g) => ({ slug: g.slug }));
}
export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const g = getGuide(params.slug);
  return g ? { title: g.title, description: g.excerpt, openGraph: { type: "article" } } : {};
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const g = getGuide(params.slug);
  if (!g) notFound();
  return (
    <>
      <article className="pb-20 pt-32 md:pt-40">
        <div className="container max-w-3xl">
          <Link href="/guides" className="inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Tous les guides
          </Link>
          <p className="eyebrow mt-8">{g.category}{g.country ? ` · ${g.country}` : ""}</p>
          <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-[1.05] tracking-tight text-ink md:text-5xl">{g.title}</h1>
          <p className="mt-5 font-mono text-[11px] uppercase tracking-label text-muted">
            Mis à jour le {new Date(g.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · {g.readingMinutes} min de lecture
          </p>
          <div className="prose-kba mt-10 border-t border-line pt-4">
            {g.body.map((b, i) =>
              b.type === "h2" ? <h2 key={i}>{b.text}</h2> : b.type === "p" ? <p key={i}>{b.text}</p> : b.type === "ul" ? <ul key={i}>{b.items.map((x) => <li key={x}>{x}</li>)}</ul> : <ol key={i}>{b.items.map((x) => <li key={x}>{x}</li>)}</ol>,
            )}
          </div>
        </div>
      </article>
      <CtaBand />
    </>
  );
}
