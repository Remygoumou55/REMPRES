"""T2 v2 « Mamadou » (PASA) : musique + bruitages calés sur voix3/T2.mp3 (47,6 s).
Kora la mineur (problème) -> cœur + bourdon (aggravation) -> silence sur « Et toi ? » ->
espoir do majeur + percussions douces (solution), boîte à musique sur « Aime ta famille », accord final."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 49.8; N = int(SR * DUR)
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

def kora(m, d=1.6):  # corde pincée (Karplus-Strong simplifié)
    f = hz(m); n = int(SR * d); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * env(n, .002, .2)
def strings(ms, d, a=1.5, r=1.5):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.06, 0.0, 0.07):
            ph = rng.uniform(0, 6.28); s += np.sin(2 * np.pi * hz(m + det) * t + ph) + .3 * np.sin(2 * np.pi * 2 * hz(m + det) * t + ph)
    vib = 1 + 0.003 * np.sin(2 * np.pi * 5 * t)
    return filt(s * vib, 2200) * env(len(t), a, r) / (3 * len(ms))
def heart():
    t = T(.5); b = lambda: np.sin(2 * np.pi * (45 + 30 * np.exp(-t * 20)) * t) * np.exp(-t * 14)
    x = b(); y = np.zeros(int(SR * .75)); y[:len(x)] += x; y[int(SR * .22):int(SR * .22) + len(x)] += .7 * x; return y
def bell(m, d=1.5):
    t = T(d); f = hz(m); return (np.sin(2 * np.pi * f * t) + .4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4)) * np.exp(-t * 2.5) * env(len(t), .002, .3)
def tom(f=110):
    t = T(.5); return np.sin(2 * np.pi * (f + 60 * np.exp(-t * 25)) * t) * np.exp(-t * 8)
def shk():
    n = filt(rng.standard_normal(int(SR * .07)), 5000, 'high'); return n * np.exp(-np.arange(len(n)) / SR * 50)

spb = 60 / 80
# 1) ACCROCHE + PROBLÈME (0 – 14.5) : kora la mineur
prog1 = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
pat = [0, 1, 2, 1, 3, 2, 1, 2]
add(mus, kora(45, 3.0), 0.0, .5); add(mus, kora(57, 2.5), 0.0, .35)
for bi, b in enumerate(np.arange(0.0, 14.5, spb * 4)):
    ch = prog1[bi % 4]; notes = list(ch) + [ch[0] + 12]
    add(mus, strings([c - 12 for c in ch], spb * 4 + 1.2, .8, 1.0), b, .45 if b > 6 else .35)
    for k in range(8):
        x = b + k * spb / 2
        if x < 14.4 and not (2.9 < x < 4.1): add(mus, kora(notes[pat[k]] + 12, 1.4), x, .2 if x > 6 else .15, (-.4, .4)[k % 2])
    add(mus, kora(ch[0] - 12, 2.0), b, .35)
# 2) AGGRAVATION (14.5 – 27.0) : cœur + bourdon, puis tension
for b in np.arange(14.55, 21.6, .85): add(mus, heart(), b, .45)
t = T(7.2); add(mus, (np.sin(2*np.pi*hz(33)*t) + .4*np.sin(2*np.pi*hz(45)*t)) * env(len(t), .8, .6), 14.5, .2)
add(mus, strings((57, 58, 64), 7.0, 1.2, .6), 14.5, .33)
for bi, b in enumerate(np.arange(21.6, 25.6, spb * 2)):
    ch = [(53, 57, 60), (52, 55, 59)][bi % 2]
    add(mus, strings(ch, spb * 2 + .6, .3, .5), b, .35)
    for k in range(4): add(mus, kora(ch[k % 3] + 12, 1.0), b + k * spb / 2, .12)
add(mus, strings((57, 60, 64), 1.6, .4, 1.0), 25.6, .25)
t = T(2.5); add(mus, np.sin(2*np.pi*(32+45*np.exp(-t*5))*t)*np.exp(-t*1.6), 27.04, .7)
# 3) SOLUTION + ACTION (28.0 – fin) : espoir do majeur
prog2 = [(48, 52, 55, 60), (55, 59, 62, 67), (57, 60, 64, 69), (53, 57, 60, 65)]
for bi, b in enumerate(np.arange(28.0, 46.6, spb * 4)):
    ch = prog2[bi % 4]
    add(mus, strings([c - 12 for c in ch], spb * 4 + 1.0, .6, 1.0), b, .5)
    add(mus, kora(ch[0] - 12, 2.5), b, .35)
    for k in range(8):
        x = b + k * spb / 2
        if x > 46.6: break
        add(mus, kora(ch[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12, 1.2), x, .2, (-.4, .4)[k % 2])
        if b > 31.0:
            if k in (0, 3, 6): add(mus, tom(100), x, .35)
            add(mus, shk(), x + spb / 4, .06, .3)
for k, m in enumerate([76, 79, 84, 83, 79, 76]): add(mus, bell(m, 1.4), 41.03 + k * .2, .12, (k % 3 - 1) * .4)
for k, m in enumerate((72, 76, 79, 84)): add(mus, bell(m, 2.5), 46.65 + k * .06, .14, (k - 1.5) * .3)
add(mus, strings((48, 55, 60, 64, 67), 2.2, .1, 1.6), 46.6, .5)
mus *= np.clip(np.arange(N) / SR / .05, 0, 1) * np.clip((DUR - np.arange(N) / SR) / 1.2, 0, 1)

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
