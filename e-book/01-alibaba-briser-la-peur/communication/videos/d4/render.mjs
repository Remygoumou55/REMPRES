// D4 (motion design) : node render.mjs preview 1.0 4.2 …   |   node render.mjs  (vidéo complète)
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30, DUR = 37.2;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + join(DIR, 'index.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
if (process.argv[2] === 'preview') {
  mkdirSync(join(DIR, 'pv'), { recursive: true });
  for (const t of process.argv.slice(3)) {
    await page.evaluate((t) => window.render(t), parseFloat(t));
    await page.screenshot({ path: join(DIR, 'pv', `p-${t}.jpg`), type: 'jpeg', quality: 70 });
  }
  await browser.close(); process.exit(0);
}
const OUT = join(DIR, 'frames'); rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT);
const n = Math.round(DUR * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.render(t), i / FPS);
  await page.screenshot({ path: join(OUT, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
  if (i % 150 === 0) console.log(i, '/', n);
}
await browser.close();
execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(OUT, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', join(DIR, 'video-muette.mp4')]);
rmSync(OUT, { recursive: true, force: true });
console.log('ok');
