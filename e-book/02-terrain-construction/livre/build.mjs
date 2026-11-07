// Génère le PDF du livre 2 (terrain et construction) et ses kits.
// Usage : node e-book/02-terrain-construction/livre/build.mjs        (version A4)
//         PHONE=1 node e-book/02-terrain-construction/livre/build.mjs (version téléphone)
// Même chaîne que le livre 1 : fragments HTML (src/book, src/bonus) -> Chromium (Playwright) -> PDF.
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
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

const BOOK_TITLE = 'Acheter un terrain et construire au pays';
const FILE = process.env.OUT || 'Terrain-et-construction';
const PHONE = process.env.PHONE === '1';
const SUFFIX = PHONE ? '-telephone' : '';

function addThead(html) {
  return html.replace(/(<table class="data[^"]*"[^>]*>\s*)(<tr>(?:(?!<\/tr>)[\s\S])*?<th[\s\S]*?<\/tr>)/g, '$1<thead>$2</thead>');
}

function page(title, body) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<link rel="stylesheet" href="../styles/book.css"><link rel="stylesheet" href="../styles/terrain.css">${PHONE ? '<link rel="stylesheet" href="../styles/phone.css">' : ''}</head><body>
<span class="booktitle-marker">${title}</span>
${body}</body></html>`;
}

const readFragments = (dir) => readdirSync(dir).filter((f) => f.endsWith('.html')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

function tocPages(pdfPath) {
  const n = Number(/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPath]).toString())[1]);
  const found = {};
  for (let p = 1; p <= n; p++) {
    const txt = execFileSync('pdftotext', ['-f', String(p), '-l', String(p), '-layout', pdfPath, '-']).toString();
    for (const m of txt.matchAll(/CHAPITRE (\d\d)/g)) if (!found[m[1]]) found[m[1]] = p;
    if (/ANNEXE/.test(txt) && !found.LX) found.LX = p;
  }
  return found;
}

async function render(browser, name, title, body, withToc) {
  name += SUFFIX;
  const htmlPath = join(BUILD, `${name}.html`);
  const pdfPath = join(DIST, `${name}.pdf`);
  let html = page(title, addThead(body));
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
    const found = tocPages(pdfPath);
    html = html.replace(/<span class="p" data-ch="(\w+)"><\/span>/g, (_, k) => `<span class="p" data-ch="${k}">${found[k] ?? ''}</span>`);
    await go(html);
  }
  const pages = /Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [pdfPath]).toString())[1];
  console.log(`✔ ${name}.pdf — ${pages} pages`);
  await ctx.close();
}

const browser = await chromium.launch();
await render(browser, FILE, BOOK_TITLE, readFragments(join(ROOT, 'src/book')), true);
for (const f of readdirSync(join(ROOT, 'src/bonus')).filter((f) => f.endsWith('.html')).sort()) {
  const body = readFileSync(join(ROOT, 'src/bonus', f), 'utf8');
  const title = /<!--\s*title:\s*(.*?)\s*-->/.exec(body)?.[1] ?? f;
  await render(browser, f.replace('.html', ''), title, body, false);
}
await browser.close();
