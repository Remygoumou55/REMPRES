"""F5 « La fausse usine » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « plateau de cinéma » : ostinato de cordes en staccato (feutré), cor doux, petite caisse claire aux balais très légère.
Ré mineur -> fa majeur, 96 bpm. Thème de 4 notes au cor (ré – fa – la – sol) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 37.8; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(55)
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
def saw(f, t): return 2*((f*t) % 1) - 1
def stac(m, d=.22):
    t = T(d); s = sum(saw(hz(m)*(1+det), t) for det in (-.003, 0, .003)) / 3
    return filt(s, 1800) * env(len(t), .01, .12)
def horn(m, d=1.6):
    t = T(d); s = sum(saw(hz(m)*(1+det), t) for det in (-.002, .002)) / 2
    return filt(s, 900) * env(len(t), .18, .6)
def pad(ms, d, a=1.4, r=1.6):
    t = T(d); s = sum(saw(hz(m)*(1+det), t) for m in ms for det in (-.004, .004)) / (2*len(ms))
    return filt(s, 900) * env(len(t), a, r)
def brush():
    t = T(.18); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 6000) * np.exp(-t*25)
def boom():
    t = T(1.2); return np.sin(2*np.pi*(55 + 20*np.exp(-t*8))*t) * np.exp(-t*3.5)
Dm, Bb, F, C, Gm, A = (50,57,62,65), (46,58,62,65), (41,57,60,65), (48,55,60,64), (43,58,62,67), (45,57,61,64)
MOTIF = [(0, 62), (.5, 65), (1.0, 69), (1.75, 67)]
def section(seq, start, stop, pg=.4, st=.18):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[(k//8) % len(seq)]
        if k % 8 == 0: add(mus, pad(ch[1:], min(spb*8, stop-b)+1, .6, 1.0), b, pg)
        add(mus, stac(ch[0] + (12 if k % 2 else 0)), b, st, .25 if k % 2 else -.25)
        b += spb/2; k += 1
for dt, m in MOTIF: add(mus, horn(m), .05 + dt*spb*2, .28)
add(mus, boom(), 2.0, .35)
section([Dm, Bb], 0, 11.1, .35, .16)
section([Gm, Dm, Bb, A], 11.1, 18.3, .42, .2)
b = 11.2
while b < 18.0: add(mus, brush(), b, .08); b += spb
for dt, m in MOTIF: add(mus, horn(m + 3), 18.43 + dt*spb*2, .24)
section([F, C, Dm, Bb], 18.4, 27.5, .4, .18)
b = 18.5
while b < 27.3: add(mus, brush(), b, .07); add(mus, brush(), b + spb/2, .04); b += spb
for dt, m in MOTIF + [(2.5, 72)]: add(mus, horn(m + 3 if m != 72 else 72, 2.0), 27.56 + dt*spb*2, .26)
section([F, C], 27.5, 33.0, .4, .14)
add(mus, pad((53, 57, 60, 65), 4.8, .4, 2.5), 33.0, .5)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
def clap():
    t = T(.25); return filt(rng.standard_normal(len(t)), 3000) * np.exp(-t*40) + .5*np.sin(2*np.pi*180*t)*np.exp(-t*30)
def flip():
    t = T(.2); return filt(filt(rng.standard_normal(len(t)), 800, 'high'), 4000) * np.sin(np.pi*t/.2)
add(sfx, whoosh(1.0), 1.95, .2)
for i in range(3): add(sfx, flip(), 16.16 + i*.25, .12)
add(sfx, clap(), 28.3, .35)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
