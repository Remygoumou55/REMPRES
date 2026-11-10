"""V7 « L'héritier » (motion design, coupe du terrain et racines) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V7 : célesta (petites cloches douces) + nappe de chœur feutrée (« aah ») + tambour sur cadre très doux.
Si mineur -> ré majeur, 76 bpm. Thème de 5 notes au célesta (fa# – si – do# – ré – do#) : début, « pourtant », fin.
Volume très bas sous la voix."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 58.6; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(7)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)
def T(d): return np.arange(int(SR * d)) / SR
def filt(x, f, kind='low', o=2): return sosfilt(butter(o, f, kind, fs=SR, output='sos'), x)
def bp(x, f, q=6): return sosfilt(butter(2, [f*(1-1/q), f*(1+1/q)], 'band', fs=SR, output='sos'), x)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / max(a, 1e-4), 0, 1) * np.clip((d - t) / max(r, 1e-4), 0, 1)
def add(buf, s, at, g=1.0, pan=0.0):
    i = int((at + LEAD) * SR); j = min(N, i + len(s))
    if i >= N or j <= 0 or i < 0: return
    s = s[:j - i] * g; buf[0, i:j] += s * (1 - max(0, pan)); buf[1, i:j] += s * (1 + min(0, pan))
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
spb = 60 / 76
def cel(m, d=2.2):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t)*np.exp(-t*2.2) + .35*np.sin(2*np.pi*f*4.01*t)*np.exp(-t*7) + .12*np.sin(2*np.pi*f*7.2*t)*np.exp(-t*12)
    return s * np.clip(t/.002, 0, 1)
def choir(ms, d, a=1.5, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.1, 0.0, 0.1):
            ph = 2*np.pi*hz(m+det)*t*(1 + .003*np.sin(2*np.pi*5*t)) + rng.uniform(0, 6)
            s += 2*(ph/(2*np.pi) % 1) - 1
    v = bp(s, 700, 3) + .6*bp(s, 1150, 4) + .3*bp(s, 2600, 6)
    return v * env(len(t), a, r) / (3*len(ms))
def drum(f=75):
    t = T(.5); return filt(np.sin(2*np.pi*(f + 30*np.exp(-t*25))*t)*np.exp(-t*7) + .15*rng.standard_normal(len(t))*np.exp(-t*30), 900)
def low(m, d):
    t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .1, .6)
Bm, G, D, A, Em, Fs = (35,62,66,71), (31,62,67,71), (38,62,66,69), (33,61,64,69), (40,62,67,71), (30,61,66,70)
MOTIF = [(0, 78), (.5, 83), (1.0, 85), (1.5, 86), (2.25, 85)]
def bars(seq, start, stop, pg=.5):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, choir(ch[1:], d + 1.2, .9, 1.2), b, pg)
        add(mus, low(ch[0], d + .3), b, .3)
        b += spb*4; k += 1
# 1) ACCROCHE + PROBLÈME (0 – 16)
for dt, m in MOTIF: add(mus, cel(m), .05 + dt*spb, .3)
bars([Bm, G, D, Fs], 0, 16.0, .5)
for at, m in ((5.64, 71), (7.4, 74), (9.5, 73)): add(mus, cel(m, 2.0), at, .14)
# souvenir : célesta seul, plus haut
for k, m in enumerate((83, 81, 78, 76, 78)): add(mus, cel(m, 1.8), 11.2 + k*spb*.75, .12)
# 2) AGGRAVATION (16 – 29.8) : grave + tambour lent
bars([Em, Bm, G, Fs], 16.0, 29.8, .55)
b = 16.1
while b < 29.4: add(mus, drum(70), b, .3); add(mus, drum(95), b + spb*1.5, .12); b += spb*2
# 3) SOLUTION (29.8 – 52.2) : le thème revient, le tambour devient vivant
for dt, m in MOTIF: add(mus, cel(m), 29.8 + dt*spb, .28)
bars([D, A, Bm, G], 31.8, 52.2, .5)
b = 35.1; k = 0
while b < 51.9:
    add(mus, drum(80), b, .22); add(mus, drum(120), b + spb*.5, .07, .25); add(mus, drum(100), b + spb*.75, .1, -.25)
    if k % 2 == 0: add(mus, cel([74, 78, 81, 78][(k//2) % 4], 1.4), b + spb*.5, .08, .3)
    b += spb; k += 1
for dt, m in MOTIF: add(mus, cel(m + 3, 2.4), 44.3 + dt*spb, .18)
# 4) FIN
bars([G, A], 52.2, 54.4, .5); bars([D], 54.4, 58.2, .55)
for dt, m in MOTIF + [(3.0, 90)]: add(mus, cel(m + 3 if m < 90 else m, 2.6), 52.2 + dt*spb, .2)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
# ---------- BRUITAGES (rares, très doux) ----------
def thud():
    t = T(.5); return filt(rng.standard_normal(len(t)), 200) * np.exp(-t*10) + .6*np.sin(2*np.pi*60*t)*np.exp(-t*9)
def chain(d=1.0):
    out = np.zeros(int(SR*d))
    for k in range(14):
        i = int(rng.uniform(0, d-.08)*SR); t = T(.06)
        out[i:i+len(t)] += bp(rng.standard_normal(len(t)), rng.uniform(2500, 4200), 8) * np.exp(-t*80)
    return out
def clink(f=2400):
    t = T(.35); return (np.sin(2*np.pi*f*t) + .5*np.sin(2*np.pi*f*2.7*t)) * np.exp(-t*14)
def paper():
    t = T(.35); return filt(filt(rng.standard_normal(len(t)), 900, 'high'), 4500) * np.sin(np.pi*t/.35)**2
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2000) * np.sin(np.pi*t/d)**2
add(sfx, thud(), 3.97, .45)
add(sfx, whoosh(.6), 10.95, .15)
add(sfx, chain(1.1), 16.1, .25)
add(sfx, thud(), 17.5, .4)
for k in range(3): add(sfx, clink(2200 + 300*k), 21.4 + k*.35, .07, (-1)**k*.3)
add(sfx, whoosh(.6), 29.6, .15)
for at in (37.16, 40.87, 42.89): add(sfx, paper(), at, .18)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
