"""D2 « La peur de perdre son argent » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style : nappe nocturne (synthé doux) + harpe de verre en arpèges lents, puis un battement chaud et rassurant quand le bouclier arrive.
La mineur -> do majeur, 78 bpm. Thème de 4 notes (mi – la – do – si) : début, « pourtant », fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 39.2; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(202)
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
spb = 60 / 78
def bell(m, d=2.4):
    t = T(d); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*f*2.01*t)*np.exp(-t*3) + .1*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*9)) * np.exp(-t*1.8) * np.clip(t/.003, 0, 1)
def pad(ms, d, a=1.6, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.08):
            ph = 2*np.pi*hz(m+det)*t + rng.uniform(0, 6); s += np.sin(ph) + .35*np.sin(2*ph) + .15*np.sin(3*ph)
    return filt(s, 1000) * env(len(t), a, r) / (2*len(ms))
def kick(): t = T(.4); return np.sin(2*np.pi*(55 + 40*np.exp(-t*25))*t) * np.exp(-t*8)
Am, F, C, G, Dm, E7 = (45,60,64,69), (41,60,65,69), (48,60,64,67), (43,59,62,67), (38,60,65,69), (40,59,64,68)
MOTIF = [(0, 76), (.5, 81), (1.0, 84), (1.75, 83)]
def bars(seq, start, stop, pg=.5):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + 1.2, .9, 1.2), b, pg); add(mus, pad((ch[0],), d + .4, .2, .6), b, .3)
        b += spb*4; k += 1
def arps(seq, start, stop, g=.12):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//8) % len(seq)]; add(mus, bell(ch[1:][k % 3] + 12, 1.4), b, g, .3 if k % 2 else -.3); b += spb/2; k += 1
for dt, m in MOTIF: add(mus, bell(m), .05 + dt*spb, .3)
bars([Am, F, Dm, E7], 0, 13.8, .5)
arps([Am, F, Dm, E7], 5.0, 13.6, .08)
for dt, m in MOTIF: add(mus, bell(m + 3), 13.88 + dt*spb, .26)
bars([C, G, Am, F], 13.8, 29.6, .5)
arps([C, G, Am, F], 14.6, 29.5, .1)
b = 15.0
while b < 29.3: add(mus, kick(), b, .22); b += spb*2
bars([F, G], 29.6, 33.7, .5); bars([C], 33.7, 38.8, .55)
for dt, m in MOTIF + [(2.5, 88)]: add(mus, bell(m + 3 if m != 88 else 84, 2.8), 29.62 + dt*spb, .24)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
def shine():
    t = T(1.2); return sum(np.sin(2*np.pi*hz(m)*t)*np.exp(-t*3) for m in (88, 91, 95)) / 3
def thud(): t = T(.4); return filt(rng.standard_normal(len(t)), 200)*np.exp(-t*12) + .5*np.sin(2*np.pi*65*t)*np.exp(-t*10)
add(sfx, whoosh(1.2), .3, .15)
add(sfx, thud(), 3.75, .3)
add(sfx, shine(), 14.6, .2)
add(sfx, whoosh(.5), 22.0, .15)
add(sfx, shine(), 29.62, .18)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
