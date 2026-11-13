"""Génère le logo et les reçus de « La Facture de l'Amour » en SVG.

Usage :
    python3 outils/marque.py                 # refait tout : logos + reçu modèle + reçus des vidéos
    python3 outils/marque.py recus/x.json    # refait seulement le reçu décrit dans ce fichier

Ensuite, pour avoir les PNG :
    node outils/rendu-png.js

Un reçu se décrit dans un petit fichier JSON (voir 06-marque/recus/*.json).
Pour une nouvelle vidéo : copie un JSON, change les lignes et le total, relance les 2 commandes.
"""
import json
import sys
from html import escape
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
MARQUE = RACINE / "06-marque"

# La charte (cahier des charges, section 4.2) : jamais d'autres couleurs.
BORDEAUX = "#7A1F2B"
CREME = "#F5EDE0"
OR = "#D4A017"
NOIR = "#1C1C1C"

POLICES = (
    "@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700"
    "&amp;family=Montserrat:wght@800&amp;family=Courier+Prime:wght@400;700&amp;display=swap');"
)
F_TITRE = "'Playfair Display', Georgia, serif"
F_SOUS = "'Montserrat', Arial, sans-serif"
F_RECU = "'Courier Prime', 'Courier New', monospace"


def coeur(cx, cy, taille, couleur):
    """Un cœur centré sur (cx, cy), de largeur `taille`."""
    s = taille / 100
    d = (
        "M50 88 C20 66 4 50 4 31 C4 16 15 6 29 6 C39 6 46 12 50 20 "
        "C54 12 61 6 71 6 C85 6 96 16 96 31 C96 50 80 66 50 88 Z"
    )
    return (
        f'<path d="{d}" fill="{couleur}" '
        f'transform="translate({cx - 50 * s:.1f} {cy - 47 * s:.1f}) scale({s:.4f})"/>'
    )


def ticket(x, y, l, h, dent=18, haut=True, bas=True):
    """Le contour d'un ticket de caisse : un rectangle aux bords haut et bas en dents de scie."""
    n = max(2, round(l / (dent * 2)))
    pas = l / n
    pts = [(x, y)]
    if haut:
        for i in range(n):
            pts += [(x + pas * (i + 0.5), y + dent), (x + pas * (i + 1), y)]
    else:
        pts.append((x + l, y))
    pts.append((x + l, y + h))
    if bas:
        for i in range(n):
            pts += [(x + l - pas * (i + 0.5), y + h - dent), (x + l - pas * (i + 1), y + h)]
    else:
        pts.append((x, y + h))
    return "M" + " L".join(f"{a:.1f} {b:.1f}" for a, b in pts) + " Z"


def svg(l, h, contenu, fond=None):
    rect = f'<rect width="{l}" height="{h}" fill="{fond}"/>' if fond else ""
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{l}" height="{h}" viewBox="0 0 {l} {h}">'
        f"<style>{POLICES}</style>{rect}{contenu}</svg>\n"
    )


def tampon(cx, cy, echelle=1.0, angle=-12):
    """Le tampon « PAYÉ AVEC AMOUR » (double cadre bordeaux, un peu transparent comme de l'encre)."""
    return (
        f'<g transform="translate({cx} {cy}) rotate({angle}) scale({echelle})" opacity="0.88">'
        f'<rect x="-330" y="-120" width="660" height="240" rx="26" fill="none" stroke="{BORDEAUX}" stroke-width="12"/>'
        f'<rect x="-306" y="-96" width="612" height="192" rx="16" fill="none" stroke="{BORDEAUX}" stroke-width="4"/>'
        f'<text x="0" y="12" text-anchor="middle" font-family="{F_SOUS}" font-weight="800" '
        f'font-size="118" letter-spacing="10" fill="{BORDEAUX}">PAYÉ</text>'
        f'<text x="0" y="74" text-anchor="middle" font-family="{F_SOUS}" font-weight="800" '
        f'font-size="40" letter-spacing="9" fill="{BORDEAUX}">AVEC AMOUR</text>'
        f"{coeur(-215, 60, 30, BORDEAUX)}{coeur(215, 60, 30, BORDEAUX)}"
        f"</g>"
    )


# ---------------------------------------------------------------- logos

