// Vidéo B combinée, version personnages animés (Kouamé = grossiste, Moussa = acheteur).
import { mkdirSync, rmSync } from 'node:fs';
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
const OUT = join(DIR, 'out', 'B2'); mkdirSync(OUT, { recursive: true });
const voice = join(DIR, 'voix', 'B-complet.mp3');
const SEG = { h1: [0.12, 2.73], h4: [3.12, 5.98], body: [10.72, 43.15] };
for (const [k, [a, b]] of Object.entries(SEG))
  ff(['-i', voice, '-af', `atrim=${a}:${b},asetpts=PTS-STARTPTS,aresample=44100,aformat=channel_layouts=stereo`, join(OUT, `${k}.wav`)]);
const len = { h1: dur(join(OUT, 'h1.wav')) + PAUSE, h4: dur(join(OUT, 'h4.wav')) + PAUSE, body: dur(join(OUT, 'body.wav')) + TAIL };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + join(DIR, 'videoB2.html'), { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
for (const part of ['h1', 'h4', 'body']) {
  await page.evaluate((p) => { window.SETUP = p === 'body' ? { hook: 'none', H: 0 } : { hook: p, H: 1e6 }; }, part);
  const fd = join(OUT, 'f_' + part); rmSync(fd, { recursive: true, force: true }); mkdirSync(fd, { recursive: true });
  for (let i = 0; i < Math.round(len[part] * FPS); i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    await page.screenshot({ path: join(fd, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 90 });
  }
  ff(['-framerate', String(FPS), '-i', join(fd, 'f%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', join(OUT, `${part}.mp4`)]);
  rmSync(fd, { recursive: true, force: true });
}
await browser.close();
const H1 = dur(join(OUT, 'h1.mp4')), H4 = dur(join(OUT, 'h4.mp4')), Ht = H1 + H4;
const tot = Ht + dur(join(OUT, 'body.wav')) + TAIL;
execFileSync('python3', [join(DIR, 'music.py'), 'B', String(tot + 0.5), join(OUT, 'music.wav'), String(H1), String(Ht),
  ...[6.11, 13.35, 25.57, 29.25].map((x) => String(Ht + x)), '--prix', String(Ht + 29.25)]);
const final = join(DIR, 'B-COMBINEE-grossiste.mp4');
ff(['-i', join(OUT, 'h1.mp4'), '-i', join(OUT, 'h4.mp4'), '-i', join(OUT, 'body.mp4'),
  '-i', join(OUT, 'h1.wav'), '-i', join(OUT, 'h4.wav'), '-i', join(OUT, 'body.wav'), '-i', join(OUT, 'music.wav'),
  '-filter_complex',
  `[0:v][1:v][2:v]concat=n=3:v=1:a=0,format=yuv420p[v];[3:a]apad=whole_dur=${H1}[a1];[4:a]apad=whole_dur=${H4}[a2];` +
  `[a1][a2][5:a]concat=n=3:v=0:a=1,apad=whole_dur=${tot}[voice0];[voice0]asplit=2[voice][key];[6:a]atrim=0:${tot},volume=0.17[mus];` +
  `[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=40:release=450[musd];` +
  `[voice][musd]amix=inputs=2:normalize=0,alimiter=limit=0.95,loudnorm=I=-15:TP=-1.5:LRA=9[a]`,
  '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '19', '-preset', 'medium', '-profile:v', 'high', '-r', String(FPS),
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(tot), final]);
console.log('✔ B-COMBINEE-grossiste.mp4', tot.toFixed(1) + ' s');
