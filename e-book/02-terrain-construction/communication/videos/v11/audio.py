"""V11 « La première pluie » (motion design, maquette 3D) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V11 : flûte douce (souffle chaud, registre grave) + nappe + bourdon, ambiance de pluie très légère,
puis petites percussions à la main (djembé feutré) quand la solution arrive. Ré dorien -> fa majeur, 72 bpm.
Thème de 4 notes à la flûte (ré – fa – sol – la) : début, « pourtant », fin. Volume très bas sous la voix."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 61.8; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(11)
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
def gate(a, b, fa=.5, fb=.5):
    t = np.arange(N) / SR; return np.clip((t - a - LEAD) / fa, 0, 1) * np.clip((b + LEAD - t) / fb, 0, 1)
mus = np.zeros((2, N)); sfx = np.zeros((2, N))
spb = 60 / 72
def flute(m, d, a=.12, r=.4):
    t = T(d); f = hz(m) * (1 + .005*np.sin(2*np.pi*5*t)*np.clip(t/.4, 0, 1)); ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sin(ph) + .15*np.sin(2*ph) + .05*np.sin(3*ph) + .25*filt(rng.standard_normal(len(t)), 1800)*(.5 + .5*np.sin(ph))
    return filt(s, 2000) * env(len(t), a, r)
def pad(ms, d, a=1.8, r=2.0):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.07): s += np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .25*np.sin(4*np.pi*hz(m+det)*t)
    return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
def djembe(f=90, slap=False):
    t = T(.35); s = np.sin(2*np.pi*(f + 40*np.exp(-t*30))*t) * np.exp(-t*12)
    if slap: s += filt(rng.standard_normal(len(t)), 900) * np.exp(-t*50) * .5
    return filt(s, 1500)
Dm, C, Bb, F, Gm, A = (38,57,62,65), (36,55,60,64), (34,53,58,62), (41,57,60,65), (43,55,58,62), (33,57,61,64)
MOTIF = [(0, 62), (.5, 65), (1.0, 67), (1.75, 69)]
def bars(seq, start, stop, pg=.5, fl=None):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + 1.2, .9, 1.2), b, pg)
        add(mus, pad((ch[0], ch[0] + 12), d + .8, .6, 1.0), b, .25)
        b += spb*4; k += 1
# pluie d'ambiance très douce (avec la tempête de l'image)
rain = filt(filt(rng.standard_normal(N), 2500), 400, 'high') * .05
for ch in (0, 1): mus[ch] += rain * (gate(3.76, 5.7) + gate(10.9, 31.0, .8, 1.5))
# 1) ACCROCHE (0 – 5.8)
for dt, m in MOTIF: add(mus, flute(m, 1.6), .1 + dt*spb, .22)
bars([F, C], 0, 3.7, .45)
bars([Dm], 3.7, 5.8, .5)
# 2) PROBLÈME (5.8 – 15) : le souvenir du jour de soleil, doux
bars([F, C, Dm, Bb], 5.8, 11.0, .45)
for at, m in ((6.0, 69), (7.7, 67), (9.1, 65)): add(mus, flute(m, 1.4), at, .12)
bars([Dm, Gm, Bb, A], 11.0, 31.0, .55)
# 3) AGGRAVATION (15 – 31) : grave, battement lent
b = 15.1
while b < 30.5: add(mus, djembe(70), b, .22); b += spb*2
add(mus, pad((26, 38), 2.0, .1, 1.5), 29.5, .4)
# 4) SOLUTION (31 – 56.5) : le thème revient, rythme à la main
for dt, m in MOTIF: add(mus, flute(m, 1.6), 31.2 + dt*spb, .2)
bars([F, C, Dm, Bb], 33.2, 56.5, .5)
b = 34.5; q = 0
while b < 56.3:
    add(mus, djembe(85), b, .2); add(mus, djembe(120, True), b + spb*.5, .08, .2); add(mus, djembe(100), b + spb*.75, .1, -.2)
    b += spb; q += 1
for dt, m in MOTIF: add(mus, flute(m + 3, 1.6), 46.4 + dt*spb, .15)
# 5) FIN
for dt, m in MOTIF + [(2.5, 72)]: add(mus, flute(m + 3, 1.8), 56.6 + dt*spb, .17)
add(mus, pad((53, 57, 60, 65), 3.6, .3, 2.2), 58.6, .55)
mus = filt(mus, 4200)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (rares, très doux) ----------
def thunder():
    t = T(2.5); return filt(rng.standard_normal(len(t)), 180) * np.exp(-t*1.4) * (1 - np.exp(-t*20))
def whoosh(d=.7):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2000) * np.sin(np.pi*t/d)**2
def splash():
    t = T(.9); return filt(filt(rng.standard_normal(len(t)), 500, 'high'), 2500) * np.exp(-t*4) * (1 - np.exp(-t*30))
def pop(f=650):
    t = T(.12); return filt(np.sin(2*np.pi*f*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2200)
add(sfx, thunder(), 4.25, .6)
add(sfx, thunder(), 15.15, .5)
add(sfx, splash(), 15.6, .3)
add(sfx, whoosh(.6), 21.94, .2)              # bande « zone interdite »
add(sfx, whoosh(1.4), 31.0, .2)              # retour en arrière
for k, at in enumerate((37.79, 38.57, 39.43, 40.68, 41.64, 43.28)): add(sfx, pop(560 + 40*k), at, .14)
add(sfx, whoosh(.6), 46.3, .15)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
