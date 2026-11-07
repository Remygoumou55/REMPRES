"""T2 « Mamadou » : musique originale + bruitages, uniquement pour cette vidéo.
Cordes pincées façon kora (la mineur), nappe de cordes, battement de cœur au drame,
souvenir doux (boîte à musique), puis montée d'espoir en do majeur avec percussions douces."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 43.4; N = int(SR * DUR)
rng = np.random.default_rng(21)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
    i = int(at * SR); j = min(N, i + len(s))
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
# Partie 1 (0 – 14.3) : kora la mineur, Europe -> pays
prog1 = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Lam Fa Do Sol
pat = [0, 1, 2, 1, 3, 2, 1, 2]
for bi, b in enumerate(np.arange(0.25, 14.3, spb * 4)):
    ch = prog1[bi % 4]; notes = list(ch) + [ch[0] + 12]
    add(mus, strings([c - 12 for c in ch], spb * 4 + 1.2, 1.0, 1.0), b, .5 if b > 7 else .35)
    for k in range(8):
        x = b + k * spb / 2
        if x < 14.2: add(mus, kora(notes[pat[k]] + 12, 1.4), x, .22 if x > 7.4 else .16, (-.4, .4)[k % 2])
    add(mus, kora(ch[0] - 12, 2.0), b, .35)
# Partie 2 (14.3 – 19.3) : drame, coeur + bourdon
for b in np.arange(14.35, 19.2, .9): add(mus, heart(), b, .45)
t = T(5.2); add(mus, (np.sin(2 * np.pi * hz(33) * t) + .4 * np.sin(2 * np.pi * hz(45) * t)) * env(len(t), .8, .8), 14.3, .18)
add(mus, strings((57, 58, 64), 5.0, 1.5, .6), 14.3, .35)
# Partie 3 (19.3 – 25.3) : souvenir (boîte à musique) puis tension douce
for k, m in enumerate([76, 79, 84, 83, 79, 76, 74, 76]): add(mus, bell(m, 1.4), 19.35 + k * .26, .12, (k % 3 - 1) * .4)
add(mus, strings((60, 64, 67), 2.2, .6, 1.0), 19.3, .35)
for bi, b in enumerate(np.arange(21.3, 25.3, spb * 2)):
    ch = [(53, 57, 60), (52, 55, 59)][bi % 2]
    add(mus, strings(ch, spb * 2 + .6, .3, .5), b, .35)
    for k in range(4): add(mus, kora(ch[k % 3] + 12, 1.0), b + k * spb / 2, .12)
# Partie 4 (25.3 – fin) : espoir, do majeur, percussions douces
prog2 = [(48, 52, 55, 60), (55, 59, 62, 67), (57, 60, 64, 69), (53, 57, 60, 65)]  # Do Sol Lam Fa
for bi, b in enumerate(np.arange(25.3, DUR, spb * 4)):
    ch = prog2[bi % 4]
    add(mus, strings([c - 12 for c in ch], spb * 4 + 1.0, .6, 1.0), b, .5)
    add(mus, kora(ch[0] - 12, 2.5), b, .35)
    for k in range(8):
        x = b + k * spb / 2
        add(mus, kora(ch[[0, 2, 1, 3, 2, 1, 3, 2][k]] + 12, 1.2), x, .2, (-.4, .4)[k % 2])
        if b > 28.5:
            if k in (0, 3, 6): add(mus, tom(100), x, .35)
            add(mus, shk(), x + spb / 4, .06, .3)
for k, m in enumerate((72, 76, 79, 84)): add(mus, bell(m, 2.5), 40.95 + k * .06, .14, (k - 1.5) * .3)
add(mus, strings((48, 55, 60, 64, 67), 3.0, .1, 2.0), 40.95, .5)
mus *= np.clip(np.arange(N) / SR / .3, 0, 1) * np.clip((DUR - np.arange(N) / SR) / 1.4, 0, 1)

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

add(sfx, shimmer(1.2), 0.25, .12)
for i in range(6): add(sfx, whoosh(.25), 5.12 + i * .33, .10); add(sfx, coin(), 5.25 + i * .33, .05)
for at in (7.5, 8.38, 9.34): add(sfx, thud(.6), at, .5)
add(sfx, paper(), 10.2, .3); add(sfx, thud(.9), 10.55, .6)
add(sfx, paper(), 11.1, .3); add(sfx, thud(.9), 11.45, .6)
add(sfx, pop(700), 12.55, .3)
add(sfx, whoosh(.5), 14.1, .2)
add(sfx, thud(1.2), 17.42, .8); add(sfx, boom(), 17.42, .6)
add(sfx, shimmer(1.4), 19.25, .15)
for k, at in enumerate((22.73, 23.64, 24.45)): add(sfx, pop(700 + 150 * k), at, .3, .3)
add(sfx, thud(.8), 24.9, .5)
add(sfx, whoosh(.6), 25.25, .3); add(sfx, shimmer(1.0), 26.1, .12)
for at in (28.65, 29.15, 29.65): add(sfx, paper(.3), at, .35)
add(sfx, pop(1000), 29.9, .25)
for at in (30.4, 31.05, 31.7): add(sfx, keys(), at, .14)
for k, at in enumerate((32.35, 32.5, 32.65)): add(sfx, pop(900 + 100 * k), at, .22)
for k, at in enumerate((34.5, 34.75, 35.0)): add(sfx, tick(1800 + 300 * k), at, .3)
add(sfx, whoosh(.5), 36.6, .3)
for at in (37.6, 37.75, 37.9, 38.05): add(sfx, paper(.2), at, .25)
for at in (38.45, 38.62, 38.85, 39.1, 39.25): add(sfx, tick(2200), at, .25)
add(sfx, whoosh(.3), 40.1, .18)
add(sfx, pop(600), 40.3, .3)
t = T(.08); add(sfx, filt(rng.standard_normal(len(t)), 1500, 'high') * np.exp(-t * 80), 40.95, .35)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
