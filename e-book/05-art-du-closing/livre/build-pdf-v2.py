#!/usr/bin/env python3
"""Manuscrit v2 (Markdown + blocs <div class=... markdown="1">) -> PDF A4 premium.
Police : Times New Roman (Liberation Serif, métriques identiques, si absente). Corps 14 pt.
Usage : python3 build-pdf-v2.py"""
import re, glob, os, subprocess, json, html as H
import markdown

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "manuscrit-v2")
DIST = os.path.join(ROOT, "dist-v2")
os.makedirs(DIST, exist_ok=True)
PHONE = os.environ.get("PHONE") == "1"

VERT, OR, CREME, ENCRE = "#123B2F", "#B08A3E", "#FAF6EC", "#1E1E1E"
CSS = f"""
@page {{ size: A4; margin: 20mm 19mm 20mm 19mm; }}
* {{ box-sizing: border-box; }}
html {{ -webkit-print-color-adjust: exact; }}
body {{ font-family: 'Times New Roman', 'Liberation Serif', Times, serif; font-size: 14pt; line-height: 1.45; color: {ENCRE}; text-align: left; hyphens: none; }}
p {{ margin: 0 0 8pt; }}
strong {{ color: {VERT}; }}
em {{ color: #3a3a3a; }}
ul, ol {{ margin: 4pt 0 8pt; padding-left: 22pt; }}
li {{ margin: 2pt 0; }}
hr {{ border: none; height: 0; margin: 14pt 0; border-top: 1px solid #d9cfb5; }}
h1 {{ font-size: 26pt; line-height: 1.15; color: {VERT}; margin: 0 0 18pt; font-weight: bold; }}
h1 .num {{ display: block; font-size: 12pt; letter-spacing: 4pt; color: {OR}; font-weight: bold; text-transform: uppercase; margin-bottom: 6pt; }}
h1::after {{ content: ""; display: block; width: 60mm; height: 2.5pt; background: {OR}; margin-top: 10pt; }}
h2 {{ font-size: 18pt; color: {VERT}; margin: 20pt 0 8pt; padding-bottom: 3pt; border-bottom: 1px solid #d9cfb5; break-after: avoid; }}
h3 {{ font-size: 15pt; color: {VERT}; margin: 12pt 0 6pt; break-after: avoid; }}
table {{ width: 100%; border-collapse: collapse; margin: 8pt 0 12pt; font-size: 12pt; line-height: 1.3; }}
th {{ background: {VERT}; color: #fff; text-align: left; padding: 6pt 7pt; font-weight: bold; }}
td {{ border-bottom: 1px solid #e3dccb; padding: 6pt 7pt; vertical-align: top; }}
tr:nth-child(even) td {{ background: #fbf9f3; }}
blockquote {{ margin: 10pt 0; padding: 8pt 14pt; border-left: 3pt solid {OR}; background: {CREME}; font-size: 13.5pt; break-inside: avoid; }}
blockquote p {{ margin: 3pt 0; }}
.box {{ margin: 12pt 0; padding: 10pt 14pt 6pt; border-radius: 3pt; font-size: 13.5pt; }}
.box h3 {{ margin: 0 0 6pt; font-size: 14.5pt; break-after: avoid; }}
.box li, .box tr, .box p {{ break-inside: avoid; }}
.bref, .suite {{ break-inside: avoid; }}
p, li {{ orphans: 1; widows: 1; }}
.box table {{ background: #fff; font-size: 11.5pt; }}
.bref {{ background: {VERT}; color: #fff; border-left: 6pt solid {OR}; }}
.bref strong, .bref h3 {{ color: #F1D9A6; }}
.scene {{ background: {CREME}; border: 1px solid #e6dcc3; border-left: 6pt solid {OR}; }}
.scene h3 {{ color: #8a6a2b; }}
.quiz {{ background: #fff; border: 2pt solid {OR}; }}
.quiz h3 {{ color: #8a6a2b; }}
.quiz ul {{ list-style: none; padding-left: 4pt; }}
.quiz li {{ margin: 5pt 0; }}
.reponse {{ background: #EEF5F0; border-left: 6pt solid #2F7A55; }}
.reponse h3 {{ color: #2F7A55; }}
.vrai {{ background: #fff; border-top: 1px solid {OR}; border-bottom: 1px solid {OR}; font-style: italic; padding: 10pt 18pt; font-size: 13.5pt; }}
.vrai::before {{ content: "TÉMOIGNAGES RÉELS"; display: block; font-style: normal; font-size: 9.5pt; letter-spacing: 2pt; color: {OR}; font-weight: bold; margin-bottom: 4pt; }}
.vrai .src {{ display: block; font-style: normal; font-size: 11pt; color: #6b6b6b; margin-top: 2pt; margin-bottom: 4pt; }}
.ecris {{ background: #fff; border: 1.5pt dashed {VERT}; }}
.ligne {{ display: inline-block; min-width: 70mm; border-bottom: 1px solid #888; height: 1.1em; vertical-align: bottom; }}
.ligne.court {{ min-width: 25mm; }}
td .ligne {{ min-width: 30mm; }}
.profils {{ background: #F3F6F4; border-top: 4pt solid {VERT}; }}
.profils p {{ margin: 6pt 0; }}
.mots {{ background: #fff; border: 1px solid #d9cfb5; }}
.mots table {{ font-size: 10.5pt; }} .mots td, .mots th {{ padding: 3pt 5pt; }}
.erreur {{ background: #FBEDEA; border-left: 6pt solid #A23B2A; }}
.erreur h3 {{ color: #A23B2A; }}
.check {{ background: {CREME}; border: 1px solid #e6dcc3; }}
.check ul {{ list-style: none; padding-left: 4pt; }}
.attention {{ background: #FFF8E8; border: 1px solid {OR}; border-left: 6pt solid {OR}; }}
.suite {{ background: {VERT}; color: #fff; }}
.accroche {{ background: none; border: none; border-left: 4pt solid {OR}; font-size: 17pt; font-style: italic; line-height: 1.35; color: {VERT}; padding: 4pt 0 4pt 16pt; margin: 4pt 0 16pt; }}
.accroche strong {{ font-style: italic; color: #8a6a2b; }}
.remarque {{ background: #fff; border: 1px solid {VERT}; border-top: 5pt solid {VERT}; }}
.vecu {{ background: {CREME}; border: 1px solid #e6dcc3; }}
.vecu ul {{ list-style: none; padding-left: 4pt; }}
.vecu li {{ margin: 4pt 0; }}
.vecu p {{ margin: 10pt 0 2pt; color: {VERT}; }}
.suite strong, .suite h3 {{ color: #F1D9A6; }}
.chapter {{ break-before: page; }}
figure.ill {{ margin: 12pt 0; text-align: center; break-inside: avoid; }}
figure.ill img {{ width: 100%; max-height: 120mm; object-fit: contain; border-radius: 6pt; }}
.partpage img {{ width: 85%; margin: 14pt auto 0; display: block; border-radius: 8pt; }}
.toc {{ break-before: page; }}
.toc h1::after {{ display: none; }}
.toc .row {{ display: flex; justify-content: space-between; border-bottom: 1px dotted #b9ab86; padding: 6pt 0; font-size: 14pt; }}
.toc .part {{ margin-top: 14pt; font-weight: bold; color: {OR}; letter-spacing: 1.5pt; font-size: 11.5pt; text-transform: uppercase; }}
.toc .soon {{ color: #8b8b8b; font-style: italic; }}
.partpage {{ break-before: page; height: 250mm; display: flex; flex-direction: column; justify-content: center; padding: 0 12mm; border-left: 6pt solid {OR}; background: {CREME}; }}
.partpage .pk {{ color: {OR}; letter-spacing: 6pt; font-size: 14pt; font-weight: bold; text-transform: uppercase; }}
.partpage .pt {{ color: {VERT}; font-size: 38pt; font-weight: bold; line-height: 1.1; margin: 10pt 0; }}
.partpage .rule {{ width: 50mm; height: 2pt; background: {OR}; margin: 8pt 0 16pt; }}
.partpage .pd {{ font-size: 16pt; font-style: italic; color: #4a4a4a; max-width: 140mm; }}
.cv2 {{ position: relative; width: 210mm; height: 296mm; overflow: hidden; color: #fff; break-after: page; font-family: 'Liberation Sans', Arial, sans-serif; }}
.cv2 .bg {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
.cv2 .top {{ position: absolute; top: 20mm; left: 18mm; right: 18mm; }}
.cv2 .k {{ color: {OR}; letter-spacing: 5pt; font-size: 11pt; font-weight: bold; }}
.cv2 .t {{ font-size: 60pt; font-weight: 900; line-height: 1.0; margin: 8pt 0 6pt; letter-spacing: -1pt; }}
.cv2 .t span {{ color: #E9C46A; }}
.cv2 .rule {{ width: 40mm; height: 2.5pt; background: {OR}; margin: 8pt 0 12pt; }}
.cv2 .acc {{ font-size: 18pt; line-height: 1.25; font-weight: bold; color: #FAF6EC; max-width: 132mm; text-shadow: 0 1pt 6pt rgba(0,0,0,.6); }}
.cv2 .acc b {{ color: #E9C46A; }}
.cv2 .bottom {{ position: absolute; bottom: 12mm; left: 18mm; right: 18mm; text-align: center; }}
.cv2 .val {{ display: inline-flex; gap: 6pt; flex-wrap: wrap; justify-content: center; font-size: 11.5pt; font-weight: bold; }}
.cv2 .val span {{ background: rgba(250,246,236,.95); color: {VERT}; padding: 4pt 10pt; border-radius: 20pt; }}
.cv2 .pays {{ margin-top: 7pt; font-size: 10.5pt; color: #EADDBE; }}
.cover {{ position: relative; height: 255mm; margin: 0; background: {VERT}; color: #fff; display: flex; flex-direction: column; justify-content: center; padding: 0 22mm; break-after: page; }}
.cover::before {{ content: ""; position: absolute; inset: 7mm; border: 1.2pt solid {OR}; }}
.cover::after {{ content: ""; position: absolute; inset: 9.5mm; border: 0.5pt solid {OR}; }}
.cover .k {{ color: {OR}; letter-spacing: 5pt; font-size: 11pt; font-weight: bold; }}
.cover .t {{ font-size: 48pt; font-weight: bold; line-height: 1.05; margin: 14pt 0 10pt; }}
.cover .rule {{ width: 50mm; height: 2pt; background: {OR}; margin: 6pt 0 16pt; }}
.cover .s {{ font-size: 17pt; font-style: italic; color: #EADDBE; max-width: 140mm; }}
.cover .v {{ position: absolute; bottom: 22mm; left: 22mm; font-size: 11pt; color: #CDBF97; letter-spacing: 1pt; }}
"""

