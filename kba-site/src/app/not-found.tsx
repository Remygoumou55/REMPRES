import Link from "next/link";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-paper pt-[72px]">
      <div className="container">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="h-display mt-4 text-5xl text-ink md:text-7xl">Cette page<br /><span className="text-blue-600">n'existe pas.</span></h1>
        <p className="mt-5 max-w-lg text-[16px] text-muted">La voiture a peut-être été vendue, ou le lien est incorrect.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/voitures" className="btn-primary">Voir les voitures</Link>
          <Link href="/" className="btn-outline">Accueil</Link>
        </div>
      </div>
    </section>
  );
}
