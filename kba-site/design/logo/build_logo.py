"""Construit le logo KBA (piste n°7) en SVG vectoriel, avec les lettres converties en tracés.
Polices : Montserrat (OFL) 800 pour KBA, 600 pour la signature."""
import sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen

FONT_DIR = sys.argv[1]
heavy = TTFont(f"{FONT_DIR}/montserrat-latin-900-normal.woff")
semi = TTFont(f"{FONT_DIR}/montserrat-latin-600-normal.woff")

def text_path(font, text, size, x, y, tracking=0.0):
    """Renvoie (d, largeur) : le tracé SVG du texte, ligne de base en y."""
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    upm = font["head"].unitsPerEm; s = size / upm
    pen = SVGPathPen(gs); cx = 0.0
    for ch in text:
        g = cmap[ord(ch)]
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x + cx, y)))
        cx += hmtx[g][0] * s + tracking
    return pen.getCommands(), cx - tracking

def bounds(font, text, size, tracking=0.0):
    gs, cmap, hmtx = font.getGlyphSet(), font.getBestCmap(), font["hmtx"]
    s = size / font["head"].unitsPerEm; bp = BoundsPen(gs); cx = 0.0
    for ch in text:
        g = cmap[ord(ch)]; gs[g].draw(TransformPen(bp, (s, 0, 0, -s, cx, 0))); cx += hmtx[g][0] * s + tracking
    return bp.bounds  # xmin, ymin, xmax, ymax (y vers le bas)

NAVY, BLUE, BLUE2, SILVER, SILVER2 = "#0B1F3A", "#1E5BD8", "#5B93FF", "#8E99A8", "#E3E8EF"

def defs(uid):
    return f'''<defs>
  <linearGradient id="{uid}-b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{BLUE2}"/><stop offset="1" stop-color="{BLUE}"/></linearGradient>
  <linearGradient id="{uid}-s" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{SILVER2}"/><stop offset="1" stop-color="{SILVER}"/></linearGradient>
</defs>'''

def mark(ink, uid, ox=0, oy=0, sub=True, sub_ink=None):
    """Le logo complet dans une boîte 600 x 330 (avec signature) ou 600 x 260."""
    size = 150; tr = -2
    xmin, ymin, xmax, ymax = bounds(heavy, "KBA", size, tr)
    w = xmax - xmin; x0 = ox + 300 - w / 2 - xmin; base = oy + 205
    d, _ = text_path(heavy, "KBA", size, x0, base, tr)
    # coupe bleue sur la jambe droite du A (comme la piste 7)
    # origine du A = x0 + avances de K et B ; coordonnées du glyphe A (unités 1000)
    hm = heavy["hmtx"]; cm = heavy.getBestCmap(); k = size / 1000
    ax = x0 + (hm[cm[ord("K")]][0] + hm[cm[ord("B")]][0]) * k + 2 * tr
    P = lambda u, v: f"{ax + u * k:.1f} {base - v * k:.1f}"
    h = 190  # hauteur de la facette bleue sur la jambe droite du A
    cut = f'<path d="M{P(581, 0)} L{P(825, 0)} L{P(825 - 0.437 * h, h)} L{P(581 - 0.3836 * h, h)} Z" fill="{BLUE}"/>'
    # orbite : arc bleu en haut à droite, arc argent en bas à gauche
    cx, cy, rx, ry = ox + 300, oy + 150, 250, 118
    top = f'<path d="M{cx-150:.0f} {cy-ry+18:.0f} C {cx-40:.0f} {cy-ry-40:.0f}, {cx+rx+40:.0f} {cy-ry-10:.0f}, {cx+rx-6:.0f} {cy+12:.0f} C {cx+rx-24:.0f} {cy-60:.0f}, {cx+40:.0f} {cy-ry-14:.0f}, {cx-150:.0f} {cy-ry+18:.0f} Z" fill="url(#{uid}-b)"/>'
    bot = f'<path d="M{cx+120:.0f} {cy+ry-6:.0f} C {cx+10:.0f} {cy+ry+40:.0f}, {cx-rx-40:.0f} {cy+ry+6:.0f}, {cx-rx+8:.0f} {cy+6:.0f} C {cx-rx+26:.0f} {cy+70:.0f}, {cx-20:.0f} {cy+ry+14:.0f}, {cx+120:.0f} {cy+ry-6:.0f} Z" fill="url(#{uid}-s)"/>'
    out = [top, f'<path d="{d}" fill="{ink}"/>', cut, bot]
    if sub:
        st = 9.5; sz = 24
        b2 = bounds(semi, "KOREA BUSINESS AUTO", sz, st); w2 = b2[2] - b2[0]
        d2, _ = text_path(semi, "KOREA BUSINESS AUTO", sz, ox + 300 - w2 / 2 - b2[0], oy + 318, st)
        out.append(f'<path d="{d2}" fill="{sub_ink or ink}"/>')
    return "\n".join(out)

def svg(w, h, body, uid, bg=None):
    rect = f'<rect width="{w}" height="{h}" fill="{bg}"/>' if bg else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">{defs(uid)}{rect}{body}</svg>\n'

open("kba-logo-sombre.svg", "w").write(svg(600, 350, mark("#FFFFFF", "d"), "d"))
open("kba-logo-clair.svg", "w").write(svg(600, 350, mark(NAVY, "c"), "c"))
open("kba-logo-sombre-fond.svg", "w").write(svg(600, 350, mark("#FFFFFF", "f"), "f", NAVY))
open("kba-symbole-sombre.svg", "w").write(svg(600, 290, mark("#FFFFFF", "y", sub=False), "y"))
open("kba-symbole-clair.svg", "w").write(svg(600, 290, mark(NAVY, "z", sub=False), "z"))

# Icône carrée (favicon, profils) : fond bleu nuit, symbole sans signature, réduit et centré
inner = mark("#FFFFFF", "i", sub=False)
icon = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs("i")}<rect width="512" height="512" rx="112" fill="{NAVY}"/><g transform="translate(36 116) scale(0.73)">{inner}</g></svg>\n'
open("kba-icone.svg", "w").write(icon)
dk, _ = text_path(heavy, "K", 330, 0, 0)
kb = bounds(heavy, "K", 330); kx = 256 - (kb[0] + kb[2]) / 2; ky = 256 - (kb[1] + kb[3]) / 2
dk, _ = text_path(heavy, "K", 330, kx, ky)
fav = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">{defs("v")}<rect width="512" height="512" rx="112" fill="{NAVY}"/><path d="M96 150 C 190 70, 400 70, 450 230 C 400 125, 230 105, 96 150 Z" fill="url(#v-b)"/><path d="{dk}" fill="#FFFFFF"/><path d="M416 362 C 330 450, 140 450, 70 330 C 150 405, 300 420, 416 362 Z" fill="url(#v-s)"/></svg>\n'''
open("kba-favicon.svg", "w").write(fav)
print("ok")