def fix_lists(text):
    out, prev = [], ""
    for line in text.split("\n"):
        is_item = bool(re.match(r"^\s*(?:[-*] |\d+\. )", line))
        prev_item = bool(re.match(r"^\s*(?:[-*] |\d+\. )", prev))
        if is_item and prev.strip() and not prev_item and not prev.lstrip().startswith(("|", "<", "#")):
            out.append("")
        out.append(line); prev = line
    return "\n".join(out)

def md(text):
    text = text.replace("- [ ] ", "- ☐ ")
    text = fix_lists(text)
    out = markdown.markdown(text, extensions=["tables", "sane_lists", "md_in_html"])
    out = re.sub(r'<div class="([a-z]+)">', lambda m: f'<div class="box {m.group(1)}">' if m.group(1) != "vrai" else '<div class="box vrai">', out)
    # Chapter heading: "Chapitre N — Titre" -> number line + title
    out = re.sub(r"<h1>Chapitre (\d+) — (.*?)</h1>", r'<h1><span class="num">Chapitre \1</span>\2</h1>', out)
    return out

PHONE_CSS = """
@page { size: 110mm 196mm; margin: 9mm 8mm 11mm 8mm; }
body { font-size: 12.5pt; line-height: 1.4; }
h1 { font-size: 19pt; } h1 .num { font-size: 10pt; letter-spacing: 2pt; } h1::after { width: 35mm; }
h2 { font-size: 15pt; } h3 { font-size: 13pt; }
table { font-size: 9.5pt; } th, td { padding: 4pt 4pt; }
.box { font-size: 12pt; padding: 8pt 9pt 4pt; } .box table { font-size: 9pt; }
.accroche { font-size: 14pt; } blockquote { font-size: 12pt; }
.ligne { min-width: 45mm; } td .ligne { min-width: 12mm; }
figure.ill img { max-height: 70mm; }
.partpage { height: 170mm; padding: 0 6mm; } .partpage .pt { font-size: 26pt; } .partpage .pd { font-size: 13pt; } .partpage img { width: 100%; }
.toc .row { font-size: 11.5pt; }
.cv2 { width: 110mm; height: 195.5mm; }
.cv2 .top { top: 11mm; left: 9mm; right: 9mm; } .cv2 .k { font-size: 7pt; letter-spacing: 3pt; }
.cv2 .t { font-size: 29pt !important; } .cv2 .rule { width: 24mm; margin: 5pt 0 7pt; }
.cv2 .acc { font-size: 11pt; max-width: 80mm; }
.cv2 .bottom { bottom: 6mm; left: 5mm; right: 5mm; } .cv2 .val { font-size: 7pt; gap: 3pt; } .cv2 .val span { padding: 2pt 5pt; } .cv2 .pays { font-size: 6pt; margin-top: 4pt; }
"""
def page(body, title):
    return f'<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>{H.escape(title)}</title><style>{CSS}{PHONE_CSS if PHONE else ""}</style></head><body>{body}</body></html>'

