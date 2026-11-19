"""Montage vidéo verticale 9:16 (TikTok / Facebook Reels) — Hyundai Kona 1.6 Turbo.
Usage : python3 montage_kona.py <dossier_images> <sortie.mp4>"""
import sys, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

IMG_DIR, OUT = sys.argv[1], sys.argv[2]
W, H, FPS = 1080, 1920, 30
FONT_B = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FONT_M = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
BLEU = (37, 99, 235)
JAUNE = (255, 214, 0)
BLANC = (255, 255, 255)
NUIT = (8, 18, 38)

PRIX = "8 500 $"

# (image, durée en s, lignes de texte, style)
# style : "hook" (haut, très gros), "label" (bandeau bas), "big" (bloc central), "end"
SCENES = [
    (7, 3.0, ["HYUNDAI KONA 1.6 TURBO", PRIX, "TOUT COMPRIS · CLÉS EN MAIN À CONAKRY"], "hook"),
    (3, 1.4, ["2017/2018 · Essence"], "label"),
    (9, 1.4, ["Seulement 82 631 km"], "label"),
    (10, 1.4, ["Moteur 1.6 Turbo · Boîte automatique"], "label"),
    (16, 1.4, ["Feux LED · Jantes alliage 18 pouces"], "label"),
    (2, 1.2, ["Sélectionnée en Corée du Sud"], "label"),
    (30, 1.8, ["Intérieur cuir noir"], "label"),
    (24, 1.5, ["82 631 km au compteur"], "label"),
    (20, 1.5, ["Écran tactile · GPS · Bluetooth"], "label"),
    (25, 1.5, ["Caméra de recul + radars"], "label"),
    (26, 1.5, ["Affichage tête haute", "Alerte angles morts"], "label"),
    (17, 1.6, ["Sièges chauffants ET ventilés", "Volant chauffant"], "label"),
    (23, 1.3, ["Régulateur de vitesse"], "label"),
    (21, 1.5, ["2 clés intelligentes", "Démarrage sans clé"], "label"),
    (32, 1.3, ["Sièges électriques en cuir"], "label"),
    (31, 1.3, ["Banquette arrière en cuir"], "label"),
    (27, 1.3, ["Grand coffre · Banquette rabattable"], "label"),
    (14, 2.0, ["Numéro de châssis vérifié", "en vidéo avant tout paiement"], "label"),
    (35, 2.6, [PRIX, "TOUT COMPRIS", "Achat + transport + douane", "Clés en main à Conakry"], "big"),
    (8, 3.6, ["PAYEZ EN 2 FOIS", "50 % à la commande", "50 % quand elle est sur le bateau"], "big"),
    (7, 4.2, ["PASSEZ VOTRE COMMANDE", "sur WhatsApp · lien en bio", "KBA", "Une voiture de Corée chaque soir à 19 h", "Abonnez-vous"], "end"),
]

def font(path, size):
    return ImageFont.truetype(path, size)

def cover(im, w, h):
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))

def prepare(num):
    im = Image.open(f"{IMG_DIR}/{num}.jpg").convert("RGB")
    portrait = im.height > im.width
    if portrait:
        base = cover(im, int(W * 1.1), int(H * 1.1))
        return {"portrait": True, "base": base}
    fond = cover(im, W, H).filter(ImageFilter.GaussianBlur(40))
    fond = ImageEnhance.Brightness(fond).enhance(0.45)
    fw = int(W * 1.12)
    fg = im.resize((fw, round(im.height * fw / im.width)), Image.LANCZOS)
    return {"portrait": False, "fond": fond, "fg": fg}

def image_frame(p, t, cy=760):  # t de 0 à 1 dans la scène : léger zoom (Ken Burns)
    z = 1.0 + 0.07 * t
    if p["portrait"]:
        b = p["base"]
        cw, ch = round(b.width / z / 1.1 * 1.0), round(b.height / z / 1.1 * 1.0)
        x, y = (b.width - cw) // 2, (b.height - ch) // 2
        return b.crop((x, y, x + cw, y + ch)).resize((W, H), Image.BILINEAR)
    fr = p["fond"].copy()
    fg = p["fg"]
    cw, ch = round(W / z), round(W / z * fg.height / fg.width)
    x, y = (fg.width - cw) // 2, (fg.height - ch) // 2
    crop = fg.crop((x, y, x + cw, y + ch)).resize((W, round(W * fg.height / fg.width)), Image.BILINEAR)
    fr.paste(crop, (0, cy - crop.height // 2))
    return fr

def ease(a):
    a = max(0.0, min(1.0, a))
    return 1 - (1 - a) ** 3

def texte_centre(d, y, txt, f, fill, alpha=255):
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2, y), txt, font=f, fill=fill + (alpha,))

