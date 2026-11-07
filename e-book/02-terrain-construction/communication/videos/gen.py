"""Génère videoN.html (motion design) pour les 6 vidéos du livre 2, à partir des temps des phrases (align.py).
Usage : python3 gen.py N   (N = 1..6)"""
import sys, json, subprocess, html
N = sys.argv[1]
D = __import__('os').path.dirname(__import__('os').path.abspath(__file__))
P = json.load(open(f'{D}/phrases.json'))[N]
out = subprocess.run(['python3', f'{D}/align.py', f'{D}/voix/T{N}.mp3', f'{D}/voix/T{N}.txt'], capture_output=True, text=True).stdout
T = [(float(l.split()[0]), float(l.split()[1])) for l in out.strip().splitlines()]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f'{D}/voix/T{N}.mp3'], capture_output=True, text=True).stdout)
s = lambda i: T[i][0]
e = lambda i: T[i][1]

SPEC = {
 '1': dict(hook=[(0, 'img2.jpg', [[("Ta famille t'envoie", ''), ('des photos.', '')], [('Mais de quel', 'o'), ('chantier ?', 'o')]])],
           title=2, prob=[3, 4], probtxt=[[('Une photo', ''), ('ne prouve rien.', 'r')], [('Où ?', 'o'), ('Quand ?', 'o')]],
           sol=[5, 6], pages=['page-184.png', 'page-185.png'], chips=[(6, ['Vidéo en direct', 'La borne du terrain', 'Les factures', 'Un contrôleur'])],
           extra=(7, 'kits'), price=8),
 '2': dict(hook=[(0, 'img6.jpg', [[('Aime ta famille.', '')], [('Mais paie par étapes,', 'o'), ('contre preuves.', 'o')]])],
           title=2, prob=[3, 4], probtxt=[[('Le plus grand risque', '')], [("L'argent envoyé de loin,", ''), ('sans contrôle.', 'r')]],
           sol=[5, 6, 7], pages=['page-112.png'], chips=[(6, ["L'argent", 'Les papiers', 'Le chantier']), (7, ['1 étape = 1 preuve'])],
           extra=(8, 'k2a-05.png'), price=9),
 '3': dict(hook=[(0, 'img5.jpg', [[('Même terrain,', ''), ('deux acheteurs ?', 'o')], [('Vérifie avant de payer.', '')]])],
           title=2, prob=[3, 4], probtxt=[[('Vendu', ''), ('deux fois.', 'r')], [('Un reçu ne prouve pas', ''), ('la propriété.', 'r')]],
           sol=[5, 6], pages=['page-55.png', 'page-56.png'], chips=[(5, ['12 vérifications']), (6, ['Bureau foncier', 'Ton notaire', 'Ton géomètre', 'Les voisins'])],
           extra=(7, 'pays'), price=8),
 '4': dict(hook=[(0, 'img3.jpg', [[('Le papier du quartier', ''), ('ne fait pas de toi', ''), ('le propriétaire.', 'o')]])],
           title=1, prob=[2, 3], probtxt=[[('Reçu ?', ''), ('Attestation ?', ''), ("Lettre d'attribution ?", '')], [('Tous les papiers', ''), ('ne se valent pas.', 'r')]],
           sol=[4, 5], pages=['page-40.png', 'page-10.png'], chips=[(4, ['Du plus faible…', '… au titre à ton nom', 'Pays par pays']), (5, ['Le bon papier à exiger'])],
           extra=(6, 'page-6.png'), price=7),
 '5': dict(hook=[(0, 'img7.jpg', [[('Le maçon veut', ''), ('une grosse avance ?', 'o')], [('Écoute ça d\'abord.', '')]])],
           title=2, prob=[3], probtxt=[[('Grosse avance =', ''), ('plus aucun moyen', 'r'), ('de pression.', 'r')]],
           sol=[4, 5], pages=['page-182.png', 'page-174.png', 'k2b-07.png'], chips=[(4, ['Payer par étapes', '1 étape = 1 preuve']), (5, ['Vérifier le fer', 'Contrat avec le maçon'])],
           extra=(6, 'img9.jpg'), price=7),
 '6': dict(hook=[(0, 'img1.jpg', [[('Tu achètes un terrain', ''), ('bientôt ?', 'o')], [('Prends 10 minutes', 'o'), ('avant.', 'o')]])],
           title=2, prob=[3], probtxt=[[('Payer d\'abord,', ''), ('vérifier après :', ''), ("l'erreur la plus chère.", 'r')]],
           sol=[4, 5, 6], pages=['page-8.png', 'page-9.png'], chips=[(5, ["3 règles d'or", 'Le bon papier', "10 phrases d'alerte"]), (6, ['Puis tout le détail'])],
           extra=(7, 'kits'), price=8),
}[N]