COVER = """<section class="cv2"><img class="bg" src="../illustrations/cover-bg-a4.jpg" alt="">
<div class="top"><div class="k">COLLECTION PLAYBOOKS</div>
<div class="t" style="font-size:50pt">Ne laisse plus<br>partir <span>tes clients</span></div><div class="rule"></div>
<div class="acc">«&nbsp;Transforme les <b>«&nbsp;je vais réfléchir&nbsp;»</b> en <b style="white-space:nowrap">«&nbsp;oui&nbsp;»</b>, sans forcer. L'art du closing à l'africaine.&nbsp;»</div></div>
<div class="bottom"><div class="val"><span>La méthode RIDEAU en 6 clés</span><span>Des exemples en BD</span><span>Un plan de 30 jours</span></div>
<div class="pays">Au marché · sur WhatsApp · au téléphone · en entreprise · à la livraison · <b>partout en Afrique</b></div></div></section>"""

files = sorted(glob.glob(os.path.join(SRC, "*.md")))
PARTS = [(1, "Partie 1", "Comprendre", "Ce qu'est le closing, pourquoi les clients partent, ce qu'ils pensent vraiment, et les erreurs qu'on fait sans le savoir."),
         (6, "Partie 2", "La méthode RIDEAU", "Six clés, dans l'ordre, du premier « bonjour » jusqu'au « oui » : Retenir · Interroger · Démasquer · Écouter · Apaiser · Unir."),
         (12, "Partie 3", "Les situations une par une", "« C'est cher », « je n'ai pas l'argent », « c'est pas l'arnaque ? », « je demande à mon mari », « je vais réfléchir », le crédit, les commandes annulées."),
         (19, "Partie 4", "Selon ta façon de vendre", "Le marché, WhatsApp et les réseaux, les produits digitaux, le téléphone, les entreprises, la diaspora, la livraison."),
         (26, "Partie 5", "Devenir un closer", "Ta boîte à histoires, l'éthique et la loi, et ton plan d'entraînement de 30 jours."),
         (90, "Annexes", "Pour aller plus loin", "Le lexique, les sources et les mentions.")]
