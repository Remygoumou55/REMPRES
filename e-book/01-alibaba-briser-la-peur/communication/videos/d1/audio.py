"""D1 « Par où commencer » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « carnet de croquis » : ukulélé (cordes pincées), piano jouet, claquements de doigts doux. Joyeux et léger.
Do majeur, 104 bpm. Thème de 5 notes au piano jouet (sol – do – ré – mi – do) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 46.0; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(101)
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
spb = 60 / 104
def uke(m, d=.9):
    p = int(SR / hz(m)); buf = rng.uniform(-1, 1, p); out = np.zeros(int(SR*d))
    for i in range(len(out)):
        out[i] = buf[i % p]; buf[i % p] = .5*(buf[i % p] + buf[(i+1) % p]) * .994
    return filt(out, 3000) * env(len(out), .002, .2)
def toy(m, d=1.0):
    t = T(d); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .5*np.sin(2*np.pi*f*3.9*t)*np.exp(-t*12)) * np.exp(-t*4) * np.clip(t/.002, 0, 1)
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .02, .3) * np.exp(-t*1.5)
def snap(): t = T(.08); return filt(filt(rng.standard_normal(len(t)), 1800, 'high'), 7000) * np.exp(-t*70)
C, Am, F, G, Dm, Em = (48,60,64,67), (45,57,60,64), (41,57,60,65), (43,55,59,62), (38,57,62,65), (40,55,59,64)
MOTIF = [(0, 79), (.5, 84), (1.0, 86), (1.5, 88), (2.25, 84)]
def strum(seq, start, stop, g=.17, sn=True):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//8) % len(seq)]
        if k % 8 == 0: add(mus, bass(ch[0], spb*4), b, .3)
        if k % 2 == 0 or k % 8 == 3:
            for j, m in enumerate(ch[1:]): add(mus, uke(m), b + j*.012, g, (j-1)*.3)
        if sn and k % 4 == 2: add(mus, snap(), b, .14)
        b += spb/2; k += 1
for dt, m in MOTIF: add(mus, toy(m), .05 + dt*spb, .25)
strum([C, G], 0, 4.1, .14, False)
strum([Am, F, C, G], 4.1, 13.6, .15)
# « d'autres avancent » : on remonte
strum([F, G, Em, Am, F, G, C, C], 13.6, 22.4, .16)
for dt, m in MOTIF: add(mus, toy(m), 22.41 + dt*spb, .22)
strum([C, Am, F, G], 22.4, 36.3, .17)
for i, at in enumerate((24.60, 25.63, 26.79, 28.24, 29.36)): add(mus, toy(72 + [0,2,4,5,7][i], .6), at, .12)
for dt, m in MOTIF + [(3.0, 91)]: add(mus, toy(m, 1.4), 36.4 + dt*spb, .24)
strum([F, G], 36.3, 40.2, .15); strum([C], 40.2, 45.6, .15, False)
mus = filt(mus, 4800)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def pencil(d=.5):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 2500, 'high'), 6500) * (.5 + .5*np.sin(2*np.pi*11*t)**2) * np.sin(np.pi*t/d)
def page():
    t = T(.35); return filt(filt(rng.standard_normal(len(t)), 700, 'high'), 4000) * np.sin(np.pi*t/.35)**2
def pop_(): t = T(.1); return filt(np.sin(2*np.pi*700*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2500)
add(sfx, pencil(.8), .3, .15)
add(sfx, page(), 11.24, .2)
add(sfx, pencil(.4), 18.4, .12); add(sfx, pencil(.4), 19.6, .12)
add(sfx, pop_(), 32.25, .15)
add(sfx, page(), 33.43, .18)
add(sfx, pencil(.7), 40.6, .14)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