el = []
A = lambda tin, tout, a, style, inner, cls='': el.append(f'<div class="{cls}" data-in="{tin:.2f}" data-out="{tout:.2f}" data-a="{a}" style="{style}">{inner}</div>')

# 1) Accroche : image plein écran + lignes de texte
t_title = s(SPEC['title'])
img = SPEC['hook'][0][1]
el.append(f'<img data-in="0" data-out="{t_title:.2f}" data-a="kb" src="assets/{img}" style="left:0;top:0;width:1080px;height:960px;object-fit:cover">')
A(0, t_title, 'fade', 'left:0;top:700px;width:1080px;height:262px;background:linear-gradient(transparent,#0f2a44)', '')
groups = SPEC['hook'][0][2]
y = 1010
for gi, g in enumerate(groups):
    tin = s(gi) if gi < len(groups) else 0
    if len(groups) == 1: tin = 0
    for li, (txt, col) in enumerate(g):
        fs = 100 if len(txt) <= 16 else (86 if len(txt) <= 22 else 72)
        A(tin + li * 0.25, t_title, 'slam' if li == 0 and gi == 0 else 'rise', f'top:{y}px;font-size:{fs}px', html.escape(txt), f'c A {col}')
        y += fs + 14
    y += 20

# 2) Le livre
t_prob = s(SPEC['prob'][0])
el.append(f'<img data-in="{t_title:.2f}" data-out="{t_prob:.2f}" data-a="zoom" src="assets/cover.jpg" style="left:290px;top:250px;width:500px;border-radius:12px;box-shadow:0 40px 100px rgba(0,0,0,.6)">')
A(t_title + 0.3, t_prob, 'rise', 'top:1040px;font-size:62px', 'Le guide pas à pas', 'c A o')
A(t_title + 0.7, t_prob, 'rise', 'top:1130px;font-size:42px;font-weight:700', 'Livre + 4 kits · 7 pays · résumé de 10 min', 'c P')

# 3) Le problème
t_sol = s(SPEC['sol'][0])
for k, pi in enumerate(SPEC['prob']):
    tin = s(pi); tout = s(SPEC['prob'][k + 1]) if k + 1 < len(SPEC['prob']) else t_sol
    lines = SPEC['probtxt'][k]; y = 520 if len(lines) > 2 else 600
    for li, (txt, col) in enumerate(lines):
        fs = 130 if len(txt) <= 10 else (104 if len(txt) <= 18 else 84)
        A(tin + li * 0.35, tout, 'slam' if col == 'r' else 'rise', f'top:{y}px;font-size:{fs}px', html.escape(txt), f'c A {col}')
        y += fs + 30
    if k == 0:
        A(tin, tout, 'grow', f'top:{y + 30}px;left:-40px;right:-40px;height:46px', '', 'tape')

