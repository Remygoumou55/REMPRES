"""T4 « Au nom de qui ? » (motion design) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à T4 : kalimba doux (piano à pouces), basse chaude, petit groove léger (claquements de doigts, shaker),
ré mineur -> fa majeur, 96 bpm. Thème de 5 notes au kalimba (ré – fa – la – sol – fa) : début, guide, fin.
Tout est filtré (pas d'aigus). Voix calée avec 0,5 s d'entrée."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 50.0; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(44)
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
spb = 60 / 96
def kalimba(m, d=1.8, vel=1.0):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*5.4*f*t)*np.exp(-t*40) + .15*np.sin(2*np.pi*2*f*t)*np.exp(-t*6)
    return filt(s * np.exp(-t*3.2) * env(len(t), .003, .2), 2800) * vel
def pad(ms, d, a=1.2, r=1.5):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.08):
            ph = rng.uniform(0, 1); s += 2*((hz(m+det)*t + ph) % 1) - 1
    return filt(filt(s, 800), 120, 'high') * env(len(t), a, r) / (2*len(ms))
def bass(m, d):
    t = T(d); return filt(np.sin(2*np.pi*hz(m)*t) + .4*np.sin(2*np.pi*2*hz(m)*t), 400) * np.exp(-t*1.5) * env(len(t), .01, .15)
def kick():
    t = T(.35); return np.sin(2*np.pi*(52 + 45*np.exp(-t*30))*t) * np.exp(-t*11)
def snap():
    t = T(.08); return filt(filt(rng.standard_normal(len(t)), 900, 'high'), 3500) * np.exp(-t*60)
def shk():
    n = filt(filt(rng.standard_normal(int(SR*.06)), 2000, 'high'), 4500); return n * np.exp(-np.arange(len(n))/SR*70)
Dm, Bb, F, C, Gm, A = (38,57,60,65), (34,58,62,65), (41,57,60,65), (36,55,60,64), (43,55,58,62), (33,57,61,64)
MOTIF = [(0, 62), (.5, 65), (1.0, 69), (1.5, 67), (2.25, 65)]
def bars(seq, start, stop, groove=True, kg=.12, pg=.4):
    b = start; k = 0
    while b < stop - .15:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + .8, .5, .9), b, pg)
        for q in (0, 1.5, 2.5):
            if b + q*spb < stop: add(mus, bass(ch[0], spb*1.2), b + q*spb, .4)
        for q, n in enumerate([1, 2, 3, 2, 1, 3, 2, 3]):
            x = b + q*spb/2
            if x < stop and q % 2 == 0: add(mus, kalimba(ch[n] + 12, 1.4, .8), x, kg, (-.3, .3)[q % 4 == 0])
        if groove:
            for q in range(4):
                x = b + q*spb
                if x >= stop: break
                if q in (0, 2): add(mus, kick(), x, .3)
                if q in (1, 3): add(mus, snap(), x, .08, .25)
                add(mus, shk(), x + spb/2, .035, -.3)
        b += spb*4; k += 1
# 1) ACCROCHE (0 – 2.9) : le thème au kalimba
add(mus, pad(Dm[1:], 3.4, .2, 1.0), -.2, .4)
for dt, m in MOTIF: add(mus, kalimba(m, 2.0, 1.0), .05 + dt*spb, .22, .1)
# 2) PROBLÈME (2.9 – 12) : groove léger
bars([Dm, Bb, F, C], 2.9, 12.0)
# 3) AGGRAVATION (12 – 24.1) : sans rythme, plus grave
bars([Dm, Gm, Bb, A], 12.0, 23.9, groove=False, kg=.09, pg=.5)
b = 12.05
while b < 23.6: add(mus, kick(), b, .2); b += spb*2
add(mus, pad((26, 38), 1.0, .05, .8), 23.0, .35)
# 4) SOLUTION (24.1 – 38.2) : lumière, fa majeur
for dt, m in MOTIF: add(mus, kalimba(m + 3, 2.0, 1.0), 24.15 + dt*spb, .18, -.1)
bars([F, C, Dm, Bb], 24.1, 38.2, kg=.11)
# 5) ACTION (38.2 – fin)
add(mus, pad(Bb[1:], 2.2, .1, 1.0), 38.2, .45)
bars([Bb, F, C, F], 40.45, 47.3, kg=.11)
for dt, m in MOTIF + [(3.0, 74)]: add(mus, kalimba(m + 3, 2.2, .9), 44.8 + dt*spb, .16)
for k, m in enumerate((41, 53, 57, 60, 65)): add(mus, kalimba(m + 12, 3.0, .8), 47.3 + k*.05, .14, (k-2)*.2)
add(mus, pad((53, 57, 60, 65), 2.4, .2, 1.8), 47.25, .5)
mus = filt(mus, 4500)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (peu nombreux, doux) ----------
def whoosh(d=.5):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2500) * np.sin(np.pi*t/d)**2
def pop(f=700):
    t = T(.12); return filt(np.sin(2*np.pi*f*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2500)
def thud(g=1.0):
    t = T(.4); return np.sin(2*np.pi*(60 + 55*np.exp(-t*24))*t) * np.exp(-t*11) * g
def key():
    t = T(.05); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 4000) * np.exp(-t*120)
def pen(d=1.0):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 3500) * (.5 + .5*np.sin(2*np.pi*7*t)) * env(len(t), .05, .1)
for at in (2.85, 12.05, 24.1, 31.45, 35.95, 38.2, 44.6): add(sfx, whoosh(), at - .25, .18)
for k in range(3): add(sfx, key(), .5 + k*.1, .2)
add(sfx, pop(600), 4.03, .25)
add(sfx, pen(1.0), 7.6, .2)
add(sfx, thud(.6), 14.85, .35)            # c'est lui
add(sfx, thud(.6), 19.4, .3)             # 0 preuve
add(sfx, pop(800), 34.95, .25)           # TOI ✓
add(sfx, thud(.7), 43.4, .35)            # jamais
for at in (44.85, 45.05, 45.25, 45.45): add(sfx, pop(650), at, .15)
add(sfx, pop(900), 47.23, .25)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