def icone_groupe(cx, cy, r):
    """Le symbole : rond bordeaux + ticket crème penché + cœur bordeaux."""
    tl, th = r * 0.80, r * 1.12
    x, y = cx - tl / 2, cy - th / 2
    lignes = ""
    for i, frac in enumerate([0.16, 0.24]):
        ly = y + th * frac
        lignes += (
            f'<rect x="{x + tl * 0.18:.1f}" y="{ly:.1f}" width="{tl * (0.64 if i == 0 else 0.44):.1f}" '
            f'height="{r * 0.035:.1f}" rx="{r * 0.017:.1f}" fill="{NOIR}" opacity="0.28"/>'
        )
    ly = y + th * 0.80
    lignes += (
        f'<line x1="{x + tl * 0.14:.1f}" y1="{ly:.1f}" x2="{x + tl * 0.86:.1f}" y2="{ly:.1f}" '
        f'stroke="{NOIR}" stroke-opacity="0.35" stroke-width="{r * 0.018:.1f}" stroke-dasharray="{r * 0.04:.1f} {r * 0.03:.1f}"/>'
        f'<rect x="{x + tl * 0.50:.1f}" y="{ly + th * 0.035:.1f}" width="{tl * 0.36:.1f}" height="{r * 0.06:.1f}" '
        f'rx="{r * 0.02:.1f}" fill="{OR}"/>'
    )
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{BORDEAUX}"/>'
        f'<g transform="rotate(-7 {cx} {cy})">'
        f'<path d="{ticket(x, y, tl, th, dent=r * 0.055)}" fill="{CREME}"/>'
        f"{lignes}{coeur(cx, y + th * 0.52, tl * 0.56, BORDEAUX)}</g>"
    )


def logo_icone():
    return svg(1080, 1080, icone_groupe(540, 540, 540))


def logo_horizontal():
    # 1640 × 624 : la taille d'une couverture Facebook (820 × 312) en double résolution.
    l, h = 1640, 624
    dx = 105  # pour centrer l'ensemble (Facebook coupe les côtés sur téléphone)
    c = icone_groupe(330 + dx, h / 2, 200)
    c += (
        f'<text x="{580 + dx}" y="290" font-family="{F_TITRE}" font-weight="700" font-size="104" fill="{CREME}">La Facture</text>'
        f'<text x="{580 + dx}" y="400" font-family="{F_TITRE}" font-weight="700" font-size="104" fill="{CREME}">de l\'Amour</text>'
        f'<line x1="{584 + dx}" y1="448" x2="{1180 + dx}" y2="448" stroke="{OR}" stroke-width="4"/>'
        f'<text x="{584 + dx}" y="506" font-family="{F_RECU}" font-weight="700" font-size="40" fill="{OR}">'
        f"Jamais facturé. Toujours payé.</text>"
    )
    return svg(l, h, c, fond=NOIR)


# ---------------------------------------------------------------- reçus

def recu(cfg, avec_tampon=True):
    """Un reçu vertical 1080 × 1920 (format TikTok), à poser en fin de vidéo."""
    l, h = 1080, 1920
    lignes = cfg["lignes"]
    tx, tl = 130, 820
    pas = 92
    # hauteur du ticket = en-tête + lignes + total + zone du tampon
    th = 470 + pas * len(lignes) + 380 + 330
    haut = (h - th) / 2  # centré : le bas de l'écran TikTok est caché par la légende
    c = f'<path d="{ticket(tx, haut, tl, th, dent=20)}" fill="{CREME}"/>'
    g, d = tx + 70, tx + tl - 70
    y = haut + 120
    c += coeur(l / 2, y, 70, BORDEAUX)
    y += 90
    c += (
        f'<text x="{l / 2}" y="{y}" text-anchor="middle" font-family="{F_TITRE}" font-weight="700" '
        f'font-size="58" fill="{BORDEAUX}">La Facture de l\'Amour</text>'
    )
    y += 60
    c += (
        f'<text x="{l / 2}" y="{y}" text-anchor="middle" font-family="{F_RECU}" font-size="30" fill="{NOIR}">'
        f'{escape(cfg.get("titre", "REÇU"))}</text>'
    )
    y += 46
    c += (
        f'<text x="{g}" y="{y}" font-family="{F_RECU}" font-size="26" fill="{NOIR}" opacity="0.7">'
        f'N° {escape(cfg.get("numero", "0000"))}</text>'
        f'<text x="{d}" y="{y}" text-anchor="end" font-family="{F_RECU}" font-size="26" fill="{NOIR}" opacity="0.7">'
        f'{escape(cfg.get("date", ""))}</text>'
    )
    sep = lambda yy: (
        f'<line x1="{g}" y1="{yy}" x2="{d}" y2="{yy}" stroke="{NOIR}" stroke-width="3" '
        f'stroke-dasharray="14 10" opacity="0.55"/>'
    )
    y += 40
    c += sep(y)
    y += 30
    for ligne in lignes:
        y += pas
        c += (
            f'<text x="{g}" y="{y - 30}" font-family="{F_RECU}" font-weight="700" font-size="36" fill="{NOIR}">'
            f'{escape(ligne["libelle"])}</text>'
            f'<text x="{g}" y="{y + 8}" font-family="{F_RECU}" font-size="28" fill="{NOIR}" opacity="0.65">'
            f'{escape(ligne.get("detail", ""))}</text>'
            f'<text x="{d}" y="{y - 30}" text-anchor="end" font-family="{F_RECU}" font-weight="700" font-size="38" fill="{NOIR}">'
            f'{escape(ligne["montant"])}</text>'
        )
    y += 60
    c += sep(y)
    y += 80
    c += (
        f'<text x="{g}" y="{y}" font-family="{F_RECU}" font-weight="700" font-size="46" fill="{NOIR}">TOTAL</text>'
        f'<text x="{d}" y="{y}" text-anchor="end" font-family="{F_RECU}" font-weight="700" font-size="50" '
        f'fill="{BORDEAUX}">{escape(cfg["total"])}</text>'
    )
    y += 34
    c += f'<rect x="{g}" y="{y}" width="{d - g}" height="8" fill="{OR}"/>'
    y += 70
    c += (
        f'<text x="{l / 2}" y="{y}" text-anchor="middle" font-family="{F_RECU}" font-size="30" fill="{NOIR}">'
        f'Montant demandé : 0 FCFA</text>'
    )
    y += 90
    c += (
        f'<text x="{l / 2}" y="{y}" text-anchor="middle" font-family="{F_TITRE}" font-weight="700" '
        f'font-style="italic" font-size="44" fill="{BORDEAUX}">Jamais facturé. Toujours payé.</text>'
    )
    if avec_tampon:
        c += tampon(l / 2, y + 190, 0.85, angle=-8)
    return svg(l, h, c, fond=NOIR)


