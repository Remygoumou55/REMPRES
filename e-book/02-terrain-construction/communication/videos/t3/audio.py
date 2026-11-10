"""T3 « Deux acheteurs » (motion design) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à T3 : guitare classique douce (cordes nylon) + nappe de cordes chaude + clarinette basse pour le thème,
mi mineur -> sol majeur, 76 bpm. Thème de 4 notes (mi – sol – si – la) : au début, au guide, et à la fin.
Tout est filtré (pas d'aigus). Voix calée avec 0,5 s d'entrée."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 45.4; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(33)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
    i = int((at + LEAD) * SR); j = min(N, i + len(s))
    if i >= N or j <= 0 or i < 0: return
    s = s[:j - i] * g; buf[0, i:j] += s * (1 - max(0, pan)); buf[1, i:j] += s * (1 + min(0, pan))
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
spb = 60 / 76
def guitar(m, d=2.2):       # corde nylon (Karplus-Strong) très douce
    f = hz(m); n = int(SR * d); p = max(2, int(SR / f)); buf = filt(rng.uniform(-1, 1, p), 2500); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.997
    return filt(out, 2200) * env(n, .004, .3)
def strings(ms, d, a=1.4, r=1.6):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.06, 0.0, 0.06):
            ph = rng.uniform(0, 6.28); f = hz(m + det) * (1 + .003 * np.sin(2 * np.pi * 5 * t))
            s += np.sin(2 * np.pi * np.cumsum(f) / SR + ph) + .35 * np.sin(4 * np.pi * np.cumsum(f) / SR + ph)
    return filt(s, 1500) * env(len(t), a, r) / (3 * len(ms))
def clarinet(m, d, a=.12, r=.4):
    t = T(d); f = hz(m) * (1 + .004 * np.sin(2 * np.pi * 5 * t) * np.clip(t / .5, 0, 1)); ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) + .45 * np.sin(3 * ph) + .2 * np.sin(5 * ph) + .08 * np.sin(7 * ph)
    return filt(s, 1800) * env(len(t), a, r)
def tom(f=70):
    t = T(.6); return np.sin(2 * np.pi * (f + 35 * np.exp(-t * 18)) * t) * np.exp(-t * 6)
def shk():
    n = filt(filt(rng.standard_normal(int(SR * .08)), 1500, 'high'), 4000); return n * np.exp(-np.arange(len(n)) / SR * 45)
Em, C, G, D, Am, B = (40,47,52,55,59), (36,43,48,52,55), (43,47,50,55,59), (38,45,50,54,57), (45,52,57,60,64), (47,51,54,57,59)
MOTIF = [(0, 64), (.5, 67), (1.0, 71), (1.75, 69)]
def bars(seq, start, stop, sg=.5, gg=.16, arp=(0, 2, 3, 4, 3, 2)):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb * 4, stop - b)
        add(mus, strings(ch[1:4], d + 1.0, .7, 1.0), b, sg)
        add(mus, guitar(ch[0], 3.0), b, .5)
        for q, n in enumerate(arp):
            x = b + (q + 1) * spb * 4 / (len(arp) + 1)
            if x < stop: add(mus, guitar(ch[n] + 12, 2.0), x, gg, (-.3, .3)[q % 2])
        b += spb * 4; k += 1
# 1) ACCROCHE + PROBLÈME (0 – 10.6) : mystère doux puis guitare
add(mus, strings(Em[1:4], 4.2, .2, 1.2), -0.3, .45)
for dt, m in MOTIF: add(mus, clarinet(m - 12, 1.3), 0.0 + dt * spb, .16)
bars([Em, C, G, D], 3.9, 10.6)
# 2) AGGRAVATION (10.6 – 21.05) : plus sombre, battement grave très doux
bars([Em, Am, C, B], 10.6, 21.05, .55, .12, arp=(0, 3, 2, 3))
b = 10.65
while b < 20.9: add(mus, tom(62), b, .3); add(mus, tom(62), b + .3, .14); b += spb * 2
add(mus, clarinet(52, 3.0, .6, 1.0), 18.6, .1)
# coup de marteau : tout s'arrête, une note grave
add(mus, strings((28, 40), 1.4, .02, 1.0), 21.05, .5)
# 3) SOLUTION (22.0 – 37.8) : lumière, sol majeur
add(mus, strings(G[1:4], 2.0, .6, .8), 21.9, .4)
for dt, m in MOTIF: add(mus, clarinet(m + 3, 1.4), 22.2 + dt * spb, .15)
bars([G, D, Em, C], 23.6, 37.8, .5, .15)
b = 25.7; q = 0
while b < 37.7:
    if q % 2 == 0: add(mus, tom(58), b, .22)
    add(mus, shk(), b + spb / 2, .05, .3); b += spb; q += 1
for dt, m in MOTIF: add(mus, clarinet(m + 3, 1.4), 29.9 + dt * spb, .13)
# 4) ACTION (37.8 – fin)
bars([C, D, G], 37.8, 44.2, .5, .14)
for dt, m in MOTIF + [(2.5, 71)]: add(mus, clarinet(m + 3, 1.5), 40.1 + dt * spb, .14)
for k, m in enumerate((43, 55, 59, 62, 67)): add(mus, guitar(m, 3.5), 43.1 + k * .05, .3, (k - 2) * .2)
add(mus, strings((55, 59, 62, 67), 2.6, .2, 1.8), 43.0, .5)
mus = filt(mus, 4500)
t_all = np.arange(N) / SR
mus *= np.clip(t_all / .05, 0, 1) * np.clip((DUR - t_all) / 1.2, 0, 1)

# ---------- BRUITAGES (peu nombreux, doux) ----------
def pin():
    t = T(.12); return filt(np.sin(2 * np.pi * 900 * t) * np.exp(-t * 60) + filt(rng.standard_normal(len(t)), 800, 'high') * np.exp(-t * 90) * .4, 3500)
def paper(d=.35):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 900, 'high'), 4500) * np.sin(np.pi * t / d)
def thud(g=1.0):
    t = T(.45); return (np.sin(2 * np.pi * (60 + 60 * np.exp(-t * 22)) * t) * np.exp(-t * 10) + filt(rng.standard_normal(len(t)), 1200) * np.exp(-t * 35) * .5) * g
def key():
    t = T(.05); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 4000) * np.exp(-t * 120)
def whoosh(d=.5):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2500) * np.sin(np.pi * t / d) ** 2
for at in (0.0, 0.25, 1.15): add(sfx, pin(), at + .3, .35)
for at in (2.45, 2.75): add(sfx, paper(), at, .3)
add(sfx, whoosh(), 3.9, .2)
add(sfx, thud(.6), 9.35, .35)            # RÉGLÉ
add(sfx, whoosh(), 10.55, .2)
for k in range(5): add(sfx, key(), 10.9 + k * .09, .18)
add(sfx, thud(.8), 14.7, .4)             # NON PROUVÉ
add(sfx, thud(.8), 17.0, .4)             # ×2
add(sfx, thud(1.2), 21.05, .55)          # marteau
add(sfx, whoosh(.7), 21.9, .25)
for at in (25.74, 26.77, 27.75, 28.86): add(sfx, pin(), at + .35, .3)
add(sfx, paper(.5), 30.3, .3)            # le guide se pose
add(sfx, thud(.8), 40.1, .45)            # tampon du prix
add(sfx, paper(.3), 42.5, .2)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