# 4) La solution : téléphone qui fait défiler les pages + étiquettes
t_ext = s(SPEC['extra'][0])
pages = ''.join(f'<img src="assets/{p}" alt="">' for p in SPEC['pages'])
shift = max(0, round(524 * 1739 / 978) * len(SPEC['pages']) - 1004)
A(t_sol, t_ext, 'rise', 'left:470px;top:300px', f'<div class="phone"><div class="scr"><div data-in="{t_sol:.2f}" data-out="{t_ext:.2f}" data-a="fade" data-y0="0" data-y1="-{shift}" data-ys="{t_sol + 1.2:.2f}" data-yd="{max(t_ext - t_sol - 1.6, 1):.2f}" style="position:absolute;left:0;top:0;width:100%">{pages}</div></div></div>')
A(t_sol, t_ext, 'rise', 'top:150px;font-size:76px', 'Le guide te montre', 'c A')
cy = 360
for (pi, labels) in SPEC['chips']:
    a0, b0 = s(pi), e(pi)
    for j, lab in enumerate(labels):
        tin = a0 + (b0 - a0) * j / max(len(labels), 1)
        A(tin, t_ext, 'left', f'left:50px;top:{cy}px;max-width:430px', html.escape(lab), 'chip')
        cy += 175

# 5) Le bonus de fin (kits, pays, page ou image)
t_price = s(SPEC['price'])
x = SPEC['extra'][1]
if x == 'kits':
    for j, k in enumerate([1, 2, 3, 4]):
        el.append(f'<img data-in="{t_ext + j * .2:.2f}" data-out="{t_price:.2f}" data-a="pop" src="assets/kitc{k}-01.png" style="left:{70 + j * 240}px;top:{560 + (j % 2) * 60}px;width:220px;border-radius:10px;box-shadow:0 20px 50px rgba(0,0,0,.5)">')
    A(t_ext, t_price, 'rise', 'top:300px;font-size:84px', '4 kits prêts à remplir', 'c A o')
    A(t_ext + .4, t_price, 'rise', 'top:1060px;font-size:46px;font-weight:700', 'Checklists · Modèles · Calculs · Carnets', 'c P')
elif x == 'pays':
    A(t_ext, t_price, 'rise', 'top:330px;font-size:96px', '7 fiches pays', 'c A o')
    for j, p in enumerate(['Guinée', "Côte d'Ivoire", 'Sénégal', 'Cameroun', 'Bénin', 'Gabon', 'Togo']):
        A(t_ext + .15 * j, t_price, 'pop', f'left:{90 + (j % 2) * 460}px;top:{520 + (j // 2) * 150}px;width:440px;text-align:center', p, 'chip o')
elif x.startswith('img'):
    el.append(f'<img data-in="{t_ext:.2f}" data-out="{t_price:.2f}" data-a="kb" src="assets/{x}" style="left:0;top:300px;width:1080px;height:860px;object-fit:cover">')
    A(t_ext + .3, t_price, 'rise', 'top:1200px;font-size:96px', 'Finis ta maison.', 'c A o')
else:
    A(t_ext, t_price, 'rise', 'left:300px;top:260px', f'<div class="card"><img src="assets/{x}" alt=""></div>')

# 6) Le prix et le bouton
A(t_price - .2, 99, 'zoom', 'left:380px;top:170px', '<img src="assets/cover.jpg" style="width:320px;border-radius:10px;box-shadow:0 30px 80px rgba(0,0,0,.6)">')
A(t_price, 99, 'slam', 'top:660px;font-size:210px', '12 900 F', 'c A o')
A(t_price + .3, 99, 'rise', 'top:900px;font-size:56px;font-weight:800', 'Livre + 4 kits', 'c P')
A(t_price + .6, 99, 'fade', 'top:1000px', '<span>Mobile money · Carte bancaire</span>', 'mm')
A(t_price + .8, 99, 'fade', 'top:1080px;font-size:34px;color:#a9b6c4', 'Versions ordinateur et téléphone', 'c P')
A(s(SPEC['price'] + 1), 99, 'pop', 'top:1170px', 'Commander maintenant', 'btn')

caps = []
nhook = SPEC['title']
for i, txt in enumerate(P):
    if i < nhook: continue
    t = txt.replace('Douze mille neuf cents francs', '12 900 francs').replace('douze vérifications', '12 vérifications').replace('sept pays', '7 pays').replace('dix minutes', '10 minutes').replace('trois clés', '3 clés').replace('trois règles', '3 règles').replace('dix phrases', '10 phrases').replace('Commander maintenant', '« Commander maintenant »')
    caps.append(['body', T[i][0], T[i][1], t])

