#!/usr/bin/env python3
"""Manuscrit Markdown -> HTML -> PDF (A4) via Playwright.
Usage : python3 build-pdf.py   (génère dist/*.pdf)"""
import re, glob, os, subprocess, json, html as H
import markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "manuscrit")
DIST = os.path.join(ROOT, "dist")
os.makedirs(DIST, exist_ok=True)

CSS = """
@page { size: A4; margin: 18mm 17mm 18mm 17mm; }
* { box-sizing: border-box; }
body { font-family: 'Inter', sans-serif; font-size: 10.6pt; line-height: 1.55; color: #1d2433; }
h1 { font-family: 'Inter Display','Inter',sans-serif; font-weight: 900; color: #0F2A44; font-size: 24pt; line-height:1.15;
     border-bottom: 4px solid #FF7A1A; padding-bottom: 8px; margin: 0 0 14px; }
h2 { color: #0F2A44; font-size: 15pt; margin: 20px 0 8px; font-weight: 800; }
h3 { color: #FF7A1A; font-size: 12pt; margin: 14px 0 6px; font-weight: 800; }
p { margin: 6px 0; }
ul, ol { margin: 6px 0 6px 0; padding-left: 20px; }
li { margin: 2px 0; }
strong { color: #0F2A44; }
hr { border: none; border-top: 1px dashed #c9d2de; margin: 14px 0; }
table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 9.6pt; break-inside: auto; }
th { background: #0F2A44; color: #fff; text-align: left; padding: 5px 7px; }
td { border-bottom: 1px solid #dde3ea; padding: 5px 7px; vertical-align: top; }
tr:nth-child(even) td { background: #f5f7fa; }
blockquote { margin: 10px 0; padding: 8px 12px; background: #f1f4f8; border-left: 4px solid #0F2A44; border-radius: 4px; break-inside: avoid; }
blockquote p { margin: 4px 0; }
blockquote.quote { background: #fff6ee; border-left-color: #FF7A1A; font-style: italic; }
blockquote.quote p:last-child { font-style: normal; color: #5a6475; font-size: 9pt; }
blockquote.bref { background: #0F2A44; color: #fff; border-left-color: #FF7A1A; }
blockquote.bref strong { color: #FFB27A; }
blockquote.mots { background: #eef3f9; }
blockquote.cas { background: #eef8f1; border-left-color: #2e8b57; }
blockquote.erreur { background: #fdeeee; border-left-color: #d64545; }
blockquote.check { background: #fff8e6; border-left-color: #FF7A1A; }
blockquote table { background: #fff; }
.twocol { display: flex; gap: 10px; margin: 10px 0; break-inside: avoid; }
.twocol > div { flex: 1; padding: 8px 12px; border-radius: 6px; }
.twocol > div:first-child { background: #e9f6ee; border-top: 4px solid #2e8b57; }
.twocol > div:last-child { background: #eaf0fb; border-top: 4px solid #0F2A44; }
.chapter { break-before: page; }
.chapter:first-of-type { break-before: auto; }
.cover { height: 255mm; display:flex; flex-direction:column; justify-content:center; background:#0F2A44; color:#fff;
         padding: 30mm 18mm; margin: -18mm -17mm 0; break-after: page; }
.cover .k { color:#FF7A1A; font-weight:800; letter-spacing:2px; font-size:11pt; }
.cover h1 { color:#fff; border:none; font-size:44pt; margin:10px 0; }
.cover .s { font-size:15pt; color:#dfe6ef; max-width: 150mm; }
.cover .v { margin-top: 30mm; font-size: 10pt; color:#9fb0c4; }
"""

def classify(bq_html):
    t = re.sub(r"<[^>]+>", "", bq_html).strip()
    if t.startswith("En bref"): return "bref"
    if t.startswith("Les mots"): return "mots"
    if t.startswith("Cas concret"): return "cas"
    if t.startswith("⚠"): return "erreur"
    if t.startswith("✅"): return "check"
    if t.startswith("«") or t.startswith("Cliente") or t.startswith("Vendeur") or "—" in t[-120:]: return "quote"
    return ""

