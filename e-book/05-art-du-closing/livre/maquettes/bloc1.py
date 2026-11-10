#!/usr/bin/env python3
"""Maquette du bloc 1 (« Quand le client est devant toi ») en conversations, 3 styles de couleurs."""
import os, json, subprocess, html as H
ROOT = os.path.dirname(os.path.abspath(__file__))

# Chaque scène : titre, liste de répliques (qui, texte) ; qui = "C" client, "V" vendeuse, "N" narration
SCENES = [
 ("Scène 1", "Il demande le prix… et il disparaît", [
  ("N", "Un client passe devant l'étal. Il s'arrête, prend une robe, la touche."),
  ("C", "C'est combien, ça ?"),
  ("V", "Ça, c'est 15 000, mon fr…"),
  ("N", "Il a déjà reposé la robe. Il est parti. La vendeuse n'a même pas fini sa phrase."),
 ]),
 ("Scène 2", "Personne ne veut donner son prix", [
  ("C", "Bonjour. La robe bleue, c'est combien ?"),
  ("V", "15 000."),
  ("C", "Tu peux laisser à combien ?"),
  ("V", "Toi, tu proposes combien ?"),
  ("C", "Non, dis-moi d'abord ton dernier prix."),
  ("V", "Propose seulement, on va s'entendre !"),
  ("N", "Chacun attend que l'autre parle en premier."),
 ]),
 ("Scène 3", "Le prix cassé en deux", [
  ("C", "Bon… 7 000."),
  ("V", "Ah non ! Augmente un peu. Moi-même, je ne l'ai pas achetée à ce prix."),
  ("C", "Je ne peux pas augmenter. C'est tout ce que j'ai sur moi."),
  ("V", "Bon, donne 12 000. C'est ton prix, parce que c'est toi."),
  ("C", "Hum… Laisse, je vais voir ailleurs."),
  ("N", "Il repose la robe et s'en va. La vendeuse a baissé son prix… et elle a quand même perdu la vente."),
 ]),
 ("Scène 4", "« Je vais faire le tour »", [
  ("F", "La jaune, là, c'est combien ?"),
  ("V", "12 000, ma sœur. C'est du bon tissu."),
  ("F", "D'accord, j'ai compris. Je vais faire le tour, je reviens."),
  ("V", "Pas de problème, à tout à l'heure !"),
  ("N", "La journée passe. Le marché ferme. Elle n'est jamais revenue."),
 ]),
 ("Scène 5", "« Je dois d'abord montrer à mon mari »", [
  ("F", "Waouh, elle est jolie ! Elle me plaît vraiment."),
  ("V", "Elle te va très bien. C'est 12 000."),
  ("F", "Bon… mais je dois d'abord la montrer à mon mari."),
  ("V", "Ah bon… D'accord. Reviens avec lui."),
  ("N", "Ni elle, ni son mari ne sont revenus."),
 ]),
 ("Scène 6", "« Écris mon nom dans le cahier »", [
  ("F", "Je prends les deux robes. Mais je n'ai pas l'argent aujourd'hui. Écris mon nom dans le cahier, je paie à la fin du mois."),
  ("V", "Pas de problème, tu es ma cliente. Je t'écris."),
  ("N", "La fin du mois arrive. Puis une autre. La cliente ne passe plus devant la boutique. Son nom est toujours dans le cahier."),
 ]),
]

STYLES = {
 "1-terre-et-or": dict(fond="#FFFDF8", titre="#5A2E14", accent="#C8892B", bulle_c="#F3E7D3", bulle_v="#7A3B17", texte_v="#FFFFFF", bande="#7A3B17", nom="Terre et or"),
 "2-bleu-nuit-et-corail": dict(fond="#FFFFFF", titre="#14213D", accent="#E76F51", bulle_c="#EEF1F6", bulle_v="#14213D", texte_v="#FFFFFF", bande="#14213D", nom="Bleu nuit et corail"),
 "3-noir-et-jaune": dict(fond="#FFFFFF", titre="#111111", accent="#F2B705", bulle_c="#F1F1F1", bulle_v="#111111", texte_v="#FFFFFF", bande="#111111", nom="Noir et jaune soleil"),
}

