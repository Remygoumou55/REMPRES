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

const BOOK_TITLE = "Briser la peur d'importer";
// PHONE=1 : version téléphone (petites pages, une colonne, images allégées)
const PHONE = process.env.PHONE === '1';
const SUFFIX = PHONE ? '-telephone' : '';
const IMG_DIR = PHONE ? 'images-phone' : 'images-print'; // copies JPEG des images/ (fichiers PDF plus légers)

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
  17: 'Profil personnel et sécurité du compte',
  18: 'Famille 1 : carte bancaire liée à un compte',
  19: 'Famille 2 : carte prépayée',
  20: 'Famille 3 : carte virtuelle sur le téléphone',
  21: 'Famille 4 : portefeuilles en ligne',
  22: 'Famille 5 : virement bancaire international',
  23: 'Écran « Paiement refusé »',
  24: 'Le code de confirmation reçu par SMS',
  25: 'Les réglages de la carte dans l\'appli bancaire',
  26: 'Transitaire sérieux sur Facebook',
  27: 'Transitaire douteux sur Facebook',
  28: 'Transitaire sérieux sur TikTok',
  29: 'Transitaire douteux sur TikTok',
  30: 'Le lien de commande envoyé par le fournisseur',
  31: 'Un vrai carton avec son marquage',
  32: 'Le formulaire de demande de remboursement',
};

function captureHtml(n, variant = '') {
  const pad = String(n).padStart(2, '0');
  const label = CAPTURES[n] || '';
  const imgDir = join(ROOT, IMG_DIR);
  const file = ['png', 'jpg', 'jpeg', 'webp']
    .map((ext) => `capture-${pad}.${ext}`)
    .find((f) => existsSync(join(imgDir, f)));
  const inner = file
    ? `<img src="../${IMG_DIR}/${file}" alt="${label}">`
    : `<div class="placeholder"><b>${pad}</b>Capture d'écran<br>« ${label} »</div>`;
  const note = variant === 'sq' ? '' : " (données fictives ; l'interface réelle peut différer)";
  return `<figure class="capture ${variant}">${inner}<figcaption>Illustration ${pad} — ${label}${note}</figcaption></figure>`;
}

function addThead(html) {
  return html.replace(/(<table class="data[^"]*"[^>]*>\s*)(<tr>(?:(?!<\/tr>)[\s\S])*?<th[\s\S]*?<\/tr>)/g, '$1<thead>$2</thead>');
}

function expand(html) {
  html = addThead(html);
  return html.replace(/\{\{capture:(\d+)(?::(\w+))?\}\}/g, (_, n, v) => captureHtml(Number(n), v || ''));
}

function page(title, body) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="../styles/book.css">${PHONE ? '<link rel="stylesheet" href="../styles/phone.css">' : ''}</head><body>
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
    if (/ANNEXE/.test(txt) && !found.LX) found.LX = p;
    for (const m of txt.matchAll(/\[\[(BONUS|ANNEXE)-(\w+)\]\]/g)) if (!found[m[2]]) found[m[2]] = p;
  }
  return { found, n };
}

async function render(browser, name, title, body, withToc) {
  name = name + SUFFIX;
  const htmlPath = join(BUILD, `${name}.html`);
  const pdfPath = join(DIST, `${name}.pdf`);
  let html = page(title, expand(body));
  html = html.replace(/\.\.\/images\/([\w-]+)\.(webp|png|jpe?g)/g, `../${IMG_DIR}/$1.jpg`);
  if (PHONE) html = html.replaceAll('preserveAspectRatio="xMidYMid slice"', 'preserveAspectRatio="xMidYMid meet"');
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
await render(browser, 'Briser-la-peur-d-importer', BOOK_TITLE, readFragments(join(ROOT, 'src/book')), true);
for (const f of readdirSync(join(ROOT, 'src/bonus')).filter((f) => f.endsWith('.html')).sort()) {
  const body = readFileSync(join(ROOT, 'src/bonus', f), 'utf8');
  const title = /<!--\s*title:\s*(.*?)\s*-->/.exec(body)?.[1] ?? f;
  await render(browser, f.replace('.html', ''), title, body, false);
}
await browser.close();
