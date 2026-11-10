"""M3 « D'où vient ce produit ? » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « enquête » feutré : contrebasse pizzicato qui marche, piano étouffé, petite caisse aux balais ; puis s'éclaire en majeur à « aller à la source ».
Ré mineur -> ré majeur, 90 bpm. Thème de 4 notes au piano (ré – fa – la – sol). Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 40.9; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(909)
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
spb = 60 / 90
def dbass(m):
    t = T(.6); f = hz(m); return (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t)*np.exp(-t*10)) * np.exp(-t*5) * np.clip(t/.005, 0, 1)
def pno(m, d=1.6):
    t = T(d); f = hz(m); return filt((np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t)*np.exp(-t*4)) * np.exp(-t*2.2) * np.clip(t/.004, 0, 1), 2200)
def brush(): t = T(.16); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 6000) * np.exp(-t*25)
WALK_MIN = [38, 41, 43, 45, 46, 45, 43, 41]
WALK_MAJ = [38, 42, 45, 47, 50, 47, 45, 42]
MOTIF = [(0, 74), (.5, 77), (1.0, 81), (1.75, 79)]
for dt, m in MOTIF: add(mus, pno(m), .05 + dt*spb, .26)
b = 0; k = 0
while b < 23.1:
    add(mus, dbass(WALK_MIN[k % 8]), b, .3); add(mus, brush(), b + spb/2, .06)
    if k % 4 == 0: [add(mus, pno(m, 1.4), b, .07) for m in (62, 65, 69)]
    b += spb; k += 1
for dt, m in MOTIF: add(mus, pno(m + (4 if dt == .5 else 0)), 23.16 + dt*spb, .26)
b = 23.4; k = 0
while b < 35.4:
    add(mus, dbass(WALK_MAJ[k % 8]), b, .3); add(mus, brush(), b + spb/2, .06)
    if k % 4 == 0: [add(mus, pno(m, 1.4), b, .08) for m in (62, 66, 69)]
    b += spb; k += 1
for dt, m in MOTIF + [(2.5, 86)]: add(mus, pno(m + 4 if m == 77 else m, 2.2), 35.8 + dt*spb*.8, .22)
add(mus, sum(pno(m, 4.0) for m in (50, 57, 62, 66)) / 4, 37.4, .4)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def stampsnd(): t = T(.3); return filt(rng.standard_normal(len(t)), 300)*np.exp(-t*20) + .5*np.sin(2*np.pi*90*t)*np.exp(-t*18)
def snip(): t = T(.25); return filt(filt(rng.standard_normal(len(t)), 2500, 'high'), 7000) * (np.exp(-t*30) + np.exp(-np.abs(t-.12)*60))
for i in range(4): add(sfx, stampsnd(), 8.72 + i*.12, .18)
add(sfx, stampsnd(), 22.34, .22)
add(sfx, snip(), 23.7, .2)
add(sfx, stampsnd(), 35.8, .25)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
