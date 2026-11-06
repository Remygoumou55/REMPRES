// Fabrique les 9 vidéos de campagne (A, B, C × 3 accroches).
// Usage : node build.mjs A   (ou B, C) — rend les images, l'audio et assemble les 3 versions.
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

// Segments de la voix (secondes dans le fichier complet), mesurés sur les pauses.
const CFG = {
  A: { hooks: { h1: [[0, 3.05]], h2: [[3.47, 9.47]], h3: [[9.75, 13.22]] }, body: [13.42, 46.15], style: 'A', name: 'transitaire', scenes: [5.99, 12.08, 15.16, 18.21, 27.32], prix: 29.76 },
  B: { hooks: { h1: [[0.12, 2.73]], h2: [[0.12, 1.68], [3.12, 5.98]], h3: [[6.47, 10.19]] }, body: [10.72, 43.15], style: 'B', name: 'grossiste', scenes: [6.11, 13.35, 25.57, 29.25], prix: 29.25 },
  C: { hooks: { h1: [[0.10, 4.16]], h2: [[4.52, 10.05]], h3: [[10.42, 14.54]] }, body: [14.86, 55.95], style: 'C', name: 'debutant', scenes: [5.61, 12.37, 27.16, 38.07], prix: 38.07 },
};
const id = process.argv[2];
const cfg = CFG[id];
const OUT = join(DIR, 'out', id); mkdirSync(OUT, { recursive: true });
const voice = join(DIR, 'voix', `${id}-complet.mp3`);

// 1) Audio : extraits de voix
const cut = (segs, file) => {
  const parts = segs.map(([a, b], i) => `[0:a]atrim=${a}:${b},asetpts=PTS-STARTPTS[s${i}]`);
  const gaps = segs.length > 1 ? segs.slice(1).map((_, i) => `aevalsrc=0:d=0.30:s=44100[g${i}]`) : [];
  let chain = '';
  segs.forEach((_, i) => { chain += `[s${i}]` + (i < segs.length - 1 ? `[g${i}]` : ''); });
  const n = segs.length * 2 - 1;
  ff(['-i', voice, '-filter_complex', [...parts, ...gaps].join(';') + `;${chain}concat=n=${n}:v=0:a=1,aresample=44100,aformat=channel_layouts=stereo[o]`, '-map', '[o]', file]);
  return parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());
};
const bodyLen = cut([cfg.body], join(OUT, 'body.wav'));
const H = {};
for (const h of ['h1', 'h2', 'h3']) H[h] = cut(cfg.hooks[h], join(OUT, `${h}.wav`)) + PAUSE;

// 2) Images
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + join(DIR, `video${id}.html`), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
async function frames(name, hook, Hval, dur) {
  const dir = join(OUT, 'f_' + name); rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  await page.evaluate(([hook, Hval]) => { window.SETUP = { hook, H: Hval }; }, [hook, Hval]);
  const n = Math.round(dur * FPS);
  for (let i = 0; i < n; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(dir, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  ff(['-framerate', String(FPS), '-i', join(dir, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', join(OUT, `${name}.mp4`)]);
  rmSync(dir, { recursive: true, force: true });
}
await frames('body', 'none', 0, bodyLen + TAIL);
for (const h of ['h1', 'h2', 'h3']) await frames(h, h, 1e6, H[h]);
await browser.close();


// 4) Assemblage des 3 versions
for (const h of ['h1', 'h2', 'h3']) {
  const tot = H[h] + bodyLen + TAIL;
  const final = join(DIR, `${id}${h.slice(1)}-${cfg.name}.mp4`);
  execFileSync('python3', [join(DIR, 'music.py'), cfg.style, String(tot + 0.5), join(OUT, `music-${h}.wav`),
    String(H[h]), ...cfg.scenes.map((x) => String(H[h] + x)), '--prix', String(H[h] + cfg.prix)]);
  ff(['-i', join(OUT, `${h}.mp4`), '-i', join(OUT, 'body.mp4'), '-i', join(OUT, `${h}.wav`), '-i', join(OUT, 'body.wav'), '-i', join(OUT, `music-${h}.wav`),
    '-filter_complex',
    `[0:v][1:v]concat=n=2:v=1:a=0,format=yuv420p[v];` +
    `[2:a]apad=whole_dur=${H[h]}[ha];[ha][3:a]concat=n=2:v=0:a=1,apad=whole_dur=${tot}[voice0];` +
    `[voice0]asplit=2[voice][key];[4:a]atrim=0:${tot},volume=0.24[mus];` +
    `[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];` +
    `[voice][musd]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[a]`,
    '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-profile:v', 'high', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(tot), final]);
  console.log('✔', final.split('/').pop(), tot.toFixed(1) + ' s');
}
