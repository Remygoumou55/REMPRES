"""T1 « La photo » : musique originale + bruitages, faits uniquement pour cette vidéo.
Nuit de pluie (ré mineur, nappes) -> tension (bourdon) -> appel vidéo : groove doux en fa majeur -> résolution.
Sortie : music.wav et sfx.wav (stéréo 44,1 kHz)."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 33.4; N = int(SR * DUR)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2):
    return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
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
def rhodes(m, d, vel=1.0):
    t = T(d); f = hz(m)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    s = (np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 3)) + .25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 2))
    return s * np.exp(-t * 0.9) * trem * env(len(t), .01, .6) * vel
def pad(ms, d, a=1.2, r=1.5):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.08):
            s += np.sign(np.sin(2 * np.pi * hz(m + det) * t)) * 0.5 + np.sin(2 * np.pi * hz(m + det) * t)
    return filt(s, 900) * env(len(t), a, r) / len(ms)
def pluck(m, d=.5):
    t = T(d); f = hz(m)
    return (np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 20)) * np.exp(-t * 9) * env(len(t), .002, .05)
def kick(g=1):
    t = T(.35); return np.sin(2 * np.pi * (48 + 90 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * g
def shaker():
    n = rng.standard_normal(int(SR * .06)); return filt(n, 6000, 'high') * np.exp(-np.arange(len(n)) / SR * 70)
def rim():
    t = T(.08); return (np.sin(2 * np.pi * 1700 * t) * .5 + filt(rng.standard_normal(len(t)), 2500, 'high')) * np.exp(-t * 60)

# 1) pluie (0 – 16.4 puis 20.4 – 24.9), légère
rain = filt(rng.standard_normal(N), 3500) - filt(rng.standard_normal(N), 300) * .3
rain = filt(rain, 200, 'high') * 0.10
rg = gate(0, 7.6, .01, .8) + gate(20.3, 23.0, .5, .5) * .7
for ch in (0, 1): mus[ch] += rain * rg * (0.9 if ch else 1.0)
for k in range(140):
    at = rng.uniform(0, 7.5); d = T(.03)
    add(mus, np.sin(2 * np.pi * rng.uniform(2500, 5000) * d) * np.exp(-d * 160), at, .03, rng.uniform(-.8, .8))

# 2) nuit : Rhodes ré mineur 9 (0 – 7.3)
for at, ch in ((0.0, (50, 57, 60, 64, 65)), (3.6, (46, 53, 57, 60, 62))):
    for k, m in enumerate(ch): add(mus, rhodes(m, 4.2, .16), at + k * 0.05, 1, (k - 2) * .25)
# arpège discret 3.6 – 7.3 (92 bpm, croches)
spb = 60 / 92; arp = [62, 65, 69, 72, 69, 65]
for i, b in enumerate(np.arange(3.6, 7.3, spb / 2)): add(mus, pluck(arp[i % 6] + 12, .4), b, .06, .4 if i % 2 else -.4)

# 3) tension (7.3 – 14.5) : bourdon + cluster + pulsation filtrée
t = T(7.4)
drone = (np.sin(2 * np.pi * hz(26) * t) + .5 * np.sin(2 * np.pi * hz(38) * t) + .2 * np.sin(2 * np.pi * hz(39) * t)) * env(len(t), .8, 1.2)
add(mus, drone, 7.3, .22)
add(mus, pad((62, 63, 69), 7.0, 1.5, 1.5), 7.4, .10)
for i, b in enumerate(np.arange(12.5, 14.5, spb / 4)):
    add(mus, filt(pluck(38, .2), 400), b, .18)
# montée (riser) vers l'appel
t = T(2.0); rs = filt(rng.standard_normal(len(t)), 1500) * (t / 2) ** 2
add(mus, rs, 12.5, .12)

# 4) appel (14.5 – 16.4) : juste une nappe suspendue
add(mus, pad((53, 60, 67, 70), 2.4, .3, .6), 14.4, .10)

# 5) groove soulagement fa majeur (16.4 – fin)
prog = [(46, (58, 62, 65, 69)), (41, (57, 60, 65, 67)), (48, (55, 60, 64, 67)), (50, (57, 60, 62, 65))]  # Sib7M, Fa, Do, Rém
bar = spb * 4; t0 = 16.4
for bi, b in enumerate(np.arange(t0, DUR, bar)):
    root, ch = prog[bi % 4]
    for k, m in enumerate(ch): add(mus, rhodes(m, bar + .8, .11), b + k * .02, 1, (k - 1.5) * .3)
    for q in range(4):
        x = b + q * spb
        if x >= DUR: break
        if q in (0, 2): add(mus, kick(), x, .45)
        if q in (1, 3): add(mus, rim(), x, .10, .2)
        add(mus, np.sin(2 * np.pi * hz(root - 12) * T(spb * .9)) * env(int(SR * spb * .9), .01, .2), x, .20)
        for s in range(4): add(mus, shaker(), x + s * spb / 4, .05 if s % 2 else .08, -.3)
# mélodie qui monte au moment du produit (24.9 –)
mel = [(24.95, 69), (25.3, 72), (25.65, 74), (26.0, 77), (26.66, 76), (27.0, 74), (27.9, 81), (29.4, 77), (29.75, 79), (30.1, 81), (31.0, 84)]
for at, m in mel: add(mus, pluck(m, .9), at, .10, .15)
# accord final qui résonne
for k, m in enumerate((53, 60, 65, 67, 72)): add(mus, rhodes(m, 2.6, .14), 31.0 + k * .03, 1, (k - 2) * .3)
mus *= gate(0, DUR, .05, 1.2)

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

add(sfx, ding(), 0.03, .30); add(sfx, ding(), 2.05, .26)
for at in (3.42, 7.25, 12.38, 22.45, 24.78): add(sfx, whoosh(.5), at, .35)
add(sfx, pop(700), 3.62, .35)
for at, f in ((4.54, 900), (5.24, 1050), (6.12, 1200)): add(sfx, pop(f), at, .30, .2)
add(sfx, boom(), 8.64, .55); add(sfx, boom(), 9.5, .5)
for at in np.arange(8.66, 9.3, 1 / 12): add(sfx, tick(2600), at, .06, .3)
for at in np.arange(9.52, 10.3, 1 / 12): add(sfx, tick(3000), at, .06, -.3)
add(sfx, thud(.7), 11.0); add(sfx, thud(.7), 11.45); add(sfx, thud(1.1), 11.8); add(sfx, boom(), 11.8, .3)
for k, at in enumerate((12.55, 12.85, 13.15, 13.45)): add(sfx, shutter(), at, .28, (-.5, .5, -.3, .3)[k])
add(sfx, whoosh(.45), 13.83, .25)
for at in (14.62, 15.62): add(sfx, tone2(440, 480, .55), at, .07)
t = T(.3); add(sfx, np.sin(2 * np.pi * np.where(t < .12, 660, 990) * t) * np.exp(-t * 6), 16.4, .22)
for at in (17.4, 18.64, 19.33): add(sfx, check(), at, .22)
kt = 21.45
while kt < 22.6: add(sfx, key(), kt, .16, rng.uniform(-.3, .3)); kt += rng.uniform(.07, .15)
for at in (22.9, 23.25, 23.42, 23.58, 23.76, 23.92): add(sfx, marker(.16), at, .10)
add(sfx, thud(.9), 23.9)
for k, at in enumerate((25.98, 26.13, 26.28, 26.43)): add(sfx, pop(800 + 150 * k), at, .28, (-.4, -.15, .15, .4)[k])
for at in np.arange(26.66, 27.9, .05): add(sfx, tick(2200), at, .05)
add(sfx, ding(), 27.9, .22)
add(sfx, whoosh(.3), 28.5, .2)
add(sfx, pop(600), 29.4, .3)
t = T(.08); add(sfx, filt(rng.standard_normal(len(t)), 1500, 'high') * np.exp(-t * 80), 31.0, .35)
add(sfx, check(), 31.05, .25)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx)
print('ok')
