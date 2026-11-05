// Génère les PDF de l'e-book et des kits bonus.
// Usage : node ebooks/01-importer-alibaba/build.mjs
// Les captures d'écran se placent dans images/capture-01.png ... capture-16.png
// (jpg/jpeg/webp acceptés). Tant qu'une image manque, un cadre numéroté la remplace.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const ROOT = dirname(fileURLToPath(import.meta.url));
const BUILD = join(ROOT, 'build');
const DIST = join(ROOT, 'dist');
mkdirSync(BUILD, { recursive: true });
mkdirSync(DIST, { recursive: true });

const BOOK_TITLE = 'Importer de Chine sans se faire arnaquer';

const CAPTURES = {
  1: "Page d'accueil de l'application",
  2: 'Écran de connexion / inscription',
  3: 'Paramètres : pays, devise, langue',
  4: 'Profil acheteur et informations entreprise',
  5: 'Résultats de recherche et filtres',
  6: 'Recherche par image',
  7: 'Fiche produit et prix par paliers',
  8: 'Profil du fournisseur et ses badges',
  9: 'Messagerie avec traduction automatique',
  10: 'Paramètres de traduction',
  11: 'Le panier',
  12: 'Commande et frise des 5 étapes',
  13: 'Page de paiement sécurisé',
  14: 'Confirmation de paiement',
  15: 'Mon Alibaba : mes commandes',
  16: 'Registre de paiement : remboursement',
};

function captureHtml(n) {
  const pad = String(n).padStart(2, '0');
  const label = CAPTURES[n] || '';
  const imgDir = join(ROOT, 'images');
  const file = ['png', 'jpg', 'jpeg', 'webp']
    .map((ext) => `capture-${pad}.${ext}`)
    .find((f) => existsSync(join(imgDir, f)));
  const inner = file
    ? `<img src="../images/${file}" alt="${label}">`
    : `<div class="placeholder"><b>${pad}</b>Capture d'écran<br>« ${label} »</div>`;
  return `<figure class="capture">${inner}<figcaption>Illustration ${pad} — ${label} (données fictives ; l'interface réelle peut différer selon la version de l'application)</figcaption></figure>`;
}

function expand(html) {
  return html.replace(/\{\{capture:(\d+)\}\}/g, (_, n) => captureHtml(Number(n)));
}

function page(title, body) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="../styles/book.css"></head><body>
<span class="booktitle-marker">${title}</span>
${body}</body></html>`;
}

function readFragments(dir) {
  return readdirSync(dir)
    .filter((f) => f.endsWith('.html'))
    .sort()
    .map((f) => readFileSync(join(dir, f), 'utf8'))
    .join('\n');
}

// Remplit les numéros de page du sommaire en lisant le PDF (repère : "CHAPITRE NN").
function tocPages(pdfPath) {
  const n = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPath]).toString())[1]);
  const found = {};
  for (let p = 1; p <= n; p++) {
    const txt = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-']).toString();
    for (const m of txt.matchAll(/CHAPITRE (\d\d)/g)) if (!found[m[1]]) found[m[1]] = p;
    for (const m of txt.matchAll(/\[\[(BONUS|ANNEXE)-(\w+)\]\]/g)) if (!found[m[2]]) found[m[2]] = p;
  }
  return { found, n };
}

async function render(browser, name, title, body, withToc) {
  const htmlPath = join(BUILD, `${name}.html`);
  const pdfPath = join(DIST, `${name}.pdf`);
  let html = page(title, expand(body));
  const ctx = await browser.newContext();
  const pg = await ctx.newPage();
  const go = async (h) => {
    writeFileSync(htmlPath, h);
    await pg.goto('file://' + htmlPath, { waitUntil: 'networkidle' });
    await pg.evaluate(() => document.fonts.ready);
    await pg.pdf({ path: pdfPath, preferCSSPageSize: true, printBackground: true });
  };
  await go(html);
  if (withToc) {
    const { found } = tocPages(pdfPath);
    html = html.replace(/<span class="p" data-ch="(\w+)"><\/span>/g, (_, k) => `<span class="p" data-ch="${k}">${found[k] ?? ''}</span>`);
    await go(html);
  }
  const pages = /Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPath]).toString())[1];
  console.log(`✔ ${name}.pdf — ${pages} pages`);
  await ctx.close();
}

const browser = await chromium.launch();
await render(browser, 'Importer-de-Chine-sans-se-faire-arnaquer', BOOK_TITLE, readFragments(join(ROOT, 'src/book')), true);
for (const f of readdirSync(join(ROOT, 'src/bonus')).filter((f) => f.endsWith('.html')).sort()) {
  const body = readFileSync(join(ROOT, 'src/bonus', f), 'utf8');
  const title = /<!--\s*title:\s*(.*?)\s*-->/.exec(body)?.[1] ?? f;
  await render(browser, f.replace('.html', ''), title, body, false);
}
await browser.close();
