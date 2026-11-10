"""V10 « Les frais inventés » (motion design, le ticket) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V10 : jazz feutré « enquête » — contrebasse qui marche, balais sur caisse claire, trompette en sourdine
(très douce, filtrée) pour le thème. Sol mineur -> si bémol majeur, 92 bpm, léger swing.
Thème de 4 notes (sol – sib – ré – do) : début, « décortiqué », fin. Volume très bas sous la voix."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 67.7; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(10)
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
spb = 60 / 92; SW = .62
def ubass(m, d):
    t = T(d); f = hz(m); s = np.sin(2*np.pi*f*t) + .5*np.sin(4*np.pi*f*t)*np.exp(-t*6) + .2*np.sin(6*np.pi*f*t)*np.exp(-t*9)
    return filt(s * np.exp(-t*3.5) * env(len(t), .008, .1), 700)
def brush(d=.25):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 1200, 'high'), 4000) * np.exp(-t*14) * (1 - np.exp(-t*80))
def trumpet(m, d, a=.08, r=.3):
    t = T(d); f = hz(m)*(1 + .004*np.sin(2*np.pi*5.5*t)*np.clip(t/.3, 0, 1)); ph = 2*np.pi*np.cumsum(f)/SR
    s = np.sin(ph) + .6*np.sin(2*ph) + .4*np.sin(3*ph) + .25*np.sin(4*ph) + .15*np.sin(5*ph)
    return filt(s, 1500) * env(len(t), a, r)
def keys(ms, d):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m)*t) + .2*np.sin(4*np.pi*hz(m)*t)*np.exp(-t*3) for m in ms)
    return filt(s * np.exp(-t*1.2) * env(len(t), .01, .4), 1800) / len(ms)
def pad(ms, d, a=1.2, r=1.5):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) for m in ms for det in (-.07, .07))
    return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
Gm7, Cm7, D7, Eb, Bb, F7 = (43,58,62,65), (36,58,63,67), (38,57,60,66), (39,58,62,67), (34,57,62,65), (41,57,63,65)
MOTIF = [(0, 67), (.5, 70), (1.0, 74), (1.75, 72)]
def swing(seq, start, stop, groove=True, kg=.13, pg=.35):
    b = start; k = 0
    while b < stop - .15:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + .6, .4, .8), b, pg)
        walk = [ch[0], ch[0]+3, ch[0]+5, ch[0]+7]
        for q in range(4):
            x = b + q*spb
            if x >= stop: break
            add(mus, ubass(walk[q], spb*.95), x, .5)
            if groove:
                add(mus, brush(), x, .10, .2)
                add(mus, brush(.12), x + spb*SW, .06, -.2)
        if groove and b + spb*(1+SW) < stop: add(mus, keys(ch[1:], 1.2), b + spb*(1+SW), kg, .1)
        b += spb*4; k += 1
# 1) ACCROCHE (0 – 8.2)
for dt, m in MOTIF: add(mus, trumpet(m - 12, 1.2), .1 + dt*spb, .16)
swing([Gm7, Cm7], 0.0, 8.2, groove=False, pg=.4)
# 2) PROBLÈME + AGGRAVATION (8.2 – 37.4) : la contrebasse marche
swing([Gm7, Cm7, D7, Gm7], 8.2, 37.2)
add(mus, pad((31, 43), 1.4, .1, 1.0), 36.2, .35)
# 3) SOLUTION (37.4 – 62.3) : si bémol majeur, plus clair
for dt, m in MOTIF: add(mus, trumpet(m - 9, 1.3), 37.6 + dt*spb, .16)
swing([Eb, Bb, F7, Bb], 39.0, 62.3, kg=.12, pg=.4)
for dt, m in MOTIF: add(mus, trumpet(m - 9, 1.3), 53.4 + dt*spb, .13)
# 4) FIN : le thème et l'accord
for dt, m in MOTIF + [(2.5, 77)]: add(mus, trumpet(m - 9, 1.5), 62.5 + dt*spb, .15)
add(mus, keys((46, 58, 62, 65, 69), 4.0), 65.0, .3)
add(mus, ubass(34, 3.0), 65.0, .5)
mus = filt(mus, 4200)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (rares, très doux) ----------
def printer(d=1.6):
    t = T(d); n = filt(filt(rng.standard_normal(len(t)), 800, 'high'), 3000); return n * (.5 + .5*np.sign(np.sin(2*np.pi*22*t))) * env(len(t), .05, .2)
def pop(f=650):
    t = T(.12); return filt(np.sin(2*np.pi*f*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2200)
def tear(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 600, 'high'), 3500) * np.sin(np.pi*t/d) * (1 + .6*np.sin(2*np.pi*40*t))
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
add(sfx, printer(1.6), 0.0, .2)
add(sfx, printer(4.8), 16.9, .12)
add(sfx, tear(), 38.0, .25)              # le ticket est découpé
for i in range(5): add(sfx, pop(560 + 40*i), 46.6 + i*.4, .12)
add(sfx, whoosh(), 53.3, .15)
add(sfx, printer(2.2), 62.4, .15)        # le ticket honnête

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
