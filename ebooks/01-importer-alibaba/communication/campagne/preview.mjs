// node preview.mjs A "h1:2.8,h2:5,body:4,body:10" -> planche de contrôle
import { createRequire } from 'node:module'; import { dirname, join } from 'node:path'; import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url); const { chromium } = require('playwright');
const DIR = dirname(fileURLToPath(import.meta.url)); const [id, spec] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + join(DIR, `video${id}.html`), { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
const files = [];
for (const [k, item] of spec.split(',').entries()) {
  const [part, t] = item.split(':');
  await p.evaluate(([part]) => { window.SETUP = part === 'body' ? { hook: 'none', H: 0 } : { hook: part, H: 1e6 }; }, [part]);
  await p.evaluate((t) => window.render(t), parseFloat(t));
  const f = `/tmp/claude-0/-home-user-REMPRES/6bbd149b-e2d6-53b6-9e9f-a0ab7a562a84/scratchpad/pv_${k}.png`; await p.screenshot({ path: f }); files.push(f);
}
await b.close();
execFileSync('python3', ['-c', `
from PIL import Image
fs=${JSON.stringify(files)}; ims=[Image.open(f).resize((216,384)) for f in fs]
o=Image.new('RGB',(216*len(ims),384))
for i,im in enumerate(ims): o.paste(im,(i*216,0))
o.save('/tmp/claude-0/-home-user-REMPRES/6bbd149b-e2d6-53b6-9e9f-a0ab7a562a84/scratchpad/preview.png')`]);