def page(st):
    css = f"""
@page {{ size: A4; margin: 16mm 17mm 16mm 17mm; }}
body {{ font-family: 'Times New Roman','Liberation Serif',serif; font-size: 14pt; color: #1d1d1d; background: {st['fond']}; }}
.top {{ border-left: 6pt solid {st['accent']}; padding-left: 12pt; margin-bottom: 14pt; }}
.top .k {{ color: {st['accent']}; letter-spacing: 3pt; font-weight: bold; font-size: 10.5pt; }}
.top h1 {{ margin: 4pt 0 2pt; color: {st['titre']}; font-size: 25pt; }}
.top p {{ margin: 4pt 0 0; font-size: 14pt; }}
.bloc {{ background: {st['bande']}; color: #fff; padding: 9pt 14pt; border-radius: 6pt; font-size: 16pt; font-weight: bold; margin: 10pt 0 12pt; }}
.bloc span {{ color: {st['accent']}; margin-right: 8pt; }}
.scene {{ break-inside: avoid; margin: 0 0 12pt; padding: 8pt 12pt 5pt; border: 1px solid #e3ddd2; border-radius: 8pt; background: #fff; }}
.scene h2 {{ margin: 0 0 8pt; font-size: 15pt; color: {st['titre']}; }}
.scene h2 b {{ color: {st['accent']}; font-size: 11pt; letter-spacing: 2pt; display: block; text-transform: uppercase; }}
.row {{ display: flex; align-items: flex-end; gap: 7pt; margin: 3pt 0; }}
.row.v {{ flex-direction: row-reverse; }}
.av {{ width: 26pt; height: 26pt; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 15pt; flex: none; }}
.row.c .av {{ background: {st['bulle_c']}; }}
.row.v .av {{ background: {st['accent']}; }}
.who {{ font-size: 9.5pt; font-weight: bold; letter-spacing: 1pt; text-transform: uppercase; margin-bottom: 1pt; }}
.row.c .who {{ color: #6b6b6b; }} .row.v .who {{ color: {st['accent']}; text-align: right; }}
.msg {{ max-width: 80%; }} .row.v .msg {{ display: flex; flex-direction: column; align-items: flex-end; }}
.bul {{ display: inline-block; padding: 6pt 12pt; border-radius: 12pt; line-height: 1.35; }}
.row.c .bul {{ background: {st['bulle_c']}; border-bottom-left-radius: 2pt; }}
.row.v .bul {{ background: {st['bulle_v']}; color: {st['texte_v']}; border-bottom-right-radius: 2pt; }}
.n {{ text-align: center; font-style: italic; color: #5f5f5f; font-size: 13pt; margin: 5pt 18pt; }}
.coche {{ border-top: 1px dashed #d8cfbf; margin-top: 8pt; padding-top: 5pt; font-size: 12.5pt; color: {st['titre']}; }}
.coche b {{ color: {st['accent']}; }}
.fin {{ break-inside: avoid; background: {st['bulle_c']}; border-radius: 8pt; padding: 12pt 14pt; font-size: 14.5pt; margin-top: 6pt; }}
.fin b {{ color: {st['titre']}; }}
.style {{ position: fixed; top: 0; right: 0; font-size: 8pt; color: #999; }}
"""
    out = [f'<div class="top"><div class="k">AVANT DE COMMENCER</div><h1>Ça t\'est déjà arrivé ?</h1><p>Lis ces conversations. Si tu te reconnais, coche la case. <b>Tu vas voir : ces scènes, tu les vis peut-être tous les jours.</b></p></div>',
           '<div class="bloc"><span>BLOC 1</span>Quand le client est devant toi</div>']
    for k, t, lines in SCENES:
        s = [f'<div class="scene"><h2><b>{k}</b>{H.escape(t)}</h2>']
        for who, txt in lines:
            if who == "N":
                s.append(f'<div class="n">{H.escape(txt)}</div>')
            else:
                cls, av, nm = {"C": ("c", "🧑🏾", "Client"), "F": ("c", "👩🏾", "Cliente"), "V": ("v", "🧕🏾", "Vendeuse")}[who]
                s.append(f'<div class="row {cls}"><div class="av">{av}</div><div class="msg"><div class="who">{nm}</div><div class="bul">{H.escape(txt)}</div></div></div>')
        s.append('<div class="coche">Ça t\'est déjà arrivé ? <b>☐ Oui</b> &nbsp; ☐ Non &nbsp;&nbsp; Combien de fois cette semaine ? ……</div></div>')
        out.append("".join(s))
    out.append('<div class="fin"><b>Tu as coché au moins une case ?</b> Alors tu n\'es pas seul : des milliers de vendeurs africains vivent ces scènes chaque jour. <b>Chacune a une explication, et presque chacune a une solution.</b> On les voit ensemble dans ce livre.</div>')
    return f'<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>{css}</style></head><body>{"".join(out)}</body></html>'

jobs = []
for key, st in STYLES.items():
    hp = os.path.join(ROOT, f"_bloc1-{key}.html")
    open(hp, "w", encoding="utf-8").write(page(st))
    jobs.append([hp, os.path.join(ROOT, f"maquette-bloc1-style-{key}.pdf")])
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();for(const [h,o] of %s){await p.goto('file://'+h);await p.pdf({path:o,format:'A4',printBackground:true,margin:{top:'16mm',bottom:'16mm',left:'17mm',right:'17mm'}});}await b.close();})();" % json.dumps(jobs)
jsp = os.path.join(ROOT, "_r.js"); open(jsp, "w").write(js)
subprocess.run(["node", jsp], check=True)
for h, _ in jobs: os.remove(h)
os.remove(jsp)
print("\n".join(o for _, o in jobs))
