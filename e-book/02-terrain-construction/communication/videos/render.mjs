// Fabrique la vidéo N (1..6) : images (Playwright) + voix + musique originale.
// Usage : node render.mjs N        (aperçu : node render.mjs N preview 3.5 8 15 …  -> images PNG à ces secondes)
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30, TAIL = 1.6;
const N = process.argv[2];
const ff = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);
execFileSync('python3', [join(DIR, 'gen.py'), N]);
const meta = JSON.parse(readFileSync(join(DIR, `meta${N}.json`)));
const NAMES = { 1: 'diaspora-photos', 2: 'diaspora-famille', 3: 'double-vente', 4: 'papier-quartier', 5: 'avance-macon', 6: 'dix-minutes' };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + join(DIR, `video${N}.html`), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => { window.SETUP = { hook: 'none', H: 0 }; });
if (process.argv[3] === 'preview') {
  mkdirSync(join(DIR, 'preview'), { recursive: true });
  for (const t of process.argv.slice(4)) {
    await page.evaluate((t) => window.render(t), parseFloat(t));
    await page.screenshot({ path: join(DIR, 'preview', `v${N}-${t}.jpg`), type: 'jpeg', quality: 70 });
  }
  await browser.close(); process.exit(0);
}
const OUT = join(DIR, 'out', N); rmSync(OUT, { recursive: true, force: true }); mkdirSync(join(OUT, 'f'), { recursive: true });
const tot = meta.dur + TAIL;
const n = Math.round(tot * FPS);
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => window.render(t), i / FPS);
  await page.screenshot({ path: join(OUT, 'f', `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 88 });
}
await browser.close();
ff(['-framerate', String(FPS), '-i', join(OUT, 'f', 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', join(OUT, 'v.mp4')]);
rmSync(join(OUT, 'f'), { recursive: true, force: true });
const style = ['1', '3', '5'].includes(N) ? 'A' : 'C';
execFileSync('python3', [join(DIR, 'music.py'), style, String(tot + 0.5), join(OUT, 'm.wav'), ...meta.trans.map(String), '--prix', String(meta.prix)]);
const final = join(DIR, `V${N}-${NAMES[N]}.mp4`);
ff(['-i', join(OUT, 'v.mp4'), '-i', join(DIR, 'voix', `T${N}.mp3`), '-i', join(OUT, 'm.wav'),
  '-filter_complex',
  `[1:a]aresample=44100,aformat=channel_layouts=stereo,apad=whole_dur=${tot}[voice0];[voice0]asplit=2[voice][key];` +
  `[2:a]atrim=0:${tot},volume=0.17[mus];[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];` +
  `[voice][musd]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[a]`,
  '-map', '0:v', '-map', '[a]', '-c:v', 'libx264', '-crf', '20', '-preset', 'medium', '-profile:v', 'high', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(tot), final]);
rmSync(OUT, { recursive: true, force: true });
console.log('✔', final.split('/').pop(), tot.toFixed(1) + ' s');