HTML = f'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face {{ font-family: "Anton"; src: url(assets/anton.woff2) format("woff2"); }}
@font-face {{ font-family: "Pop"; src: url(assets/pop-800.woff2) format("woff2"); font-weight: 800; }}
@font-face {{ font-family: "Pop"; src: url(assets/pop-700.woff2) format("woff2"); font-weight: 700; }}
:root {{ --bg:#0f2a44; --o:#ff8a3a; --r:#ff5a4f; --w:#f7f3ec; --m:#a9b6c4; }}
* {{ box-sizing:border-box; margin:0; padding:0; }}
html,body {{ width:1080px; height:1920px; overflow:hidden; background:var(--bg); color:var(--w); font-family:"Pop",sans-serif; }}
.bg {{ position:absolute; inset:0; background: radial-gradient(70% 45% at 50% 35%, #1d4268 0%, transparent 70%),
  radial-gradient(circle, rgba(255,138,58,.10) 0 3px, transparent 4px) 0 0/60px 60px, var(--bg); }}
section {{ position:absolute; inset:0; }}
[data-in] {{ position:absolute; will-change:transform,opacity; }}
.A {{ font-family:"Anton"; text-transform:uppercase; letter-spacing:1px; line-height:1; }}
.o {{ color:var(--o); }} .r {{ color:var(--r); }}
.c {{ left:0; right:0; text-align:center; padding:0 40px; }}
.P {{ color:var(--w); }}
.tape {{ height:46px; background:repeating-linear-gradient(135deg,var(--o) 0 40px,#0f2a44 40px 80px); transform-origin:left; }}
.chip {{ font-family:"Anton"; font-size:46px; line-height:1.1; padding:16px 26px; border-radius:14px; background:var(--o); color:#10223a; }}
.chip.o {{ background:transparent; color:var(--w); border:4px solid rgba(255,255,255,.45); font-size:56px; }}
.phone {{ width:560px; height:1040px; border-radius:60px; background:#050608; padding:18px; box-shadow:0 0 0 4px #2a3a4e,0 50px 120px rgba(0,0,0,.6); overflow:hidden; }}
.phone .scr {{ width:100%; height:100%; border-radius:44px; overflow:hidden; background:#fffdf8; position:relative; }}
.phone .scr img {{ width:100%; display:block; }}
.card {{ width:480px; border-radius:16px; overflow:hidden; box-shadow:0 40px 100px rgba(0,0,0,.6); }} .card img {{ width:100%; display:block; }}
.btn {{ left:90px; right:90px; height:150px; border-radius:24px; background:var(--o); color:#10223a; font-family:"Anton"; font-size:84px; letter-spacing:2px; display:flex; align-items:center; justify-content:center; text-transform:uppercase; }}
.mm {{ left:0; right:0; text-align:center; font-size:38px; font-weight:700; }}
.mm span {{ background:rgba(255,255,255,.1); border:2px solid rgba(255,255,255,.3); padding:10px 28px; border-radius:40px; }}
#cap {{ position:absolute; left:60px; right:60px; bottom:200px; text-align:center; }}
#cap span {{ display:inline; font-size:48px; font-weight:800; line-height:1.4; background:rgba(0,0,0,.72); color:#fff; padding:6px 18px; border-radius:10px; -webkit-box-decoration-break:clone; box-decoration-break:clone; }}
</style></head><body><div class="bg"></div>
<section data-part="body">
{chr(10).join(el)}
</section>
<div id="cap"></div>
<script>window.CAPS = {json.dumps(caps, ensure_ascii=False)};</script>
<script src="engine.js"></script></body></html>'''
open(f'{D}/video{N}.html', 'w').write(HTML)
json.dump({'dur': dur, 'trans': [t_title, t_prob, t_sol, t_ext, t_price], 'prix': t_price}, open(f'{D}/meta{N}.json', 'w'))
print('ok', N, round(dur, 2))
