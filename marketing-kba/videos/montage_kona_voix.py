"""Vidéo 9:16 Hyundai Kona calée sur la voix off ElevenLabs : sous-titres mot à mot,
musique de fond et effets sonores générés (libres de droits), mixage voix en avant."""
import sys, subprocess, wave, math, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

IMG = sys.argv[1]
VOIX = "audio/voix_kona.mp3"
OUT = "KBA_Kona_2017_8500_voix.mp4"
W, H, FPS = 1080, 1920, 30
SR = 44100
FB = "/usr/share/fonts/opentype/inter/Inter-ExtraBold.otf"
FM = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
BLEU, JAUNE, BLANC, NUIT = (37, 99, 235), (255, 214, 0), (255, 255, 255), (8, 18, 38)

# --- Phrases de la voix off, calées sur les silences détectés dans le MP3 (début, fin en s)
# Chaque mot : (texte affiché, poids ≈ longueur prononcée)
def m(s, w=None):
    return (s, w if w is not None else len(s))
CHUNKS = [
    (0.00, 1.28, [m("Hyundai"), m("Kona"), m("Turbo.")]),
    (1.64, 3.77, [m("8 500 $,", 22), m("tout"), m("compris !")]),
    (4.06, 8.43, [m("2017-2018,", 34), m("essence,"), m("moins"), m("de"), m("83 000", 22), m("kilomètres.")]),
    (8.78, 11.47, [m("Turbo,"), m("boîte"), m("automatique,"), m("jantes"), m("18", 8), m("pouces.")]),
    (11.77, 17.74, [m("Intérieur"), m("cuir,"), m("GPS,", 7), m("caméra"), m("de"), m("recul,"), m("affichage"),
                    m("tête"), m("haute,"), m("sièges"), m("ventilés"), m("pour"), m("la"), m("chaleur"), m("de"), m("Conakry…")]),
    (18.13, 19.43, [m("et"), m("deux"), m("clés"), m("intelligentes.")]),
    (19.75, 21.91, [m("Châssis"), m("vérifié"), m("en"), m("vidéo"), m("avant"), m("tout"), m("paiement.")]),
    (22.29, 23.86, [m("Achat,"), m("transport,"), m("douane :")]),
    (24.08, 24.68, [m("tout"), m("est"), m("compris.")]),
    (24.96, 29.00, [m("50 %", 16), m("à"), m("la"), m("commande,"), m("le"), m("reste"), m("quand"), m("elle"),
                    m("est"), m("sur"), m("le"), m("bateau.")]),
    (29.34, 30.85, [m("Passez"), m("votre"), m("commande"), m("sur"), m("WhatsApp,")]),
    (31.04, 31.64, [m("lien"), m("en"), m("bio.")]),
    (31.99, 32.52, [m("Abonnez-vous :")]),
    (32.78, 34.87, [m("une"), m("voiture"), m("chaque"), m("soir"), m("à"), m("19 h !", 14)]),
]
DUREE = 36.6

# timings mot à mot (répartis selon la longueur prononcée)
MOTS = []
for d, f, mots in CHUNKS:
    tot = sum(w + 2 for _, w in mots)
    t = d
    for txt, w in mots:
        dt = (f - d) * (w + 2) / tot
        MOTS.append([txt, t, t + dt])
        t += dt
# groupes de sous-titres (≤ 3 mots, ≤ 20 caractères), sans traverser une pause
GROUPES = []
i = 0
for d, f, mots in CHUNKS:
    n = len(mots)
    idx = list(range(i, i + n))
    cur = []
    for j in idx:
        if cur and (len(cur) >= 3 or len(" ".join(MOTS[k][0] for k in cur + [j])) > 20):
            GROUPES.append(cur)
            cur = []
        cur.append(j)
    GROUPES.append(cur)
    i += n

def t_mot(prefixe, rang=0):
    """Début du n-ième mot commençant par prefixe."""
    r = [w[1] for w in MOTS if w[0].startswith(prefixe)]
    return r[rang]

# --- Plans : (image, début) ; chaque plan dure jusqu'au suivant
PLANS = [
    (7, 0.0),
    (3, 4.06), (9, t_mot("essence")), (24, t_mot("moins")),
    (8, 8.78), (17, t_mot("boîte")), (16, t_mot("jantes")),
    (30, 11.77), (20, t_mot("GPS")), (25, t_mot("caméra")), (37, t_mot("affichage")), (32, t_mot("sièges")),
    (21, 18.13), (14, 19.75), (35, 22.29), (2, 24.96), (7, 29.34),
]
DEBUTS = [p[1] for p in PLANS] + [DUREE]

def F(path, size, _c={}):
    k = (path, size)
    if k not in _c:
        _c[k] = ImageFont.truetype(path, size)
    return _c[k]