def pill(d, y, txt, f, bg, fg, alpha, pad=(36, 18)):
    w = d.textlength(txt, font=f)
    asc, desc = f.getmetrics()
    h = asc + desc
    x0 = (W - w) / 2 - pad[0]
    d.rounded_rectangle((x0, y, x0 + w + 2 * pad[0], y + h + 2 * pad[1]), radius=22, fill=bg + (alpha,))
    d.text((x0 + pad[0], y + pad[1]), txt, font=f, fill=fg + (alpha,))
    return h + 2 * pad[1]

def calque_texte(lignes, style, t_s):
    calque = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(calque)
    a = ease(t_s / 0.35)
    alpha = int(255 * a)
    dy = int((1 - a) * 60)
    if style == "hook":
        g = Image.new("RGBA", (W, 760), (0, 0, 0, 0))
        gd = ImageDraw.Draw(g)
        for i in range(760):
            gd.line((0, i, W, i), fill=(0, 0, 0, int(200 * (1 - i / 760))))
        calque.alpha_composite(g)
        texte_centre(d, 190 + dy, lignes[0], font(FONT_B, 66), BLANC, alpha)
        a2 = int(255 * ease((t_s - 0.25) / 0.35))
        texte_centre(d, 280 + dy, lignes[1], font(FONT_B, 210), JAUNE, a2)
        a3 = int(255 * ease((t_s - 0.5) / 0.35))
        pill(d, 545, lignes[2], font(FONT_B, 40), BLEU, BLANC, a3)
    elif style == "label":
        y = 1250 + dy
        for i, l in enumerate(lignes):
            f = font(FONT_B, 54 if i == 0 else 46)
            ai = int(255 * ease((t_s - 0.12 * i) / 0.3))
            y += pill(d, y, l, f, NUIT if i else BLEU, BLANC, ai) + 18
    elif style in ("big", "end"):
        voile = Image.new("RGBA", (W, H), (5, 12, 28, int(170 * a)))
        calque.alpha_composite(voile)
        if style == "big":
            tailles = [150, 84, 50, 50] if len(lignes) == 4 else [96, 58, 58]
            couleurs = [JAUNE, BLANC, BLANC, BLANC]
            y = 640 if len(lignes) == 4 else 700
        else:
            tailles = [64, 48, 120, 40, 52]
            couleurs = [BLANC, JAUNE, BLANC, BLANC, JAUNE]
            y = 560
        for i, l in enumerate(lignes):
            ai = int(255 * ease((t_s - 0.18 * i) / 0.35))
            f = font(FONT_B if i in (0, 1, 2) else FONT_M, tailles[i])
            if style == "end" and i == 2:
                y += 40
                pill(d, y + dy, l, f, BLEU, BLANC, ai, pad=(60, 20))
                y += f.getmetrics()[0] + f.getmetrics()[1] + 40 + 50
                continue
            if style == "big" and len(lignes) == 3 and i == 0:
                pill(d, y + dy, l, f, BLEU, BLANC, ai, pad=(50, 24))
                y += f.getmetrics()[0] + f.getmetrics()[1] + 48 + 40
                continue
            texte_centre(d, y + dy, l, f, couleurs[i], ai)
            y += int(tailles[i] * 1.35)
    # signature discrète
    d.text((40, 120), "KBA", font=font(FONT_B, 44), fill=BLANC + (200,))
    return calque

ff = subprocess.Popen([
    "ffmpeg", "-y", "-loglevel", "error",
    "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
    "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
    "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)

FONDU = 6  # images de fondu entre deux scènes
precedente = None
for num, duree, lignes, style in SCENES:
    p = prepare(num)
    n = int(duree * FPS)
    for k in range(n):
        fr = image_frame(p, k / n, 1060 if style == "hook" else 760).convert("RGBA")
        fr.alpha_composite(calque_texte(lignes, style, k / FPS))
        fr = fr.convert("RGB")
        if precedente is not None and k < FONDU:
            fr = Image.blend(precedente, fr, (k + 1) / (FONDU + 1))
        ff.stdin.write(fr.tobytes())
        derniere = fr
    precedente = derniere
ff.stdin.close()
ff.wait()
print("OK", OUT)