PART_IMG = {6: '<img src="../illustrations/ill-04-six-cles.jpg" alt="Les 6 clés RIDEAU">'}
def num(f):
    m = re.match(r"(\d+)", os.path.basename(f)); return int(m.group(1)) if m else 0
toc = ['<section class="toc"><h1>Sommaire</h1>']
chapters = []
for f in files:
    n = num(f)
    title = open(f, encoding="utf-8").readline().strip("# \n")
    for start, pn, pt, pd in PARTS:
        if n == start or (start == 90 and n >= 90 and not any(num(g) >= 90 and num(g) < n for g in files)):
            toc.append(f'<div class="part">{pn} — {H.escape(pt)}</div>')
            chapters.append(f'<section class="partpage"><div class="pk">{pn}</div><div class="pt">{H.escape(pt)}</div><div class="rule"></div><div class="pd">{H.escape(pd)}</div>{PART_IMG.get(start, "")}</section>')
    if n == 0:
        toc.insert(1, f'<div class="part">Pour commencer</div><div class="row"><span>{H.escape(title)}</span></div>')
    else:
        toc.append(f'<div class="row"><span>{H.escape(title)}</span></div>')
    body = md(open(f, encoding="utf-8").read())
    chapters.append(f'<section class="chapter">{body}</section>')