def carte_fin(cfg):
    """La dernière image de la vidéo : fond noir, logo, la question en or, la phrase signature."""
    l, h = 1080, 1920
    q = cfg.get("question", "Tu l'as déjà remercié(e) ?")
    c = icone_groupe(l / 2, 640, 170)
    c += (
        f'<text x="{l / 2}" y="1000" text-anchor="middle" font-family="{F_SOUS}" font-weight="800" '
        f'font-size="68" fill="{OR}">{escape(q)}</text>'
        f'<text x="{l / 2}" y="1110" text-anchor="middle" font-family="{F_RECU}" font-weight="700" '
        f'font-size="40" fill="{CREME}">Écris « PAYÉ ❤️ » en commentaire</text>'
        f'<text x="{l / 2}" y="1240" text-anchor="middle" font-family="{F_TITRE}" font-weight="700" '
        f'font-style="italic" font-size="48" fill="{CREME}" opacity="0.85">Jamais facturé. Toujours payé.</text>'
    )
    return svg(l, h, c, fond=NOIR)


def tampon_seul():
    """Le tampon sur fond transparent : à animer dans CapCut (il « tombe » sur le reçu)."""
    return svg(760, 420, tampon(380, 210, 1.0))


def ecrire(nom, contenu):
    p = MARQUE / nom
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(contenu, encoding="utf-8")
    print("écrit :", p.relative_to(RACINE))


def faire_recu(json_path):
    cfg = json.loads(Path(json_path).read_text(encoding="utf-8"))
    base = Path(json_path).with_suffix("").name
    ecrire(f"recus/{base}.svg", recu(cfg))
    ecrire(f"recus/{base}-sans-tampon.svg", recu(cfg, avec_tampon=False))
    ecrire(f"recus/{base}-fin.svg", carte_fin(cfg))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            faire_recu(f)
        sys.exit()
    ecrire("logo-icone.svg", logo_icone())
    ecrire("logo-horizontal.svg", logo_horizontal())
    ecrire("tampon-paye-avec-amour.svg", tampon_seul())
    modele = {
        "titre": "REÇU",
        "numero": "0000",
        "date": "JJ/MM/AAAA",
        "lignes": [
            {"libelle": "Ligne 1", "detail": "quantité × prix", "montant": "000 000 FCFA"},
            {"libelle": "Ligne 2", "detail": "quantité × prix", "montant": "000 000 FCFA"},
            {"libelle": "Ligne 3", "detail": "", "montant": "∞"},
        ],
        "total": "INESTIMABLE",
        "question": "Tu l'as déjà remercié(e) ?",
    }
    ecrire("recu-signature.svg", recu(modele))
    for f in sorted((MARQUE / "recus").glob("*.json")):
        faire_recu(f)
