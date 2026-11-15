/**
 * Assemble le site exporté (out/) en UNE seule page HTML autonome, pour un aperçu partageable :
 * toutes les pages deviennent des sections affichées selon l'ancre (#voitures, #v-<slug>…),
 * le CSS, les polices et les images sont intégrés, et un petit script remplace React.
 * Usage : npm run export && node scripts/build-artifact.mjs
 */
import fs from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
const DEST = path.resolve("artifact/index.html");

const read = (p) => fs.readFileSync(path.join(OUT, p), "utf8");
const mime = { ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".woff": "font/woff" };
/** Copie un fichier de out/ à côté de la page et renvoie son chemin relatif. */
const copy = (from, to) => { const d = path.join(path.dirname(DEST), to); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(path.join(OUT, from), d); return to; };
const asset = (p) => copy(p, p);
const dataUri = (p) => `data:${mime[path.extname(p)]};base64,${fs.readFileSync(path.join(OUT, p)).toString("base64")}`;

// 1. Les pages à intégrer : [fichier, ancre]
const routes = [["index.html", "accueil"]];
const dirs = (d) => fs.readdirSync(path.join(OUT, d), { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
const simple = { voitures: "voitures", "comment-acheter": "acheter", "verifiez-nous": "verifiez-nous", "trouvez-ma-voiture": "trouvez-ma-voiture", pays: "pays", guides: "guides", "a-propos": "a-propos", contact: "contact", faq: "faq", "conditions-de-vente": "conditions-de-vente", "mentions-legales": "mentions-legales" };
for (const [dir, id] of Object.entries(simple)) routes.push([`${dir}/index.html`, id]);
for (const s of dirs("voitures")) routes.push([`voitures/${s}/index.html`, `v-${s}`]);
for (const s of dirs("pays")) routes.push([`pays/${s}/index.html`, `pays-${s}`]);
for (const s of dirs("guides")) routes.push([`guides/${s}/index.html`, `g-${s}`]);

/** Traduit un lien interne du site en ancre. */
function anchorFor(href) {
  const clean = href.replace(/\/$/, "").replace(/^\//, "");
  if (clean === "") return "#accueil";
  const [a, b] = clean.split("/");
  if (!b) return `#${simple[a] ?? a}`;
  if (a === "voitures") return `#v-${b}`;
  if (a === "pays") return `#pays-${b}`;
  if (a === "guides") return `#g-${b}`;
  return "#accueil";
}

function between(html, start, end) {
  const i = html.indexOf(start);
  const j = html.indexOf(end, i);
  return html.slice(i, j + end.length);
}

function rewrite(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/href="(\/[^"#]*)"/g, (_, h) => `href="${anchorFor(h)}"`)
    .replace(/(src|href)="\/((?:images|brand)\/[^"]+)"/g, (_, attr, p) => `${attr}="${asset(p)}"`)
    .replace(/srcSet="[^"]*"/gi, "")
    .replace(/data-photo="\/(images\/[^"]+)"/g, (_, p) => `data-photo="${asset(p)}"`);
}

// 2. Sections
const sections = routes.map(([file, id]) => {
  const html = read(file);
  const main = between(html, '<main id="contenu">', "</main>").replace(/^<main id="contenu">/, "").replace(/<\/main>$/, "");
  const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "";
  return `<section data-route="${id}" data-title="${title.replace(/"/g, "&quot;")}" hidden>${rewrite(main)}</section>`;
});

// 3. En-tête (version claire, prise sur une page intérieure), pied de page, bouton WhatsApp
const inner = read("voitures/index.html");
const header = rewrite(between(inner, "<header", "</header>"));
const footer = rewrite(between(inner, "<footer", "</footer>"));
const floatBtn = rewrite((inner.match(/<a href="https:\/\/wa\.me[^>]*aria-label="Écrire à KBA sur WhatsApp"[\s\S]*?<\/a>/) || [""])[0]);

// 4. CSS avec les polices intégrées
const cssDir = path.join(OUT, "_next/static/css");
let css = fs.readdirSync(cssDir).map((f) => fs.readFileSync(path.join(cssDir, f), "utf8")).join("\n");
css = css.replace(/url\(\/_next\/static\/media\/([^)]+)\)/g, (_, f) => { copy(`_next/static/media/${f}`, `fonts/${f}`); return `url(fonts/${f})`; });

const mobileNav = routes
  .filter(([, id]) => ["accueil", "voitures", "acheter", "verifiez-nous", "trouvez-ma-voiture", "pays", "guides", "a-propos", "contact"].includes(id))
  .map(([, id]) => `<a href="#${id}" class="block border-b border-line py-3.5 text-[15px] font-medium text-ink">${{ accueil: "Accueil", voitures: "Voitures", acheter: "Comment acheter", "verifiez-nous": "Vérifiez-nous", "trouvez-ma-voiture": "Trouvez-la pour moi", pays: "Pays livrés", guides: "Guides", "a-propos": "À propos", contact: "Contact" }[id]}</a>`)
  .join("");

const js = fs.readFileSync(path.resolve("scripts/artifact-runtime.js"), "utf8");

const page = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Korea Business Auto · Voitures coréennes livrées en Afrique de l'Ouest</title>
<link rel="icon" href="${dataUri("icon.svg")}">
<style>${css}
section[data-route][hidden]{display:none!important}
#kba-mobile-nav{display:none}#kba-mobile-nav.open{display:block}
</style></head>
<body>
${header}
<div id="kba-mobile-nav" class="fixed inset-x-0 top-[72px] z-50 border-t border-line bg-white px-5 pb-4 lg:hidden">${mobileNav}</div>
<main id="contenu">${sections.join("\n")}</main>
${footer}
${floatBtn}
<script>${js}</script>
</body></html>`;

fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, page);
console.log(`OK ${DEST} · ${(page.length / 1024 / 1024).toFixed(2)} Mo · ${routes.length} pages`);
