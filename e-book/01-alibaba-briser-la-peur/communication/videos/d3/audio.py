"""D3 « Je ne parle ni chinois ni anglais » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style : guzheng (cithare chinoise, cordes pincées glissées) + piano doux occidental qui lui répondent : deux langues qui se comprennent.
Gamme pentatonique sur sol, 88 bpm. Thème de 5 notes (ré – mi – sol – la – sol) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 42.7; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(303)
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
spb = 60 / 88
def zheng(m, d=1.6, bend=0):
    t = T(d); f = hz(m) * (1 + bend*np.clip(t/.15, 0, 1)*.06)
    ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sin(ph) + .5*np.sin(2*ph)*np.exp(-t*4) + .25*np.sin(3*ph)*np.exp(-t*7)
    return s * np.exp(-t*2.2) * np.clip(t/.002, 0, 1)
def piano(m, d=2.0):
    t = T(d); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t)*np.exp(-t*3) + .1*np.sin(6*np.pi*f*t)*np.exp(-t*6)) * np.exp(-t*1.6) * np.clip(t/.004, 0, 1)
def pad(ms, d, a=1.5, r=1.8):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) for m in ms for det in (-.06, .06))
    return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
G, Em, C, D = (43,62,67,71), (40,59,64,67), (36,60,64,67), (38,62,66,69)
PENTA = [67, 69, 71, 74, 76, 79]
MOTIF = [(0, 74), (.5, 76), (1.0, 79), (1.5, 81), (2.25, 79)]
def bars(seq, start, stop, pg=.4):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b); add(mus, pad(ch[1:] + (ch[0],), d + 1.2, .9, 1.2), b, pg); b += spb*4; k += 1
for dt, m in MOTIF: add(mus, zheng(m, 1.6, .5 if dt == 1.0 else 0), .05 + dt*spb, .28)
bars([G, Em], 0, 5.2, .35)
bars([Em, C, Em, D], 5.2, 21.0, .45)
b = 5.4; k = 0
while b < 20.8: add(mus, zheng(PENTA[(k*3) % 6] - 12, 1.2), b, .1, .3 if k % 2 else -.3); b += spb; k += 1
# solution : la cithare et le piano se répondent
for dt, m in MOTIF: add(mus, zheng(m, 1.6), 21.1 + dt*spb, .24)
for dt, m in MOTIF: add(mus, piano(m - 12), 21.1 + spb*4 + dt*spb, .2)
bars([G, D, Em, C], 21.0, 37.5, .45)
b = 22.0; k = 0
while b < 37.2:
    add(mus, (zheng if k % 2 == 0 else piano)(PENTA[k % 6], 1.2), b, .1, .3 if k % 2 else -.3); b += spb/2; k += 1
bars([C, D], 37.5, 39.5, .45); bars([G], 39.5, 42.3, .5)
for dt, m in MOTIF + [(3.0, 86)]: add(mus, piano(m, 2.4), 37.5 + dt*spb, .22)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def blip(f=900): t = T(.12); return filt(np.sin(2*np.pi*f*t) * np.exp(-t*30), 3000)
def type_(d=1.8):
    out = np.zeros(int(SR*d))
    for k in range(int(d*12)):
        i = int(k/12*SR + rng.uniform(0, .02)*SR); t = T(.03); out[i:i+len(t)] += filt(rng.standard_normal(len(t)), 5000) * np.exp(-t*150)
    return out
for at in (.5, 1.9): add(sfx, blip(820), at, .16)
add(sfx, blip(1200), 2.7, .14)
add(sfx, type_(1.8), 22.8, .1)
add(sfx, blip(820), 25.1, .14); add(sfx, blip(1000), 26.2, .14)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
