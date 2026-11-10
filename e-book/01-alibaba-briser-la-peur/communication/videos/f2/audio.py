"""F2 « L'iceberg » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style : ambiance sous-marine douce — pad de verre (harmonica de verre), pizzicati légers, basse ronde, bulles très discrètes.
Mi mineur -> sol majeur, 84 bpm. Thème de 4 notes en verre (mi – sol – si – la) au début, à la solution et à la fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 42.5; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(22)
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
spb = 60 / 84
def glass(m, d=2.6):
    t = T(d); f = hz(m)
    s = (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*2*f*t) + .1*np.sin(2*np.pi*3.01*f*t)) * (1 + .15*np.sin(2*np.pi*5*t))
    return s * env(len(t), .25, 1.4)
def pizz(m):
    t = T(.6); f = hz(m)
    return (np.sin(2*np.pi*f*t) + .4*np.sin(2*np.pi*2*f*t)*np.exp(-t*20)) * np.exp(-t*9) * np.clip(t/.003, 0, 1)
def pad(ms, d, a=1.5, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.06, 0.06): s += np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .2*np.sin(4*np.pi*hz(m+det)*t)
    return filt(s, 1000) * env(len(t), a, r) / (2*len(ms))
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .04, .5)
Em, C, G, D, Am, B = (40,64,67,71), (36,64,67,72), (43,62,67,71), (38,62,66,69), (45,64,69,72), (35,63,66,71)
MOTIF = [(0, 76), (.5, 79), (1.0, 83), (1.75, 81)]
def bars(seq, start, stop, pg=.5):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + 1.2, .9, 1.2), b, pg); add(mus, bass(ch[0], d + .3), b, .3)
        b += spb*4; k += 1
for dt, m in MOTIF: add(mus, glass(m), .05 + dt*spb, .3)
bars([Em, C, G, D], 0, 9.6, .45)
# plongée : plus grave, plus sombre
bars([Am, Em, C, B], 9.6, 22.7, .55)
b = 9.7
while b < 22.3: add(mus, bass(28, .4), b, .35); b += spb*2
for at, m in ((15.4, 71), (18.8, 72), (20.9, 71)): add(mus, glass(m, 2.2), at, .14)
# solution : le thème revient + pizzicati
for dt, m in MOTIF: add(mus, glass(m), 22.76 + dt*spb, .26)
bars([G, D, Em, C], 22.7, 37.1, .5)
ARP = [67, 71, 74, 79, 74, 71]
b = 23.6; k = 0
while b < 36.9: add(mus, pizz(ARP[k % 6]), b, .16, .3 if k % 2 else -.3); b += spb/2; k += 1
bars([C, D], 37.1, 39.0, .5); bars([G], 39.0, 42.1, .55)
for dt, m in MOTIF + [(2.5, 86)]: add(mus, glass(m + 3 if m != 86 else 83, 3.0), 37.1 + dt*spb, .2)
mus = filt(mus, 4300)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
# bruitages : rares et doux
def bubbles(d=1.4):
    out = np.zeros(int(SR*d))
    for k in range(9):
        i = int(rng.uniform(0, d-.1)*SR); t = T(.08); f = rng.uniform(500, 1100)
        out[i:i+len(t)] += np.sin(2*np.pi*(f + 2500*t)*t) * np.exp(-t*50)
    return filt(out, 3000)
def splash(): t = T(1.0); return filt(filt(rng.standard_normal(len(t)), 400, 'high'), 2500) * np.exp(-t*4) * (1 - np.exp(-t*30))
def tick(): t = T(.08); return filt(np.sin(2*np.pi*1400*t)*np.exp(-t*60), 3000)
def thud(): t = T(.4); return filt(rng.standard_normal(len(t)), 200)*np.exp(-t*12) + .5*np.sin(2*np.pi*65*t)*np.exp(-t*10)
add(sfx, splash(), 9.6, .3); add(sfx, bubbles(), 9.9, .2)
add(sfx, thud(), 20.38, .35)
for k in range(5): add(sfx, tick(), 26.6 + k*.15, .08)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
