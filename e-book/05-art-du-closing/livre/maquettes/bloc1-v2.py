#!/usr/bin/env python3
"""Bloc 1 v2 : une seule histoire continue (la journée de Fanta), face à face, bulles de BD. 2 mises en page."""
import os, json, subprocess, html as H
ROOT = os.path.dirname(os.path.abspath(__file__))

# Moments de la journée : (heure, titre, client_avatar, client_nom, [(qui, texte)], narration_fin)
# qui : C client, V Fanta, P pensée de Fanta
DAY = [
 ("8 h 00", "Le premier passant", "🧑🏾", "Un passant", [
   ("C", "C'est combien, ça ?"),
   ("V", "Ça, c'est 15 000, mon fr…"),
 ], "Il a déjà reposé la robe. Il est parti. Fanta n'a même pas fini sa phrase."),
 ("9 h 30", "Personne ne veut donner son prix", "👨🏾", "Un client", [
   ("C", "La robe bleue, c'est combien ?"),
   ("V", "15 000."),
   ("C", "Tu peux laisser à combien ?"),
   ("V", "Toi, tu proposes combien ?"),
   ("C", "Non, dis-moi d'abord ton dernier prix."),
   ("V", "Propose seulement, on va s'entendre !"),
 ], "Chacun attend que l'autre parle en premier."),
 ("9 h 35", "Le prix cassé en deux", "👨🏾", "Le même client", [
   ("C", "Bon… 7 000."),
   ("V", "Ah non ! Augmente un peu. Moi-même, je ne l'ai pas achetée à ce prix."),
   ("C", "Je ne peux pas augmenter. C'est tout ce que j'ai sur moi."),
   ("V", "Bon, donne 12 000. C'est ton prix, parce que c'est toi."),
   ("C", "Hum… Laisse, je vais voir ailleurs."),
 ], "Il s'en va. Fanta a baissé son prix de 3 000… et elle n'a rien vendu."),
 ("11 h 00", "« Je vais faire le tour »", "👩🏾", "Une cliente", [
   ("C", "La jaune, là, c'est combien ?"),
   ("V", "12 000, ma sœur. C'est du bon tissu."),
   ("C", "D'accord, j'ai compris. Je vais faire le tour, je reviens."),
   ("V", "Pas de problème, à tout à l'heure !"),
 ], "La journée passe. Elle n'est jamais revenue."),
 ("14 h 00", "« Je dois d'abord montrer à mon mari »", "👩🏾‍🦱", "Une cliente", [
   ("C", "Waouh, elle est jolie ! Elle me plaît vraiment."),
   ("V", "Elle te va très bien. C'est 12 000."),
   ("C", "Bon… mais je dois d'abord la montrer à mon mari."),
   ("V", "Ah bon… D'accord. Reviens avec lui."),
 ], "Ni elle, ni son mari ne sont revenus."),
 ("16 h 30", "« Écris mon nom dans le cahier »", "👵🏾", "Une cliente fidèle", [
   ("C", "Je prends les deux robes. Mais je n'ai pas l'argent aujourd'hui. Écris mon nom dans le cahier, je paie à la fin du mois."),
   ("V", "Pas de problème, tu es ma cliente. Je t'écris."),
 ], "Deux robes sont parties. Pas un franc n'est rentré."),
]
END_THOUGHT = "Cinq clients… Zéro franc dans ma caisse… Et un nom de plus dans le cahier. Qu'est-ce que j'ai fait de mal aujourd'hui ?"
CHECK = ["Le client demande le prix… et part avant que tu finisses.",
         "« Tu peux laisser à combien ? » « Toi, tu proposes combien ? »",
         "Tu baisses ton prix… et le client part quand même.",
         "« Je vais faire le tour, je reviens »… et tu ne le revois jamais.",
         "« Je dois d'abord montrer à mon mari. »",
         "« Écris mon nom dans le cahier »… et la personne ne revient jamais payer."]

