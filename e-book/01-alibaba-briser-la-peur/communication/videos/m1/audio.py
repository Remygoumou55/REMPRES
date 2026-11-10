"""M1 « Ton fournisseur l'a fait » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « marché » : balafon (xylophone africain en bois), shékéré doux (calebasse) et basse ronde. Joyeux, motivant.
Sol majeur, 108 bpm. Thème de 5 notes au balafon (ré – sol – la – si – la) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 43.1; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(606)
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
spb = 60 / 108
def bala(m, d=.7):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t) + .5*np.sin(2*np.pi*f*3.9*t)*np.exp(-t*25) + .25*np.sin(2*np.pi*f*9.2*t)*np.exp(-t*60)
    buzz = filt(rng.standard_normal(len(t)), 1200) * .08 * np.exp(-t*12)
    return (s + buzz) * np.exp(-t*7) * np.clip(t/.002, 0, 1)
def shek(): t = T(.12); return filt(filt(rng.standard_normal(len(t)), 3000, 'high'), 8000) * np.sin(np.pi*t/.12)**2
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .02, .2) * np.exp(-t*2)
def pad(ms, d, a=1.2, r=1.4):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) for m in ms for det in (-.05, .05)); return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
G, C, D, Em = (43,62,67,71), (36,60,64,67), (38,62,66,69), (40,59,64,67)
MOTIF = [(0, 74), (.5, 79), (1.0, 81), (1.5, 83), (2.25, 81)]
RIFF = [0, 2, 4, 2, 5, 4, 2, 4]
def groove(seq, start, stop, g=.13, full=True):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//8) % len(seq)]
        if k % 8 == 0: add(mus, pad(ch[1:], spb*4+.6), b, .25); add(mus, bass(ch[0], spb*1.5), b, .3)
        if k % 8 == 4: add(mus, bass(ch[0]+7, spb), b, .22)
        notes = ch[1:] + (ch[1]+12, ch[2]+12)
        if full or k % 2 == 0: add(mus, bala(notes[RIFF[k % 8] % len(notes)]), b, g, .35 if k % 2 else -.35)
        if k % 2 == 1: add(mus, shek(), b, .09)
        b += spb/2; k += 1
for dt, m in MOTIF: add(mus, bala(m, 1.0), .05 + dt*spb, .3)
groove([G, D], 0, 3.5, .1, False)
groove([G, C, Em, D], 3.5, 11.7, .12)
groove([Em, C, Em, D], 11.7, 22.9, .1, False)
for dt, m in MOTIF: add(mus, bala(m, 1.0), 23.1 + dt*spb, .26)
groove([G, C, D, G], 23.0, 33.4, .13)
groove([C, D], 33.4, 37.8, .12); groove([G], 37.8, 42.7, .1, False)
for dt, m in MOTIF + [(3.0, 86)]: add(mus, bala(m, 1.2), 33.5 + dt*spb, .26)
mus = filt(mus, 4800)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def horn(): t = T(.6); return filt(np.sin(2*np.pi*180*t) + .5*np.sin(2*np.pi*270*t), 1200) * env(len(t), .05, .3)
def pop_(): t = T(.1); return filt(np.sin(2*np.pi*700*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2500)
add(sfx, horn(), 1.4, .12)
for k, at in enumerate((13.4, 15.8, 16.8, 17.6, 21.0)): add(sfx, pop_(), at, .1)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