toc.append("</section>")
jobs = []
allp = os.path.join(DIST, "_all.html")
open(allp, "w", encoding="utf-8").write(page("".join(toc) + "".join(chapters), "Ne laisse plus partir tes clients"))
covp = os.path.join(DIST, "_cover.html")
open(covp, "w", encoding="utf-8").write(page(COVER.replace("cover-bg-a4", "cover-bg-phone") if PHONE else COVER, "Couverture").replace("</style>", ("@page { size: 110mm 196mm; margin: 0; }" if PHONE else "@page { size: A4; margin: 0; }") + " body { margin: 0; }</style>"))
OUT = os.environ.get("OUT", "L-Art-du-Closing-telephone.pdf" if PHONE else "L-Art-du-Closing-livre-complet.pdf")
jobs.append([allp, os.path.join(DIST, OUT)])

SIZE = "width: '110mm', height: '196mm'," if PHONE else "format: 'A4',"
MARG = "{ top: '9mm', bottom: '11mm', left: '8mm', right: '8mm' }" if PHONE else "{ top: '20mm', bottom: '20mm', left: '19mm', right: '19mm' }"
FOOT = ('<div style="font-family:Times New Roman,Liberation Serif,serif;font-size:'+('7pt' if PHONE else '9pt')+';width:100%;padding:0 '+('8mm' if PHONE else '19mm')+';'
        'display:flex;justify-content:space-between;color:#8a7a55"><span>Ne laisse plus partir tes clients</span>'
        '<span class="pageNumber"></span></div>')
js = """
const { chromium } = require('playwright');
(async () => {
  const jobs = %s;
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const [h, o] of jobs) {
    await p.goto('file://' + h, { waitUntil: 'load' });
    await p.pdf({ path: o, %s printBackground: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '%s',
      margin: %s });
  }
  await p.goto('file://' + %s, { waitUntil: 'load' });
  await p.pdf({ path: %s, %s printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
  await b.close();
})();
""" % (json.dumps(jobs), SIZE, FOOT, MARG, json.dumps(covp), json.dumps(os.path.join(DIST, "_cover.pdf")), SIZE)
jsp = os.path.join(DIST, "_render.js")
open(jsp, "w").write(js)
subprocess.run(["node", jsp], check=True, cwd=ROOT)
for h, _ in jobs: os.remove(h)
import pypdf
cv = os.path.join(DIST, "_cover.pdf")
for _, o in jobs:
    w = pypdf.PdfWriter(); w.append(cv); w.append(o); w.write(o)
os.remove(cv); os.remove(covp)
os.remove(jsp)
print("\n".join(o for _, o in jobs))