def css(c, mode):
    base = f"""
@page {{ size: A4; margin: 15mm 16mm 15mm 16mm; }}
body {{ font-family: 'Times New Roman','Liberation Serif',serif; font-size: 14pt; color: #1d1d1d; }}
.top .k {{ color: {c['accent']}; letter-spacing: 3pt; font-weight: bold; font-size: 10.5pt; }}
.top h1 {{ margin: 3pt 0 4pt; color: {c['titre']}; font-size: 26pt; }}
.top p {{ margin: 0 0 8pt; }}
.bloc {{ display: inline-block; background: {c['titre']}; color: #fff; padding: 6pt 14pt; border-radius: 20pt; font-weight: bold; font-size: 14pt; margin: 4pt 0 10pt; }}
.bloc span {{ color: {c['accent']}; margin-right: 6pt; }}
.intro {{ font-style: italic; font-size: 14.5pt; margin: 4pt 0 12pt; }}
.time {{ display: flex; align-items: center; gap: 10pt; margin: 14pt 0 6pt; break-after: avoid; }}
.time .h {{ background: {c['accent']}; color: #fff; font-weight: bold; padding: 3pt 10pt; border-radius: 12pt; font-size: 12.5pt; white-space: nowrap; }}
.time .t {{ font-weight: bold; color: {c['titre']}; font-size: 15pt; }}
.time .line {{ flex: 1; border-top: 1.5pt dotted {c['accent']}; }}
.stage {{ display: grid; grid-template-columns: 70pt 1fr 70pt; gap: 6pt; align-items: start; break-inside: avoid; }}
.char {{ text-align: center; }}
.char .face {{ font-size: 46pt; line-height: 1; }}
.char .name {{ font-size: 10pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase; color: #555; margin-top: 2pt; }}
.char.fanta .name {{ color: {c['accent']}; }}
.talk {{ display: flex; flex-direction: column; gap: 9pt; padding-top: 4pt; }}
.b {{ position: relative; background: #fff; border: 1.8pt solid {c['titre']}; border-radius: 16pt; padding: 7pt 13pt; max-width: 82%; line-height: 1.35; font-size: 13.5pt; }}
.b.c {{ align-self: flex-start; }}
.b.v {{ align-self: flex-end; background: {c['bulle_v']}; }}
.b.c::before {{ content: ""; position: absolute; left: -11pt; top: 10pt; border: 6pt solid transparent; border-right: 11pt solid {c['titre']}; border-left: 0; }}
.b.c::after {{ content: ""; position: absolute; left: -8pt; top: 11.5pt; border: 4.5pt solid transparent; border-right: 8.5pt solid #fff; border-left: 0; }}
.b.v::before {{ content: ""; position: absolute; right: -11pt; top: 10pt; border: 6pt solid transparent; border-left: 11pt solid {c['titre']}; border-right: 0; }}
.b.v::after {{ content: ""; position: absolute; right: -8pt; top: 11.5pt; border: 4.5pt solid transparent; border-left: 8.5pt solid {c['bulle_v']}; border-right: 0; }}
.n {{ text-align: center; font-style: italic; color: #555; margin: 8pt 40pt 2pt; font-size: 13.5pt; }}
.think {{ text-align: center; margin: 18pt 0 10pt; break-inside: avoid; }}
.think .cloud {{ display: inline-block; background: {c['bulle_v']}; border: 1.8pt dashed {c['titre']}; border-radius: 30pt; padding: 10pt 18pt; font-style: italic; font-size: 14pt; max-width: 75%; }}
.think .face {{ font-size: 50pt; display: block; margin-top: 4pt; }}
.check {{ break-inside: avoid; border-top: 3pt solid {c['accent']}; padding-top: 8pt; margin-top: 10pt; }}
.check h2 {{ margin: 0 0 6pt; color: {c['titre']}; font-size: 18pt; }}
.check li {{ list-style: none; margin: 4pt 0; }}
.check ul {{ padding-left: 4pt; margin: 4pt 0 8pt; }}
.check .end {{ font-size: 14.5pt; }} .check .end b {{ color: {c['titre']}; }}
"""
    if mode == "bd":
        base += f"""
.panel {{ border: 2.2pt solid {c['titre']}; border-radius: 4pt; padding: 8pt 10pt 8pt; margin: 0 0 4pt; background: {c['fond_panel']}; box-shadow: 4pt 4pt 0 {c['accent']}; break-inside: avoid; }}
.time {{ margin-top: 14pt; }}
"""
    else:
        base += f"""
.panel {{ border: none; padding: 0; margin: 0; }}
.stage {{ background: linear-gradient(to bottom, transparent 0, transparent calc(100% - 3pt), {c['sol']} calc(100% - 3pt)); padding-bottom: 6pt; }}
"""
    return base

