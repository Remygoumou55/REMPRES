"""T2 v2 « Mamadou » (PASA) — NOUVELLE MUSIQUE (8 nov., demande du client : douce, inspirante, pas aiguë).
Piano feutré + nappe chaude + violoncelle, si bémol majeur / sol mineur, 72 bpm. Un thème de 5 notes au piano
(l'accroche) ouvre la vidéo, revient sur « Et toi non plus » puis en entier à la fin. Tout est filtré pour rester doux."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 50.2; N = int(SR * DUR)
rng = np.random.default_rng(21)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def W(at):
    if at < 25.83: return at
    if at < 27.63: return float(np.interp(at, [25.83, 26.86, 27.04, 27.63], [25.83, 26.93, 27.34, 28.23]))
    x = at + 0.6
    return x if x < 44.27 else (44.27 + (x - 44.27) * 2.49 / 2.08 if x < 46.35 else x + 0.41)
def add(buf, s, at, g=1.0, pan=0.0):
    i = int(W(at) * SR); j = min(N, i + len(s))
    if i >= N or j <= 0 or i < 0: return
    s = s[:j - i] * g; buf[0, i:j] += s * (1 - max(0, pan)); buf[1, i:j] += s * (1 + min(0, pan))
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
spb = 60 / 72
def piano(m, d=2.5, vel=1.0):          # piano feutré : peu d'harmoniques, attaque douce
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t) + .35*np.sin(2*np.pi*2*f*t)*np.exp(-t*2.5) + .12*np.sin(2*np.pi*3*f*t)*np.exp(-t*4)
    s *= np.exp(-t*(1.1 + (m-60)*.03)) * env(len(t), .008, .4)
    return filt(s, 2600) * vel
def pad(ms, d, a=1.6, r=1.8):            # nappe chaude (scies filtrées très bas)
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.07):
            ph = rng.uniform(0, 1); s += 2*((hz(m+det)*t + ph) % 1) - 1
    return filt(filt(s, 850), 120, 'high') * env(len(t), a, r) / (2*len(ms))
def cello(m, d, a=.35, r=.6):           # violoncelle doux avec vibrato
    t = T(d); f = hz(m) * (1 + .004*np.sin(2*np.pi*5.2*t)*np.clip(t/.6, 0, 1))
    ph = 2*np.pi*np.cumsum(f)/SR; s = np.sin(ph) + .5*np.sin(2*ph) + .25*np.sin(3*ph) + .12*np.sin(4*ph)
    return filt(s, 1300) * env(len(t), a, r)
def sub(m, d):
    t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .05, .4)
def softkick():
    t = T(.4); return np.sin(2*np.pi*(52 + 40*np.exp(-t*30))*t) * np.exp(-t*9)
def brush():
    n = filt(filt(rng.standard_normal(int(SR*.12)), 900, 'high'), 3500); return n * np.exp(-np.arange(len(n))/SR*28)
# accords (si bémol majeur) : Solm Mib Sib Fa / Do m / Ré
Gm, Eb, Bb, F, Cm, D7 = (55,58,62), (51,55,58), (50,53,58), (53,57,60), (48,51,55), (50,54,57)
MOTIF = [(0, 70), (.5, 74), (1.0, 77), (1.75, 75), (2.25, 74)]   # Sib Ré Fa Mib Ré : l'accroche

def chords(seq, start, stop, padg=.5, arp=False, pg=.11):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop-b)
        add(mus, pad(ch, d + 1.2, .8, 1.2), b, padg)
        add(mus, sub(ch[0]-12, d), b, .22)
        if arp:
            for q, n in enumerate([0, 1, 2, 1, 2, 1, 0, 2]):
                x = b + q*spb/2
                if x < stop: add(mus, piano(ch[n]+12, 1.6, .55), x, pg, (-.3, .3)[q % 2])
        else:
            add(mus, piano(ch[0], 3.0, .7), b, pg); add(mus, piano(ch[1]+12, 2.5, .5), b + spb, pg*.8, .2); add(mus, piano(ch[2]+12, 2.5, .5), b + spb*2, pg*.8, -.2)
        b += spb*4; k += 1

# 1) ACCROCHE + PROBLÈME (0 – 14.5) : le thème au piano, puis accords doux
for dt, m in MOTIF: add(mus, piano(m, 3.0, .9), 0.05 + dt*spb, .2, .1)
add(mus, pad(Bb, 4.0, .4, 1.5), 0.0, .35)
chords([Gm, Eb, Bb, F], 3.4, 14.5, .45)
for dt, m in MOTIF[:3]: add(mus, piano(m, 2.5, .6), 10.0 + dt*spb, .12, .2)
# 2) AGGRAVATION (14.5 – 25.6) : plus sombre, battement grave doux
chords([Gm, Cm, Eb, D7], 14.5, 25.6, .5, pg=.09)
b = 14.55
while b < 25.4: add(mus, softkick(), b, .35); add(mus, softkick(), b + .28, .18); b += spb*2
add(mus, cello(43, 5.5, .8, 1.2), 17.0, .07); add(mus, cello(46, 4.5, .8, 1.0), 21.7, .07)
# 3) « Et toi non plus » : presque le silence, puis un fragment du thème
add(mus, pad(Gm, 2.4, .3, 1.5), 25.6, .25)
for dt, m in MOTIF[:3]: add(mus, piano(m - 12, 2.5, .8), 27.04 + dt*spb*.8, .16)
# 4) SOLUTION (28 – 43.5) : montée inspirante, arpèges + violoncelle + rythme doux
chords([Eb, Bb, F, Gm], 28.0, 36.9, .5, arp=True, pg=.09)
chords([Bb, F, Gm, Eb], 36.9, 46.6, .55, arp=True, pg=.10)
cel = [(28.3, 63, 3.2), (31.6, 62, 3.2), (34.9, 65, 3.0), (38.0, 67, 3.2), (41.3, 65, 2.4)]
for at, m, d in cel: add(mus, cello(m - 12, d), at, .07)
b = 31.2; q = 0
while b < 46.4:
    if q % 2 == 0: add(mus, softkick(), b, .3)
    add(mus, brush(), b + spb/2, .05, .3); b += spb; q += 1
for dt, m in MOTIF: add(mus, piano(m, 3.0, .8), 41.03 + dt*spb, .14, .1)   # le thème revient sur « Aime ta famille »
# 5) FIN : le thème complet et l'accord final
for dt, m in MOTIF: add(mus, piano(m + 12, 3.0, .6), 44.0 + dt*spb, .1, -.1)
for k, m in enumerate((46, 58, 62, 65, 70)): add(mus, piano(m, 4.0, .6), 46.65 + k*.04, .12, (k-2)*.2)
add(mus, pad(Bb, 3.0, .2, 2.0), 46.6, .5)
mus = filt(mus, 4800)
mus *= np.clip(np.arange(N)/SR/.05, 0, 1) * np.clip((DUR - np.arange(N)/SR)/1.4, 0, 1)

# ---------- BRUITAGES ----------
def whoosh(d=.5):
    t = T(d); n = rng.standard_normal(len(t)); return (filt(n, 400, 'high') * (1 - t / d) + filt(n, 2500, 'high') * t / d) * np.sin(np.pi * t / d) ** 2
def shimmer(d=1.0):
    t = T(d); s = sum(np.sin(2 * np.pi * f * t) for f in (2093, 2637, 3136)) * np.exp(-t * 3); return s * env(len(t), .3, .3)
def thud(g=1.0):
    t = T(.45); return (np.sin(2 * np.pi * (65 + 70 * np.exp(-t * 22)) * t) * np.exp(-t * 11) + filt(rng.standard_normal(len(t)), 1500) * np.exp(-t * 35) * .7) * g
def paper(d=.35):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 1200, 'high'), 6000) * np.sin(np.pi * t / d) * (1 + .5 * np.sin(2 * np.pi * 30 * t))
def pop(f=800):
    t = T(.12); return np.sin(2 * np.pi * f * (1 + 1.2 * np.exp(-t * 40)) * t) * np.exp(-t * 30)
def tick(f=2600):
    t = T(.03); return np.sin(2 * np.pi * f * t) * np.exp(-t * 200)
def coin():
    t = T(.5); return (np.sin(2 * np.pi * 2400 * t) + .6 * np.sin(2 * np.pi * 3600 * t)) * np.exp(-t * 9)
def keys():
    out = np.zeros(int(SR * .5))
    for k in range(6):
        t = T(.2); s = np.sin(2 * np.pi * rng.uniform(3000, 6000) * t) * np.exp(-t * 40); i = int(rng.uniform(0, .25) * SR); out[i:i + len(s)] += s
    return out
def boom():
    t = T(1.5); return np.sin(2 * np.pi * (35 + 50 * np.exp(-t * 6)) * t) * np.exp(-t * 2.5)


# ----- bruitages : PEU nombreux et doux (demande du client, 8 nov.) -----
add(sfx, shimmer(1.2), 0.0, .06)          # ouverture
add(sfx, thud(.6), 3.18, .35)             # tampon JAMAIS VU
add(sfx, paper(.5), 12.95, .08)           # tout dans une seule main
add(sfx, thud(.6), 15.4, .3)              # le piège de la diaspora
add(sfx, thud(.6), 19.45, .3)             # ARRÊTÉ
add(sfx, paper(.8), 20.55, .12)           # la photo se déchire
add(sfx, thud(.7), 27.04, .35)            # et toi non plus
add(sfx, shimmer(1.2), 28.9, .06)         # le guide
for at in (34.48, 35.24, 36.11): add(sfx, keys(), at, .05)   # les 3 clés (très doux)
add(sfx, shimmer(1.0), 40.95, .05)        # aime ta famille

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