def cover(im, w, h):
    r = max(w / im.width, h / im.height)
    im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2
    return im.crop((x, y, x + w, y + h))

def prepare(num, fin=False):
    im = Image.open(f"{IMG}/{num}.jpg").convert("RGB")
    if im.height > im.width:
        return {"portrait": True, "base": cover(im, int(W * 1.1), int(H * 1.1))}
    fond = ImageEnhance.Brightness(cover(im, W, H).filter(ImageFilter.GaussianBlur(40))).enhance(0.45)
    fw = int(W * 1.12)
    return {"portrait": False, "fond": fond, "fg": im.resize((fw, round(im.height * fw / im.width)), Image.LANCZOS)}

def image_frame(p, t, cy):
    z = 1.0 + 0.06 * t
    if p["portrait"]:
        b = p["base"]
        cw, ch = round(b.width / z / 1.1), round(b.height / z / 1.1)
        x, y = (b.width - cw) // 2, (b.height - ch) // 2
        return b.crop((x, y, x + cw, y + ch)).resize((W, H), Image.BILINEAR)
    fr, fg = p["fond"].copy(), p["fg"]
    cw, ch = round(W / z), round(W / z * fg.height / fg.width)
    x, y = (fg.width - cw) // 2, (fg.height - ch) // 2
    crop = fg.crop((x, y, x + cw, y + ch)).resize((W, round(W * fg.height / fg.width)), Image.BILINEAR)
    fr.paste(crop, (0, cy - crop.height // 2))
    return fr

def ease(a):
    a = max(0.0, min(1.0, a))
    return 1 - (1 - a) ** 3

def centre(d, y, txt, f, fill, alpha=255, stroke=0):
    w = d.textlength(txt, font=f)
    d.text(((W - w) / 2, y), txt, font=f, fill=fill + (alpha,), stroke_width=stroke, stroke_fill=(0, 0, 0, alpha))

def pill(d, y, txt, f, bg, fg, alpha, pad=(36, 18)):
    w = d.textlength(txt, font=f)
    a, de = f.getmetrics()
    x0 = (W - w) / 2 - pad[0]
    d.rounded_rectangle((x0, y, x0 + w + 2 * pad[0], y + a + de + 2 * pad[1]), radius=22, fill=bg + (alpha,))
    d.text((x0 + pad[0], y + pad[1]), txt, font=f, fill=fg + (alpha,))
    return a + de + 2 * pad[1]

def apparait(t, t0, dur=0.3):
    return ease((t - t0) / dur)

def calque(t):
    c = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(c)
    # 1) Accroche (0 → 4,06 s)
    if t < 4.06:
        g = Image.new("L", (1, 760))
        g.putdata([int(210 * (1 - i / 760)) for i in range(760)])
        noir = Image.new("RGBA", (W, 760), (0, 0, 0, 255))
        noir.putalpha(g.resize((W, 760)))
        c.alpha_composite(noir)
        a1 = apparait(t, 0.0)
        centre(d, 190 + (1 - a1) * 50, "HYUNDAI KONA 1.6 TURBO", F(FB, 66), BLANC, int(255 * a1))
        a2 = apparait(t, 1.64, 0.25)
        f = F(FB, int(210 * (0.8 + 0.2 * a2)))
        centre(d, 280 + (1 - a2) * 30, "8 500 $", f, JAUNE, int(255 * a2))
        a3 = apparait(t, 2.3)
        pill(d, 545, "TOUT COMPRIS · CLÉS EN MAIN À CONAKRY", F(FB, 40), BLEU, BLANC, int(255 * a3))
    # 2) Badge prix permanent
    elif t < 29.34:
        a = apparait(t, 4.06)
        pill(d, 170, "KBA  ·  8 500 $ TOUT COMPRIS", F(FB, 38), NUIT, JAUNE, int(235 * a), pad=(30, 14))
    # 3) Récap prix (Achat, transport, douane)
    if 22.29 <= t < 24.96:
        v = Image.new("RGBA", (W, H), (5, 12, 28, int(150 * apparait(t, 22.29))))
        c.alpha_composite(v)
        y = 470
        for k, (txt, tt) in enumerate([("ACHAT", "Achat"), ("TRANSPORT", "transport"), ("DOUANE", "douane")]):
            a = apparait(t, t_mot(tt), 0.2)
            pill(d, y + k * 120, "✓ " + txt if False else txt, F(FB, 56), BLEU, BLANC, int(255 * a))
        a = apparait(t, 24.08, 0.25)
        centre(d, 850, "TOUT COMPRIS", F(FB, 92), JAUNE, int(255 * a))
    # 4) Paiement en 2 fois
    if 24.96 <= t < 29.34:
        v = Image.new("RGBA", (W, H), (5, 12, 28, int(150 * apparait(t, 24.96))))
        c.alpha_composite(v)
        a = apparait(t, 24.96)
        centre(d, 430, "PAYEZ EN 2 FOIS", F(FB, 80), BLANC, int(255 * a))
        a1 = apparait(t, t_mot("50"), 0.25)
        pill(d, 580, "50 %  À LA COMMANDE", F(FB, 58), BLEU, BLANC, int(255 * a1))
        a2 = apparait(t, t_mot("reste"), 0.25)
        pill(d, 720, "50 %  SUR LE BATEAU", F(FB, 58), JAUNE, NUIT, int(255 * a2))
    # 5) Écran de fin
    if t >= 29.34:
        v = Image.new("RGBA", (W, H), (5, 12, 28, int(185 * apparait(t, 29.34))))
        c.alpha_composite(v)
        a = apparait(t, 29.34)
        centre(d, 380, "PASSEZ VOTRE COMMANDE", F(FB, 64), BLANC, int(255 * a))
        a = apparait(t, t_mot("WhatsApp"), 0.25)
        pill(d, 490, "WhatsApp  ·  lien en bio", F(FB, 54), (37, 211, 102), BLANC, int(255 * a))
        a = apparait(t, 31.99, 0.3)
        pill(d, 660, "KBA", F(FB, 120), BLEU, BLANC, int(255 * a), pad=(60, 20))
        a = apparait(t, t_mot("une"), 0.3)
        centre(d, 870, "Une voiture de Corée chaque soir à 19 h", F(FM, 42), BLANC, int(255 * a))
        centre(d, 935, "ABONNEZ-VOUS", F(FB, 56), JAUNE, int(255 * apparait(t, 31.99, 0.3)))
    # 6) Sous-titres mot à mot
    for g in GROUPES:
        t0, t1 = MOTS[g[0]][1], MOTS[g[-1]][2] + 0.12
        if t0 - 0.05 <= t < t1:
            f = F(FB, 70)
            mots = [MOTS[k][0] for k in g]
            espace = d.textlength(" ", font=f)
            larg = sum(d.textlength(w, font=f) for w in mots) + espace * (len(mots) - 1)
            x = (W - larg) / 2
            pop = apparait(t, t0, 0.12)
            y = 1300 + (1 - pop) * 18
            for k, w in zip(g, mots):
                actif = MOTS[k][1] <= t < MOTS[k][2] + 0.05
                d.text((x, y), w, font=f, fill=(JAUNE if actif else BLANC) + (255,), stroke_width=7, stroke_fill=(0, 0, 0, 255))
                x += d.textlength(w, font=f) + espace
            break
    return c

# ---------- AUDIO : musique + effets générés ----------
def ecrire_wav(nom, sig):
    sig = np.clip(sig, -1, 1)
    st = (np.stack([sig, sig], 1) * 32767).astype(np.int16)
    with wave.open(nom, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

N = int(DUREE * SR)
tt = np.arange(N) / SR
BPM = 96
beat = 60 / BPM
rng = np.random.default_rng(7)

def note(f):
    return 440 * 2 ** ((f - 69) / 12)

# accords (La m – Fa – Do – Sol), nappe douce
accords = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
musique = np.zeros(N)
mesure = beat * 4
for i in range(int(DUREE / mesure) + 1):
    t0 = i * mesure
    s0, s1 = int(t0 * SR), min(N, int((t0 + mesure) * SR))
    if s0 >= N: break
    x = tt[s0:s1] - t0
    env = np.minimum(1, x / 0.4) * np.minimum(1, (mesure - x) / 0.4)
    for n in accords[i % 4]:
        fr = note(n)
        musique[s0:s1] += 0.06 * env * (np.sin(2 * np.pi * fr * x) + 0.3 * np.sin(2 * np.pi * 2 * fr * x + 0.5))
    # basse
    fb = note(accords[i % 4][0] - 12)
    musique[s0:s1] += 0.10 * env * np.sin(2 * np.pi * fb * x)
# arpège léger
for k in range(int(DUREE / (beat / 2))):
    t0 = k * beat / 2
    s0 = int(t0 * SR); s1 = min(N, s0 + int(0.25 * SR))
    if s0 >= N: break
    x = tt[s0:s1] - t0
    acc = accords[int(t0 / mesure) % 4]
    fr = note(acc[k % 3] + 12)
    musique[s0:s1] += 0.035 * np.exp(-x * 9) * np.sin(2 * np.pi * fr * x)
# kick + charleston
for k in range(int(DUREE / beat)):
    t0 = k * beat
    s0 = int(t0 * SR); s1 = min(N, s0 + int(0.25 * SR))
    x = tt[s0:s1] - t0
    musique[s0:s1] += 0.22 * np.exp(-x * 18) * np.sin(2 * np.pi * (50 + 90 * np.exp(-x * 30)) * x)
    h0 = int((t0 + beat / 2) * SR); h1 = min(N, h0 + int(0.05 * SR))
    if h0 < N:
        bruit = rng.standard_normal(h1 - h0)
        bruit = np.diff(np.concatenate([[0], bruit]))  # passe-haut simple
        musique[h0:h1] += 0.03 * bruit * np.exp(-np.arange(h1 - h0) / SR * 60)
fondu = np.minimum(1, tt / 1.0) * np.minimum(1, (DUREE - tt) / 1.5)
musique *= fondu
ecrire_wav("audio/musique.wav", musique / np.max(np.abs(musique)) * 0.8)

# effets : whoosh à chaque changement de plan, impact sur les prix, petit "ding" sur les CTA
sfx = np.zeros(N)
def whoosh(t0, dur=0.35, vol=0.25):
    s0 = int(max(0, t0 - dur * 0.6) * SR); n = int(dur * SR)
    if s0 + n > N: n = N - s0
    b = rng.standard_normal(n)
    # passe-bande glissant approximatif : moyenne mobile de largeur variable
    out = np.zeros(n); acc = 0.0
    for j in range(n):
        a = 0.02 + 0.25 * (j / n)
        acc += a * (b[j] - acc); out[j] = acc
    env = np.sin(np.pi * np.arange(n) / n) ** 2
    sfx[s0:s0 + n] += vol * out * env / (np.max(np.abs(out)) + 1e-9)
def impact(t0, vol=0.5):
    s0 = int(t0 * SR); n = min(int(0.6 * SR), N - s0); x = np.arange(n) / SR
    sfx[s0:s0 + n] += vol * np.exp(-x * 7) * np.sin(2 * np.pi * (45 + 60 * np.exp(-x * 20)) * x)
def ding(t0, f=1318.5, vol=0.18):
    s0 = int(t0 * SR); n = min(int(0.8 * SR), N - s0); x = np.arange(n) / SR
    sfx[s0:s0 + n] += vol * np.exp(-x * 6) * (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * 2 * f * x))
for _, t0 in PLANS[1:]:
    whoosh(t0)
impact(1.64); impact(22.29, 0.4); impact(24.08, 0.35)
ding(t_mot("50")); ding(t_mot("reste"), 1568.0)
ding(t_mot("WhatsApp"), 1046.5); ding(31.99, 1318.5)
ecrire_wav("audio/effets.wav", sfx)

# ---------- VIDÉO ----------
tmp = "audio/_video_muette.mp4"
ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
                       "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium",
                       "-crf", "19", "-pix_fmt", "yuv420p", tmp], stdin=subprocess.PIPE)