def build(c, mode):
    out = ['<div class="top"><div class="k">AVANT DE COMMENCER</div><h1>Ça t\'est déjà arrivé ?</h1>',
           '<p>Suis la journée de Fanta, vendeuse de robes au marché. <b>Tu vas sûrement te reconnaître.</b></p></div>',
           '<div class="bloc"><span>BLOC 1</span>Quand le client est devant toi</div>',
           '<div class="intro">7 h 30. Fanta installe ses robes sur son étal. Elle sourit : aujourd\'hui, elle va bien vendre.</div>']
    for h, t, av, nm, lines, nar in DAY:
        out.append(f'<div class="time"><span class="h">{h}</span><span class="t">{H.escape(t)}</span><span class="line"></span></div>')
        talk = "".join(f'<div class="b {"c" if w=="C" else "v"}">{H.escape(x)}</div>' for w, x in lines)
        out.append(f'<div class="panel"><div class="stage"><div class="char"><div class="face">{av}</div><div class="name">{H.escape(nm)}</div></div>'
                   f'<div class="talk">{talk}</div><div class="char fanta"><div class="face">🧕🏾</div><div class="name">Fanta</div></div></div>'
                   f'<div class="n">{H.escape(nar)}</div></div>')
    out.append('<div class="time"><span class="h">18 h 30</span><span class="t">Fanta range ses robes</span><span class="line"></span></div>')
    out.append(f'<div class="think"><div class="cloud">{H.escape(END_THOUGHT)}</div><span class="face">🧕🏾</span></div>')
    items = "".join(f"<li>☐ {H.escape(x)}</li>" for x in CHECK)
    out.append(f'<div class="check"><h2>Et toi, ça t\'est déjà arrivé ?</h2><p>Coche tout ce que tu as déjà vécu, comme vendeur… ou comme client.</p><ul>{items}</ul>'
               '<p class="end"><b>Tu as coché au moins une case ?</b> Tu n\'es pas seul : des milliers de vendeurs vivent la journée de Fanta. <b>Chaque scène a une explication, et presque chacune a une solution.</b> On les voit ensemble dans ce livre.</p></div>')
    return f'<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>{css(c, mode)}</style></head><body>{"".join(out)}</body></html>'

VARIANTS = {
 "A-bande-dessinee-terre-et-or": (dict(titre="#5A2E14", accent="#C8892B", bulle_v="#FBEFD9", fond_panel="#FFFCF5", sol="#E8D3AE"), "bd"),
 "B-scene-ouverte-bleu-nuit-et-corail": (dict(titre="#14213D", accent="#E76F51", bulle_v="#FDEDE8", fond_panel="#FFFFFF", sol="#F2C4B5"), "open"),
}
jobs = []
for key, (c, mode) in VARIANTS.items():
    hp = os.path.join(ROOT, f"_{key}.html"); open(hp, "w", encoding="utf-8").write(build(c, mode))
    jobs.append([hp, os.path.join(ROOT, f"maquette-bloc1-v2-{key}.pdf")])
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();for(const [h,o] of %s){await p.goto('file://'+h);await p.pdf({path:o,format:'A4',printBackground:true,margin:{top:'15mm',bottom:'15mm',left:'16mm',right:'16mm'}});}await b.close();})();" % json.dumps(jobs)
jsp = os.path.join(ROOT, "_r.js"); open(jsp, "w").write(js)
subprocess.run(["node", jsp], check=True)
for h, _ in jobs: os.remove(h)
os.remove(jsp)
print("\n".join(o for _, o in jobs))