def fix_blocks(text):
    """Ajoute les lignes vides que python-markdown exige avant les listes et les répliques."""
    out, prev = [], ""
    for line in text.split("\n"):
        m = re.match(r"^((?:> ?)*)(.*)$", line)
        pre, body = m.group(1), m.group(2)
        pm = re.match(r"^((?:> ?)*)(.*)$", prev)
        pbody = pm.group(2)
        is_item = bool(re.match(r"^\s*(?:[-*] |\d+\. )", body))
        prev_item = bool(re.match(r"^\s*(?:[-*] |\d+\. )", pbody))
        is_dash = body.startswith("— ")
        if pbody.strip() and ((is_item and not prev_item and not pbody.startswith("|")) or is_dash):
            out.append(pre.rstrip())
        out.append(line)
        prev = line
    return "\n".join(out)

def md_to_html(text):
    text = text.replace("- [ ] ", "- ☐ ")
    text = fix_blocks(text)
    cols = []
    def keep(m):
        a = markdown.markdown(m.group(1).strip(), extensions=["tables"])
        b = markdown.markdown(m.group(2).strip(), extensions=["tables"])
        cols.append(f'<div class="twocol"><div>{a}</div><div>{b}</div></div>')
        return f"\n\nTWOCOL{len(cols)-1}\n\n"
    text = re.sub(r"<table><tr><td>(.*?)</td><td>(.*?)</td></tr></table>", keep, text, flags=re.S)
    out = markdown.markdown(text, extensions=["tables", "sane_lists"])
    for i, c in enumerate(cols):
        out = out.replace(f"<p>TWOCOL{i}</p>", c)
    def bq(m):
        cls = classify(m.group(1))
        return f'<blockquote class="{cls}">{m.group(1)}</blockquote>'
    out = re.sub(r"<blockquote>(.*?)</blockquote>", bq, out, flags=re.S)
    return out

def page(body, title):
    return f'<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>{H.escape(title)}</title><style>{CSS}</style></head><body>{body}</body></html>'

COVER = """<div class="cover"><div class="k">COLLECTION PLAYBOOKS · ÉCHANTILLON</div>
<h1>L'Art du Closing</h1><div class="s">Lève le rideau : la méthode africaine pour transformer les « je vais réfléchir » en « oui »</div>
<div class="v">Partie 1 — Comprendre · Version de travail, novembre 2026</div></div>"""

files = sorted(glob.glob(os.path.join(SRC, "*.md")))
jobs = []
chapters = []
for f in files:
    name = os.path.splitext(os.path.basename(f))[0]
    body = md_to_html(open(f, encoding="utf-8").read())
    chapters.append(f'<section class="chapter">{body}</section>')
    hp = os.path.join(DIST, name + ".html")
    open(hp, "w", encoding="utf-8").write(page(f'<section class="chapter">{body}</section>', name))
    jobs.append([hp, os.path.join(DIST, name + ".pdf")])
allp = os.path.join(DIST, "L-Art-du-Closing-echantillon-partie-1.html")
open(allp, "w", encoding="utf-8").write(page(COVER + "".join(chapters), "L'Art du Closing"))
jobs.append([allp, os.path.join(DIST, "L-Art-du-Closing-echantillon-partie-1.pdf")])

js = """
const { chromium } = require('playwright');
(async () => {
  const jobs = %s;
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [h, o] of jobs) {
    await p.goto('file://' + h, { waitUntil: 'load' });
    await p.pdf({ path: o, format: 'A4', printBackground: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="font-size:8px;width:100%%;text-align:center;color:#888;font-family:Inter">L\\'Art du Closing · <span class="pageNumber"></span></div>',
      margin: { top: '18mm', bottom: '18mm', left: '17mm', right: '17mm' } });
  }
  await b.close();
})();
""" % json.dumps(jobs)
jsp = os.path.join(DIST, "_render.js")
open(jsp, "w").write(js)
subprocess.run(["node", jsp], check=True, cwd=ROOT)
for h, _ in jobs: os.remove(h)
os.remove(jsp)
print("\n".join(o for _, o in jobs))
