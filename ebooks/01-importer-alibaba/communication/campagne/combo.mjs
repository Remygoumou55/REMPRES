// Vidéos combinées : 2 accroches enchaînées + corps. Réutilise les rendus de build.mjs (dossier out/).
// Usage : node combo.mjs A h3 h2   |   node combo.mjs B h1 h4   |   node combo.mjs C h1 h3
import { mkdirSync, rmSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30, PAUSE = 0.35, TAIL = 1.5;
const ff = (a) => execFileSync('ffmpeg', ['-v', 'error', '-y', ...a]);
const dur = (f) => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const META = { A: { name: 'transitaire', style: 'A', scenes: [4.48, 9.89, 15.4, 19.37, 28.48], prix: 30.92 },
  B: { name: 'grossiste', style: 'B', scenes: [6.11, 13.35, 25.57, 29.25], prix: 29.25 },
  C: { name: 'debutant', style: 'C', scenes: [5.61, 12.37, 27.16, 38.07], prix: 38.07 } };
const EXTRA = { B: { h4: [3.12, 5.98] } };   // parties d'accroche supplémentaires à rendre
const [id, ...hooks] = process.argv.slice(2);
const OUT = join(DIR, 'out', id);
for (const h of hooks) {
  if (existsSync(join(OUT, `${h}.mp4`))) continue;
  const [a, b] = EXTRA[id][h];
  ff(['-i', join(DIR, 'voix', `${id}-complet.mp3`), '-af', `atrim=${a}:${b},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo`, join(OUT, `${h}.wav`)]);
  const Hh = dur(join(OUT, `${h}.wav`)) + PAUSE;
  const browser = await chromium.launch(); const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + join(DIR, `video${id}.html`), { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready);
  await page.evaluate((h) => { window.SETUP = { hook: h, H: 1e6 }; }, h);
  const fd = join(OUT, 'f_' + h); rmSync(fd, { recursive: true, force: true }); mkdirSync(fd, { recursive: true });
  for (let i = 0; i < Math.round(Hh * FPS); i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(fd, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  await browser.close();
  ff(['-framerate', String(FPS), '-i', join(fd, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', join(OUT, `${h}.mp4`)]);
  rmSync(fd, { recursive: true, force: true });
}
// Durées réelles des accroches (image) pour caler l'audio dessus
const Hs = hooks.map((h) => dur(join(OUT, `${h}.mp4`)));
const Htot = Hs.reduce((a, b) => a + b, 0);
const bodyLen = dur(join(OUT, 'body.wav'));
const tot = Htot + bodyLen + TAIL;
const m = META[id];
execFileSync('python3', [join(DIR, 'music.py'), m.style, String(tot + 0.5), join(OUT, 'music-combo.wav'),
  String(Hs[0]), String(Htot), ...m.scenes.map((x) => String(Htot + x)), '--prix', String(Htot + m.prix)]);
const ins = []; hooks.forEach((h) => ins.push('-i', join(OUT, `${h}.mp4`)));
ins.push('-i', join(OUT, 'body.mp4'));
hooks.forEach((h) => ins.push('-i', join(OUT, `${h}.wav`)));
ins.push('-i', join(OUT, 'body.wav'), '-i', join(OUT, 'music-combo.wav'));
const n = hooks.length;
const vin = [...Array(n + 1).keys()].map((i) => `[${i}:v]`).join('');
const apads = hooks.map((_, i) => `[${n + 1 + i}:a]apad=whole_dur=${Hs[i]}[ha${i}]`).join(';');
const ain = hooks.map((_, i) => `[ha${i}]`).join('') + `[${2 * n + 1}:a]`;
const final = join(DIR, `${id}-COMBINEE-${m.name}.mp4`);
ff([...ins, '-filter_complex',
  `${vin}concat=n=${n + 1}:v=1:a=0,format=yuv420p[v];${apads};${ain}concat=n=${n + 1}:v=0:a=1,apad=whole_dur=${tot}[voice0];` +
  `[voice0]asplit=2[voice][key];[${2 * n + 2}:a]atrim=0:${tot},volume=0.17[mus];` +
  `[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];` +
  `[voice][musd]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-profile:v', 'high', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(tot), final]);
console.log('✔', final.split('/').pop(), tot.toFixed(1) + ' s');
