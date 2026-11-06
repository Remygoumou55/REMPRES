// Rend les séquences de motion design image par image (30 i/s, 1080x1920),
// puis les encode en MP4. Usage : node render-motion.mjs
import { mkdirSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const ALL = { M1: 4.21, M2: 7.15, M3: 10.86, M4: 7.27 };
const only = process.argv.slice(2);
const SCENES = only.length ? Object.fromEntries(only.map((k) => [k, ALL[k]])) : ALL;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + join(DIR, 'motion.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const [id, dur] of Object.entries(SCENES)) {
  const out = join(DIR, 'frames', id);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  await page.evaluate((id) => {
    document.querySelectorAll('.scene').forEach((s) => s.classList.toggle('on', s.id === id));
  }, id);
  await page.waitForTimeout(300);
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    const t = (i / FPS) * 1000;
    await page.evaluate((t) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = t; }), t);
    await page.screenshot({ path: join(out, `f${String(i).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 92 });
  }
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', join(out, 'f%04d.jpg'),
    '-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-c:a', 'aac', '-shortest', join(DIR, `${id}.mp4`)]);
  console.log(`✔ ${id}.mp4 (${n} images)`);
}
await browser.close();
