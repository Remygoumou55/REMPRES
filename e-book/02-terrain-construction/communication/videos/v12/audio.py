"""V12 « Avant le premier appel » (motion design, échiquier) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V12 : violoncelle en ostinato (partie d'échecs tendue) + nappe sombre + cor doux pour le thème,
la mineur -> do majeur, 100 bpm. Thème de 4 notes au cor (la – do – mi – ré) : début, guide, « c'est toi », fin.
Volume très bas sous la voix (règle du client). Voix calée avec 0,5 s d'entrée."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 59.6; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(12)
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
spb = 60 / 100
def cello(m, d, a=.02, r=.08):
    t = T(d); f = hz(m) * (1 + .003*np.sin(2*np.pi*5*t)); ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sin(ph) + .6*np.sin(2*ph) + .35*np.sin(3*ph) + .2*np.sin(4*ph) + .1*np.sin(5*ph)
    return filt(s, 1400) * env(len(t), a, r)
def horn(m, d, a=.15, r=.5):
    t = T(d); ph = 2*np.pi*hz(m)*t; s = np.sin(ph) + .5*np.sin(2*ph) + .25*np.sin(3*ph)
    return filt(s, 1200) * env(len(t), a, r)
def pad(ms, d, a=1.5, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.08): s += np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .3*np.sin(4*np.pi*hz(m+det)*t)
    return filt(s, 1000) * env(len(t), a, r) / (2*len(ms))
def timp(f=58):
    t = T(.8); return filt(np.sin(2*np.pi*(f + 20*np.exp(-t*12))*t) * np.exp(-t*4) + filt(rng.standard_normal(len(t)), 300)*np.exp(-t*30)*.3, 600)
Am, F, C, G, Dm, E = (45,57,60,64), (41,57,60,65), (36,55,60,64), (43,55,59,62), (38,57,62,65), (40,56,59,64)
MOTIF = [(0, 57), (.5, 60), (1.0, 64), (1.75, 62)]
def ostinato(seq, start, stop, g=.18, pg=.4):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + .8, .5, .9), b, pg)
        pat = [ch[0], ch[0]+12, ch[0]+7, ch[0]+12] * 2
        for q, m in enumerate(pat):
            x = b + q*spb/2
            if x < stop: add(mus, cello(m, spb*.45), x, g * (1 if q % 2 == 0 else .7), (-.2, .2)[q % 2])
        b += spb*4; k += 1
# 1) ACCROCHE (0 – 5)
add(mus, pad(Am[1:], 5.2, .3, 1.2), -.3, .45)
for dt, m in MOTIF: add(mus, horn(m, 1.4), .1 + dt*spb, .2)
add(mus, timp(), 1.81, .35)
# 2) PROBLÈME + AGGRAVATION (5 – 34.6) : ostinato de violoncelle
ostinato([Am, F, C, E], 5.0, 18.3, .16)
ostinato([Dm, Am, F, E], 18.3, 34.4, .18, .45)
for at in (9.6, 13.8, 18.37, 27.68): add(mus, timp(), at, .28)
add(mus, pad((33, 45), 1.6, .1, 1.2), 33.0, .35)
# 3) SOLUTION (34.6 – 54.4) : do majeur, le cor chante
for dt, m in MOTIF: add(mus, horn(m + 3, 1.5), 34.75 + dt*spb, .18)
ostinato([C, G, Am, F], 36.0, 50.0, .12, .5)
for dt, m in MOTIF: add(mus, horn(m + 3, 1.6), 50.2 + dt*spb, .2)
add(mus, timp(52), 50.16, .35)
ostinato([F, G, C, C], 51.6, 57.6, .12, .5)
for dt, m in MOTIF + [(2.5, 64)]: add(mus, horn(m + 3, 1.6), 54.5 + dt*spb, .16)
add(mus, pad((48, 55, 60, 64), 2.6, .3, 1.8), 57.2, .5)
mus = filt(mus, 4200)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (rares, très doux) ----------
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
def wood():
    t = T(.18); return filt(np.sin(2*np.pi*240*t) + .4*np.sin(2*np.pi*520*t), 1500) * np.exp(-t*30)
def paper(d=.3):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 900, 'high'), 4000) * np.sin(np.pi*t/d)
add(sfx, whoosh(.8), 3.6, .2)                       # retour en arrière
add(sfx, wood(), 9.6, .4)                           # le pion se pose
for k in range(4): add(sfx, wood(), 11.9 + k*.12, .25)
for at in (18.37, 19.49, 20.93): add(sfx, paper(), at, .25)
add(sfx, whoosh(), 34.6, .15)
for k in range(4): add(sfx, wood(), 50.6 + k*.1, .3)   # les pièces tombent
add(sfx, whoosh(.9), 54.5, .12)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
