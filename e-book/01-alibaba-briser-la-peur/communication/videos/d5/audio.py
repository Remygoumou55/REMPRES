"""D5 « Qui croire ? » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style en deux temps : d'abord un bruit de fond nerveux (pulsation synthé, petits parasites radio), puis à « pas une vidéo de plus »
tout s'arrête et une boîte à musique / harpe calme et claire prend la place. Fa majeur, 92 bpm. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 41.9; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(505)
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
spb = 60 / 92
def pluck(m, d=.3):
    t = T(d); s = 2*((hz(m)*t) % 1) - 1; return filt(s, 1600) * np.exp(-t*14)
def mbox(m, d=1.8):
    t = T(d); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .4*np.sin(2*np.pi*f*3.0*t)*np.exp(-t*5) + .15*np.sin(2*np.pi*f*5.2*t)*np.exp(-t*9)) * np.exp(-t*2.4) * np.clip(t/.002, 0, 1)
def pad(ms, d, a=1.4, r=1.8):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) for m in ms for det in (-.06, .06))
    return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
def kick(): t = T(.3); return np.sin(2*np.pi*(50 + 50*np.exp(-t*30))*t) * np.exp(-t*12)
# 1) le chaos : pulsation nerveuse (sans mélodie claire)
seq = [41, 44, 41, 46, 41, 44, 48, 46]
b = 0; k = 0
while b < 18.9:
    add(mus, pluck(seq[k % 8] + 12 * (k % 3 == 0)), b, .16, .4 if k % 2 else -.4)
    if k % 4 == 0: add(mus, kick(), b, .25)
    b += spb/2; k += 1
b = 0
while b < 18.9: add(mus, pad((53, 56, 60), min(spb*8, 18.9-b)+.5, .8, .6), b, .3); b += spb*8
# 2) le calme : boîte à musique
F, C, Dm, Bb = (53,57,60,65), (48,55,60,64), (50,57,62,65), (46,58,62,65)
MOTIF = [(0, 77), (.5, 81), (1.0, 84), (1.5, 82), (2.25, 81)]
for dt, m in MOTIF: add(mus, mbox(m), 19.4 + dt*spb, .3)
def bars(seq, start, stop, pg=.45):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b); add(mus, pad(ch, d + 1.2, .9, 1.2), b, pg); b += spb*4; k += 1
bars([F, C, Dm, Bb], 19.2, 36.7)
b = 22.1; k = 0; AR = [65, 69, 72, 77, 72, 69]
while b < 36.5: add(mus, mbox(AR[k % 6], 1.2), b, .1, .3 if k % 2 else -.3); b += spb/2; k += 1
bars([Bb, C], 36.7, 38.5); bars([F], 38.5, 41.5, .5)
for dt, m in MOTIF + [(3.0, 89)]: add(mus, mbox(m, 2.4), 36.7 + dt*spb, .25)
mus = filt(mus, 4500)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def static(d=.25): t = T(d); return filt(rng.standard_normal(len(t)), 5000) * env(len(t), .01, .05)
def stamp(): t = T(.3); return filt(rng.standard_normal(len(t)), 300)*np.exp(-t*20) + .5*np.sin(2*np.pi*90*t)*np.exp(-t*18)
for at in (0.1, 3.0, 4.7): add(sfx, static(.2), at, .12)
add(sfx, stamp(), 9.9, .3)
for at in (11.4, 12.7, 14.4): add(sfx, static(.12), at, .08)
add(sfx, static(.5), 18.6, .12)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
