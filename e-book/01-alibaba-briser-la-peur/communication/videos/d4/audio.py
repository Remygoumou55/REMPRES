"""D4 « Pas besoin d'aller en Chine » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « voyage » : guitare acoustique en picking, shaker doux, petite cloche d'aéroport (ding-dong) au début. Optimiste.
Ré majeur, 100 bpm. Thème de 5 notes à la guitare haute (la – ré – fa# – mi – ré) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 37.2; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(404)
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
def gtr(m, d=1.2):
    p = int(SR / hz(m)); buf = filt(rng.uniform(-1, 1, p), 3000); out = np.zeros(int(SR*d))
    for i in range(len(out)):
        out[i] = buf[i % p]; buf[i % p] = .5*(buf[i % p] + buf[(i+1) % p]) * .997
    return filt(out, 3500) * env(len(out), .002, .3)
def shaker(): t = T(.09); return filt(filt(rng.standard_normal(len(t)), 4000, 'high'), 9000) * np.sin(np.pi*t/.09)
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .02, .3) * np.exp(-t*1.2)
def chime(m, d=1.6): t = T(d); return (np.sin(2*np.pi*hz(m)*t) + .3*np.sin(2*np.pi*hz(m)*3*t)*np.exp(-t*6)) * np.exp(-t*2.5)
D, Bm, G, A, Em, Fs = (38,62,66,69), (35,59,62,66), (43,59,62,67), (45,61,64,69), (40,59,64,67), (42,61,66,69)
MOTIF = [(0, 81), (.5, 86), (1.0, 90), (1.5, 88), (2.25, 86)]
def pick(seq, start, stop, g=.13, sh=True):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//8) % len(seq)]
        if k % 8 == 0: add(mus, bass(ch[0], spb*4), b, .3)
        pat = [ch[1], ch[3], ch[2], ch[3]]
        add(mus, gtr(pat[k % 4] + 12 * (k % 8 == 6)), b, g, .3 if k % 2 else -.3)
        if sh and k % 2 == 1: add(mus, shaker(), b, .1)
        b += spb/2; k += 1
add(sfx, chime(76), .1, .18); add(sfx, chime(72), .55, .18)
for dt, m in MOTIF: add(mus, gtr(m, 1.6), .9 + dt*spb, .22)
pick([D, A], 0, 3.7, .1, False)
pick([Bm, G, Em, A], 3.7, 12.6, .12)
for dt, m in MOTIF: add(mus, gtr(m, 1.6), 12.73 + dt*spb, .2)
pick([D, A, Bm, G], 12.6, 27.4, .14)
pick([G, A], 27.4, 31.8, .13); pick([D], 31.8, 36.8, .12, False)
for dt, m in MOTIF + [(3.0, 93)]: add(mus, gtr(m, 2.0), 27.44 + dt*spb, .22)
mus = filt(mus, 4500)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def tear():
    t = T(.45); return filt(filt(rng.standard_normal(len(t)), 1200, 'high'), 6000) * (np.abs(np.sin(2*np.pi*35*t))**.5) * np.exp(-t*4)
def stamp(): t = T(.3); return filt(rng.standard_normal(len(t)), 300)*np.exp(-t*20) + .5*np.sin(2*np.pi*90*t)*np.exp(-t*18)
def whoosh(d=.6): t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
add(sfx, stamp(), 1.0, .3); add(sfx, tear(), 1.3, .25)
add(sfx, whoosh(.5), 13.36, .15)
add(sfx, stamp(), 31.83, .2)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
