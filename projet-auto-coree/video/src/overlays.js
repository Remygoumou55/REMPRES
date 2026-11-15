// Génère les calques texte (PNG transparents 1080x1920) pour chaque scène
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const icon = fs.readFileSync(path.join(__dirname, '../../logo/icone.svg'), 'utf8');
const scenes = JSON.parse(fs.readFileSync(path.join(__dirname, 'scenes.json'), 'utf8'));
const css = `*{margin:0;box-sizing:border-box}body{width:1080px;height:1920px;font-family:Inter,sans-serif;position:relative;overflow:hidden}
.top{position:absolute;top:60px;left:60px;display:flex;align-items:center;gap:22px}
.top svg{width:96px;height:96px}.brand{color:#fff;font-weight:800;font-size:40px;letter-spacing:1px;text-shadow:0 2px 12px rgba(0,0,0,.6)}
.brand span{color:#F2B33D;font-weight:300}
.grad{position:absolute;left:0;right:0;bottom:0;height:900px;background:linear-gradient(to top,rgba(11,31,58,.97) 0%,rgba(11,31,58,.85) 45%,rgba(11,31,58,0) 100%)}
.box{position:absolute;left:70px;right:70px;bottom:190px;color:#fff}
.tag{display:inline-block;background:#F2B33D;color:#0B1F3A;font-weight:800;font-size:34px;padding:10px 26px;border-radius:12px;letter-spacing:2px;margin-bottom:28px}
.tag.red{background:#D7263D;color:#fff}.tag.green{background:#1FA45B;color:#fff}
h1{font-size:84px;font-weight:800;line-height:1.05;margin-bottom:22px}
p{font-size:46px;font-weight:500;line-height:1.3;opacity:.95}
.note{position:absolute;left:70px;right:70px;bottom:90px;color:#cfd6e2;font-size:26px}
.full{position:absolute;inset:0;background:#0B1F3A;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;padding:80px}
.full svg{width:340px;height:340px;margin-bottom:50px}.full h1{font-size:92px}.full p{font-size:48px;margin-top:10px}
.full .big{font-size:50px;white-space:nowrap;font-weight:800;color:#F2B33D;margin-top:40px}
.steps{margin-top:40px;text-align:left;font-size:42px;line-height:1.6}`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  for (const s of scenes) {
    let body;
    if (s.full) {
      body = `<div class="full">${icon}<h1>${s.title}</h1>${s.text ? `<p>${s.text}</p>` : ''}${s.big ? `<div class="big">${s.big}</div>` : ''}${s.steps ? `<div class="steps">${s.steps}</div>` : ''}</div>`;
    } else {
      body = `<div class="grad"></div><div class="top">${icon}<div class="brand">K-BRIDGE <span>AUTO</span></div></div>
      <div class="box">${s.tag ? `<div class="tag ${s.tagColor || ''}">${s.tag}</div>` : ''}<h1>${s.title}</h1>${s.text ? `<p>${s.text}</p>` : ''}</div>
      ${s.note ? `<div class="note">${s.note}</div>` : ''}`;
    }
    await p.setContent(`<html><head><style>${css}</style></head><body style="background:transparent">${body}</body></html>`);
    await p.screenshot({ path: path.join(__dirname, `ov_${s.id}.png`), omitBackground: true });
  }
  await b.close();
})();
