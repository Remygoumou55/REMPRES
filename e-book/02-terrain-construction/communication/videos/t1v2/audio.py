"""T1 v2 « La photo » — NOUVELLE MUSIQUE (8 nov., même exigence que T2 : douce, inspirante, accrocheuse, sans aigus).
Style propre à T1 : Rhodes chaud + « mallet » feutré + nappe aérienne, si mineur / ré majeur, 86 bpm, petit groove lo-fi doux.
Accroche : thème de 4 notes au mallet (la – fa# – si – la), au début, à « Pour éviter ces erreurs », sur « Une photo ne prouve rien » et à la fin."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 48.6; N = int(SR * DUR)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2):
    return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
    at = (at if at < 41.53 else (41.53 + (at - 41.53) * 2.49 / 2.12 if at < 43.65 else at + 0.37)) + 0.6  # prix 9 900 collé + 0,6 s d'entrée
    i = int(at * SR); j = min(N, i + len(s))
    if i >= N or j <= 0: return
    s = s[:j - i] * g
    buf[0, i:j] += s * (1 - max(0, pan)); buf[1, i:j] += s * (1 + min(0, pan))
def gate(a, b, fa=.3, fb=.3):
    t = np.arange(N) / SR
    return np.clip((t - a) / fa, 0, 1) * np.clip((b - t) / fb, 0, 1)

mus = np.zeros((2, N)); sfx = np.zeros((2, N))
t_all = np.arange(N) / SR

# ---------- MUSIQUE ----------
spb = 60 / 86
def rhodes(m, d, vel=1.0):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t + .5*np.sin(2*np.pi*f*t)*np.exp(-t*4)) + .2*np.sin(2*np.pi*2*f*t)*np.exp(-t*3)
    return filt(s * np.exp(-t*.9) * (1 + .08*np.sin(2*np.pi*4.5*t)) * env(len(t), .01, .5), 2400) * vel
def mallet(m, d=1.6, vel=1.0):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*4*f*t)*np.exp(-t*30)
    return filt(s * np.exp(-t*2.6) * env(len(t), .004, .3), 3000) * vel
def pad(ms, d, a=1.5, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.09, 0.0, 0.09):
            s += np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .3*np.sin(2*np.pi*2*hz(m+det)*t)
    return filt(s, 1400) * env(len(t), a, r) / (3*len(ms))
def bass(m, d):
    t = T(d); return filt(np.sin(2*np.pi*hz(m)*t) + .3*np.sin(2*np.pi*2*hz(m)*t), 500) * env(len(t), .02, .25)
def kick(g=1):
    t = T(.35); return np.sin(2*np.pi*(50 + 50*np.exp(-t*28))*t) * np.exp(-t*10) * g
def rim():
    t = T(.07); return filt(np.sin(2*np.pi*900*t) + filt(rng.standard_normal(len(t)), 1200, 'high')*.4, 2500) * np.exp(-t*55)
def hat():
    n = filt(filt(rng.standard_normal(int(SR*.05)), 2500, 'high'), 5000); return n * np.exp(-np.arange(len(n))/SR*80)
Bm, G, D, A, Em, Fs = (47,50,54,59), (43,50,55,59), (50,54,57,62), (45,52,57,61), (40,47,52,55), (42,49,54,58)
MOTIF = [(0, 69), (.5, 66), (1.0, 71), (1.75, 69)]

def section(seq, start, stop, padg=.45, rh=True, rg=.11):
    b = start; k = 0
    while b < stop - .15:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + 1.0, .7, 1.0), b, padg)
        add(mus, bass(ch[0] - 12, d*.95), b, .3)
        if rh:
            for q, (o, n) in enumerate([(0, 1), (1.5, 2), (2, 3), (3, 2)]):
                if b + o*spb < stop: add(mus, rhodes(ch[n] + 12, 2.0, .6), b + o*spb, rg, (-.25, .25)[q % 2])
        b += spb*4; k += 1

# 0) ACCROCHE (0 – 3) : le thème au mallet sur une nappe en si mineur
add(mus, pad(Bm[1:], 3.4, .3, 1.0), 0.0, .45)
for dt, m in MOTIF: add(mus, mallet(m, 2.0, .9), 0.15 + dt*spb, .2, .15)
# 1) PROBLÈME (3 – 9.9) : pluie légère + Rhodes chauds
rain = filt(filt(rng.standard_normal(N), 3000), 300, 'high') * 0.05
for ch in (0, 1): mus[ch] += rain * gate(2.9, 9.9, .6, .6)
section([Bm, G, D, A], 3.0, 9.9, .42)
# 2) AGGRAVATION (9.9 – 23.4) : plus sombre, pulsation douce en croches
section([Bm, Em, G, Fs], 9.9, 22.1, .48, rh=False)
b = 9.95
while b < 22.0:
    add(mus, kick(.8), b, .3); add(mus, filt(mallet(35, .3, .8), 400), b + spb/2, .18); b += spb
for dt, m in MOTIF[:2]: add(mus, mallet(m - 12, 2.0, .7), 16.4 + dt*spb, .12)
# « trop tard » : tout s'arrête, une note grave tenue
add(mus, pad((35, 47), 1.6, .05, 1.2), 22.12, .5)
# 3) SOLUTION (23.4 – 41.4) : lumière, groove lo-fi doux en ré majeur
add(mus, pad(D[1:], 1.6, .5, .5), 23.3, .35)
for dt, m in MOTIF: add(mus, mallet(m + 12, 2.0, .7), 23.5 + dt*spb, .14, -.1)
section([D, A, Bm, G], 24.7, 41.4, .45, rg=.12)
b = 24.7; q = 0
while b < 41.3:
    if q % 4 in (0, 2): add(mus, kick(), b, .32)
    if q % 4 in (1, 3): add(mus, rim(), b, .07, .2)
    add(mus, hat(), b + spb/2, .03, -.3); b += spb; q += 1
for dt, m in MOTIF: add(mus, mallet(m, 2.0, .8), 39.7 + dt*spb, .16)
# 4) FIN (41.4 –) : le thème en entier puis l'accord final
section([D, A, G, D], 41.4, 45.6, .5, rg=.1)
for dt, m in MOTIF + [(2.5, 74)]: add(mus, mallet(m + 12, 2.2, .7), 44.0 + dt*spb, .13)
for k, m in enumerate((38, 50, 54, 57, 62)): add(mus, rhodes(m, 3.5, .7), 45.4 + k*.04, .12, (k-2)*.2)
add(mus, pad(D[1:], 3.0, .2, 2.0), 45.4, .45)
mus = filt(mus, 4500)
mus *= gate(0, DUR, .03, 1.2)

# ---------- BRUITAGES ----------
def ding():
    t = T(.7); return (np.sin(2 * np.pi * 1568 * t) * np.exp(-t * 7) + .7 * np.sin(2 * np.pi * 2093 * t) * np.exp(-t * 6) * (t > .09))
def whoosh(d=.45, up=True):
    t = T(d); n = rng.standard_normal(len(t))
    lo = filt(n, 300, 'high'); hi = filt(n, 2500, 'high')
    w = np.sin(np.pi * t / d) ** 2
    return (lo * (1 - t / d if up else t / d) + hi * (t / d if up else 1 - t / d)) * w
def pop(f=900):
    t = T(.12); return np.sin(2 * np.pi * f * (1 + 1.5 * np.exp(-t * 40)) * t) * np.exp(-t * 35)
def boom():
    t = T(1.2); return np.sin(2 * np.pi * (38 + 60 * np.exp(-t * 8)) * t) * np.exp(-t * 3) + filt(rng.standard_normal(len(t)), 500) * np.exp(-t * 14) * .6
def thud(g=1.0):
    t = T(.4); return (np.sin(2 * np.pi * (70 + 80 * np.exp(-t * 25)) * t) * np.exp(-t * 12) + filt(rng.standard_normal(len(t)), 1800) * np.exp(-t * 40) * .8) * g
def tick(f=3200):
    t = T(.025); return np.sin(2 * np.pi * f * t) * np.exp(-t * 250)
def shutter():
    t = T(.16); n = filt(rng.standard_normal(len(t)), 1200, 'high')
    return n * (np.exp(-t * 90) + .8 * np.exp(-np.abs(t - .08) * 120))
def tone2(f1, f2, d):
    t = T(d); return (np.sin(2 * np.pi * f1 * t) + np.sin(2 * np.pi * f2 * t)) * env(len(t), .02, .05) * .5
def check():
    t = T(.25); return (np.sin(2 * np.pi * 1320 * t) * np.exp(-t * 18) + np.sin(2 * np.pi * 1980 * t) * np.exp(-t * 22) * (t > .05))
def key():
    t = T(.04); return filt(rng.standard_normal(len(t)), 2000, 'high') * np.exp(-t * 160)
def marker(d=.18):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 3000, 'high'), 7000) * np.sin(np.pi * t / d)


# ----- bruitages : PEU nombreux et doux (demande du client, 8 nov.) -----
add(sfx, thud(.6), 0.0, .5)                      # « Arrête »
add(sfx, thud(.5), 2.45, .4)                     # STOP
add(sfx, ding(), 3.22, .18)                      # message du frère
add(sfx, check(), 9.3, .15)                      # argent envoyé
add(sfx, whoosh(.6), 13.6, .12)                  # galerie
add(sfx, thud(.7), 22.14, .45)                   # trop tard
add(sfx, whoosh(.7), 23.3, .12)                  # la solution
for at in (30.25, 31.8, 33.15, 33.85): add(sfx, check(), at, .08)   # cases cochées (très doux)
add(sfx, ding(), 42.9, .12)                      # prix
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx)
print('ok')
