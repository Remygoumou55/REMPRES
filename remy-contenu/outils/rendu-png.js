// Convertit tous les SVG de 06-marque/ en PNG, avec Chromium (Playwright).
// Usage : node outils/rendu-png.js
// Le tampon garde un fond transparent (pour l'animer dans CapCut).
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const dossier = path.join(__dirname, '..', '06-marque');
const fichiers = [];
(function lister(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) lister(p);
    else if (p.endsWith('.svg')) fichiers.push(p);
  }
})(dossier);

(async () => {
  const navigateur = await chromium.launch();
  for (const f of fichiers) {
    const svg = fs.readFileSync(f, 'utf8');
    const [, l, h] = svg.match(/width="(\d+)" height="(\d+)"/);
    const page = await navigateur.newPage({ viewport: { width: +l, height: +h } });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    const sortie = f.replace(/\.svg$/, '.png');
    await page.locator('svg').screenshot({ path: sortie, omitBackground: true });
    console.log('png :', path.relative(path.join(__dirname, '..'), sortie));
    await page.close();
  }
  await navigateur.close();
})();
