// Vidéo 3 v2 : rend le motion design (M1–M4) et la couche de textes (sous-titres + titres)
// Usage : node render.mjs [M1 M2 M3 M4 OVERLAY]
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const TOTAL = 51.5;
const MOTION = { M1: 4.23, M2: 7.52, M3: 10.47, M4: 7.27 };
const want = process.argv.slice(2);
const todo = want.length ? want : [...Object.keys(MOTION), 'OVERLAY'];
const ff = (args) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...args]);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

for (const id of todo.filter((k) => MOTION[k])) {
  await page.goto('file://' + join(DIR, 'motion.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = join(DIR, 'frames', id); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  await page.evaluate((id) => document.querySelectorAll('.scene').forEach((s) => s.classList.toggle('on', s.id === id)), id);
  await page.waitForTimeout(300);
  const n = Math.round(MOTION[id] * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), (i / FPS) * 1000);
    await page.screenshot({ path: join(out, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 93 });
  }
  ff(['-framerate', String(FPS), '-i', join(out, 'f%04d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-r', String(FPS), join(DIR, `${id}.mp4`)]);
  console.log(`✔ ${id}.mp4`);
}

if (todo.includes('OVERLAY')) {
  await page.goto('file://' + join(DIR, 'overlay.html'), { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const out = join(DIR, 'frames', 'OVERLAY'); rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const n = Math.round(TOTAL * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(out, `o${String(i).padStart(4, '0')}.png`), omitBackground: true });
  }
  ff(['-framerate', String(FPS), '-i', join(out, 'o%04d.png'), '-c:v', 'qtrle', join(DIR, 'overlay.mov')]);
  console.log('✔ overlay.mov');
}
await browser.close();
