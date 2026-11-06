"""Musique originale + effets discrets, propre à chaque vidéo (aucun droit d'auteur).
Usage : python3 music.py STYLE DUREE sortie.wav [temps_transitions...] --prix T
A : pulsation tendue « enquête » (fa mineur, 108 bpm) ; B : afro-house légère (la mineur → do, 116 bpm) ;
C : lo-fi motivante, piano (ré majeur, 84 bpm)."""
import sys, numpy as np, wave
style, DUR, out = sys.argv[1], float(sys.argv[2]), sys.argv[3]
args = sys.argv[4:]; prix = None
if '--prix' in args: i = args.index('--prix'); prix = float(args[i+1]); args = args[:i] + args[i+2:]
trans = [float(x) for x in args]
SR = 44100; N = int(SR * DUR); tt = np.arange(N) / SR
rng = np.random.default_rng({'A': 11, 'B': 22, 'C': 33}[style])
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def add(b, s, at, g=1.0):
    i = int(at * SR); j = min(len(b), i + len(s))
    if 0 <= i < len(b): b[i:j] += s[:j - i] * g
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def kick(f0=50, d=.32, k=36):
    t = np.arange(int(SR * d)) / SR; return np.sin(2 * np.pi * (f0 + 70 * np.exp(-t * k)) * t) * np.exp(-t * 11)
def hat(d=.05):
    n = int(SR * d); x = rng.standard_normal(n); return (x - lp(x, .35)) * np.exp(-np.arange(n) / SR * 90)
def tone(m, d, harm=(1, .4, .15), a=.01, r=.3):
    t = np.arange(int(SR * d)) / SR
    s = sum(g * np.sin(2 * np.pi * hz(m) * (k + 1) * t) for k, g in enumerate(harm))
    return s * np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)
def piano(m, d=1.8):
    t = np.arange(int(SR * d)) / SR; f = hz(m)
    return sum(g * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2 + k)) for k, g in ((1, 1), (2, .4), (3, .15))) * np.clip(t / .004, 0, 1)
mus = np.zeros(N)
if style == 'A':
    spb = 60 / 108
    bass = [41, 41, 44, 39]
    for i, b in enumerate(np.arange(0, DUR, spb)):
        add(mus, kick(45), b, .55)
        add(mus, hat(), b + spb / 2, .10)
        add(mus, tone(bass[(i // 4) % 4] - 12, spb * .9, (1, .6, .3), .005, .15), b, .22)
        if i % 2 == 1: add(mus, tone(bass[(i // 4) % 4] + 24, .12, (1, .2), .002, .1), b + spb * .75, .05)
    mus += np.sin(2 * np.pi * hz(53) * tt) * (.5 + .5 * np.sin(2 * np.pi * .12 * tt)) * .04
elif style == 'B':
    spb = 60 / 116; prog = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]
    for i, b in enumerate(np.arange(0, DUR, spb)):
        add(mus, kick(55, .28, 40), b, .5)
        add(mus, hat(.04), b + spb / 2, .12)
        if i % 4 in (1, 3):
            t = np.arange(int(SR * .18)) / SR; add(mus, np.sin(2 * np.pi * 330 * t) * np.exp(-t * 30), b + spb * .25, .08)  # percussion bois
        ch = prog[(i // 8) % 4]
        if i % 8 == 0:
            for m in ch: add(mus, tone(m, spb * 8, (1, .3, .1), .4, .8), b, .07)
        if i % 2 == 0: add(mus, tone(ch[(i // 2) % 3] + 12, .25, (1, .3), .003, .2), b + spb * .5, .07)
        add(mus, tone(ch[0] - 24, spb * .8, (1, .5), .005, .2), b, .2)
else:
    spb = 60 / 84; prog = [(62, 66, 69, 73), (59, 62, 66, 69), (55, 59, 62, 66), (57, 61, 64, 67)]
    for i, b in enumerate(np.arange(0, DUR, spb)):
        ch = prog[(i // 4) % 4]
        if i % 4 == 0:
            for m in ch: add(mus, tone(m - 12, spb * 4.5, (1, .2), .6, 1.2), b, .05)
            add(mus, piano(ch[0] - 24, 2.4), b, .3)
        add(mus, piano(ch[(i * 3) % 4] + 12, 1.2), b + .02, .12)
        add(mus, kick(48, .3, 30), b if i % 2 == 0 else b + spb * .5, .3 if i % 2 == 0 else .18)
        add(mus, hat(.06), b + spb * .5, .06)
mus *= np.clip(tt / 1.0, 0, 1) * np.clip((DUR - tt) / 1.5, 0, 1)
mus /= np.abs(mus).max() + 1e-9
# Effets : souffle doux aux transitions, petit « ding » sur le prix
sfx = np.zeros(N)
def whoosh(d=.7):
    n = int(SR * d); x = rng.standard_normal(n); return lp(x, .06) * np.sin(np.pi * np.arange(n) / n) ** 2 * 3
for t in trans: add(sfx, whoosh(), max(0, t - .35), .25)
if prix is not None:
    t = np.arange(int(SR * 1.2)) / SR
    add(sfx, (np.sin(2 * np.pi * 1318 * t) + .5 * np.sin(2 * np.pi * 1976 * t)) * np.exp(-t * 4), prix, .18)
x = mus * .8 + sfx
x = x / (np.abs(x).max() + 1e-9) * .9
st = np.repeat((x * 32767).astype(np.int16)[:, None], 2, axis=1)
with wave.open(out, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
