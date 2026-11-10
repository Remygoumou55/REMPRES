"""M2 « Tu sais déjà le plus dur » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style : synthé-pop doux et positif (accords de « pluck » brillants, basse ronde, claps feutrés). Sensation de pièce qui s'emboîte.
Mi bémol majeur, 102 bpm. Thème de 4 notes (si♭ – mi♭ – fa – sol) : début, « la source », fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 42.7; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(808)
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
spb = 60 / 102
def pl(m, d=.45):
    t = T(d); s = sum(2*((hz(m)*(1+det)*t) % 1) - 1 for det in (-.004, .004)) / 2
    return filt(s, 2600) * np.exp(-t*9) * np.clip(t/.003, 0, 1)
def bell(m, d=1.4): t = T(d); return (np.sin(2*np.pi*hz(m)*t) + .3*np.sin(2*np.pi*hz(m)*3*t)*np.exp(-t*5)) * np.exp(-t*2.6)
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .02, .2) * np.exp(-t*1.5)
def clap(): t = T(.15); return filt(filt(rng.standard_normal(len(t)), 900, 'high'), 4000) * np.exp(-t*30)
Eb, Bb, Cm, Ab, Gm = (51,63,67,70), (46,62,65,70), (48,63,67,72), (44,63,68,72), (43,62,67,70)
MOTIF = [(0, 82), (.5, 87), (1.0, 89), (1.75, 91)]
def groove(seq, start, stop, g=.1, cl=True):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//8) % len(seq)]
        if k % 8 == 0: add(mus, bass(ch[0], spb*2), b, .28)
        if k % 8 == 4: add(mus, bass(ch[0], spb*2), b, .22)
        if k % 2 == 0 or k % 8 == 3:
            for j, m in enumerate(ch[1:]): add(mus, pl(m + 12), b + j*.006, g/2, (j-1)*.3)
        if cl and k % 4 == 2: add(mus, clap(), b, .08)
        b += spb/2; k += 1
for dt, m in MOTIF: add(mus, bell(m), .05 + dt*spb, .26)
groove([Eb, Bb, Cm, Ab], 0, 11.7, .1)
groove([Cm, Gm, Ab, Ab], 11.7, 18.95, .08, False)
for dt, m in MOTIF: add(mus, bell(m + 2), 19.6 + dt*spb*.8, .28)
groove([Eb, Bb, Cm, Ab], 19.0, 33.3, .11)
groove([Ab, Bb], 33.3, 37.7, .1); groove([Eb], 37.7, 42.3, .09, False)
for dt, m in MOTIF + [(2.5, 94)]: add(mus, bell(m, 1.8), 33.3 + dt*spb, .24)
mus = filt(mus, 4800)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def snap_():
    t = T(.18); return filt(rng.standard_normal(len(t)), 1500) * np.exp(-t*35) + .4*np.sin(2*np.pi*220*t)*np.exp(-t*30)
def type_(d=1.0):
    out = np.zeros(int(SR*d))
    for k in range(int(d*12)):
        i = int(k/12*SR); t = T(.03); out[i:i+len(t)] += filt(rng.standard_normal(len(t)), 5000) * np.exp(-t*150)
    return out
for at in (.2, 1.94, 7.94): add(sfx, snap_(), at + .45, .25)
add(sfx, snap_(), 20.1, .35)
add(sfx, type_(1.0), 23.4, .1); add(sfx, type_(1.0), 25.6, .08)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