cache = {}
precedente, n_total, FONDU = None, int(DUREE * FPS), 5
plan_idx = -1
for fi in range(n_total):
    t = fi / FPS
    k = max(i for i in range(len(PLANS)) if PLANS[i][1] <= t + 1e-6)
    num, t0 = PLANS[k]
    if (num, k == 0) not in cache:
        cache[(num, k == 0)] = prepare(num)
    p = cache[(num, k == 0)]
    prog = (t - t0) / (DEBUTS[k + 1] - t0)
    fr = image_frame(p, prog, 1060 if k == 0 else 760).convert("RGBA")
    fr.alpha_composite(calque(t))
    fr = fr.convert("RGB")
    if k != plan_idx:
        debut_fondu, plan_idx = fi, k
        base_fondu = precedente
    if base_fondu is not None and fi - debut_fondu < FONDU:
        fr = Image.blend(base_fondu, fr, (fi - debut_fondu + 1) / (FONDU + 1))
    ff.stdin.write(fr.tobytes())
    precedente = fr
ff.stdin.close(); ff.wait()

# ---------- MIXAGE ----------
# voix normalisée et en avant ; musique basse (-22 dB env.) avec ducking ; effets bas
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", tmp, "-i", VOIX, "-i", "audio/musique.wav", "-i", "audio/effets.wav",
    "-filter_complex",
    "[1:a]aresample=44100,aformat=channel_layouts=stereo,adelay=0|0,apad=whole_dur=%s,"
    "loudnorm=I=-15:TP=-1.5:LRA=7,asplit=2[voix][sc];"
    "[2:a]volume=0.16[mus];"
    "[mus][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[musd];"
    "[3:a]volume=0.35[fx];"
    "[voix][musd][fx]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.95[a]" % DUREE,
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", str(DUREE),
    "-movflags", "+faststart", OUT], check=True)
print("OK", OUT)
