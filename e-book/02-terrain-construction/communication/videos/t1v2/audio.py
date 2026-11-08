"""T1 v2 « La photo » (PASA) : musique + bruitages calés sur voix3/T1.mp3 (46,4 s).
ACCROCHE : impact + coupure nette ; PROBLÈME : pluie + Rhodes ré mineur ; AGGRAVATION : bourdon + pulsation 100 bpm qui accélère,
entrepôt (bourdonnement), argent aspiré, « trop tard » : boom puis silence ; SOLUTION : montée -> groove fa majeur 92 bpm ; ACTION : mélodie + accord final.
Sortie : music.wav et sfx.wav (stéréo 44,1 kHz)."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 48.2; N = int(SR * DUR)
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2):
    return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
    at = at + 0.6  # 0,6 s d'entrée avant « Arrête »
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


# 0) ACCROCHE (0 – 3) : impact grave + tenue grinçante, coupée net à 2.45
t = T(2.6); hit = (np.sin(2*np.pi*(36+70*np.exp(-t*7))*t)*np.exp(-t*2.2))
add(mus, hit, 0.0, .35)
add(mus, pad((50, 51, 57), 2.45, .05, .02), 0.0, .16)
t = T(2.4); stg = np.sin(2*np.pi*hz(74)*t + 3*np.sin(2*np.pi*5.5*t)) * (t/2.4)**2
add(mus, stg, 0.05, .05, .3)

# 1) PROBLÈME (3 – 9.9) : pluie + Rhodes ré mineur, arpège 92 bpm
rain = filt(rng.standard_normal(N), 3500) - filt(rng.standard_normal(N), 300) * .3
rain = filt(rain, 200, 'high') * 0.10
rg = gate(2.9, 9.9, .4, .5) + gate(39.4, 41.4, .3, .4) * .6
for ch in (0, 1): mus[ch] += rain * rg * (0.9 if ch else 1.0)
for at, ch in ((3.0, (50, 57, 60, 64, 65)), (6.3, (46, 53, 57, 60, 62))):
    for k, m in enumerate(ch): add(mus, rhodes(m, 3.9, .15), at + k * 0.05, 1, (k - 2) * .25)
spb = 60 / 92; arp = [62, 65, 69, 72, 69, 65]
for i, b in enumerate(np.arange(4.3, 9.6, spb / 2)): add(mus, pluck(arp[i % 6] + 12, .4), b, .055, .4 if i % 2 else -.4)

# 2) AGGRAVATION (9.9 – 23.4) : bourdon, pulsation qui accélère (100 -> 130 bpm)
t = T(12.3)
drone = (np.sin(2*np.pi*hz(26)*t) + .5*np.sin(2*np.pi*hz(38)*t) + .25*np.sin(2*np.pi*hz(39)*t)) * env(len(t), 1.0, .15)
add(mus, drone, 9.9, .22)
add(mus, pad((62, 63, 69), 6.0, 1.5, 1.0), 9.9, .09)
add(mus, pad((61, 62, 68), 6.2, 1.0, .2), 16.2, .10)
b = 10.0
while b < 22.05:
    bpm = 100 + 30 * (b - 10) / 12
    add(mus, filt(pluck(38, .22), 420), b, .20); add(mus, filt(pluck(38, .18), 420), b + 60/bpm*.5, .09)
    b += 60 / bpm
hum = filt(np.sin(2*np.pi*50*np.arange(N)/SR) + .4*np.sin(2*np.pi*100*np.arange(N)/SR) + .3*filt(rng.standard_normal(N), 400), 600)
for ch in (0, 1): mus[ch] += hum * gate(16.2, 18.3, .2, .3) * .07
t = T(2.0); rs = filt(rng.standard_normal(len(t)), 1800) * (t/2)**2; add(mus, rs, 20.1, .12)
# « trop tard » : boom puis presque silence, un seul piano grave
t = T(3.0); add(mus, np.sin(2*np.pi*(32+50*np.exp(-t*5))*t)*np.exp(-t*1.3), 22.12, .8)
for k, m in enumerate((38, 45, 50, 53)): add(mus, rhodes(m, 1.6, .12), 22.6 + k*.12, 1, (k-1.5)*.3)

# 3) SOLUTION (23.4 –) : montée puis groove fa majeur 92 bpm
add(mus, pad((53, 60, 65, 69), 1.6, .8, .3), 23.4, .12)
prog = [(46, (58, 62, 65, 69)), (41, (57, 60, 65, 67)), (48, (55, 60, 64, 67)), (50, (57, 60, 62, 65))]
bar = spb * 4; t0 = 24.75
for bi, bb in enumerate(np.arange(t0, 46.2, bar)):
    root, ch = prog[bi % 4]
    for k, m in enumerate(ch): add(mus, rhodes(m, bar + .8, .11), bb + k * .02, 1, (k - 1.5) * .3)
    for q in range(4):
        x = bb + q * spb
        if x >= 46.2: break
        if q in (0, 2): add(mus, kick(), x, .45)
        if q in (1, 3): add(mus, rim(), x, .10, .2)
        add(mus, np.sin(2*np.pi*hz(root - 12)*T(spb*.9)) * env(int(SR*spb*.9), .01, .2), x, .20)
        for s in range(4): add(mus, shaker(), x + s*spb/4, .05 if s % 2 else .08, -.3)
mel = [(24.85, 69), (25.2, 72), (25.55, 74), (25.9, 77), (30.2, 76), (31.8, 77), (33.15, 79), (33.85, 81),
       (38.05, 72), (38.25, 74), (38.45, 76), (38.65, 77), (41.55, 81), (42.9, 79), (43.95, 77), (44.6, 84)]
for at, m in mel: add(mus, pluck(m, .9), at, .10, .15)
for k, m in enumerate((53, 60, 65, 67, 72)): add(mus, rhodes(m, 3.0, .14), 45.15 + k*.03, 1, (k-2)*.3)
mus *= gate(0, DUR, .02, 1.2)

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
