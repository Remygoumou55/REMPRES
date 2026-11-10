"""V8 « La phrase » (motion design, l'appel) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V8 : URGENCE puis CALME. D'abord un arpégiateur synthé très filtré (doux, sans aigus) + tic-tac feutré à 120 bpm,
mi mineur ; puis, quand la solution arrive, tout ralentit : guitare électrique claire et douce en sol majeur.
Thème de 4 notes (si – ré – mi – fa#) : début, « vérifie d'abord », fin. Volume très bas sous la voix."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 63.0; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(8)
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
def saw(m, d, cut=1100):
    t = T(d); s = sum((np.sin(2*np.pi*k*hz(m)*t)/k) for k in range(1, 8))
    return filt(s * np.exp(-t*7) * env(len(t), .005, .05), cut)
def pad(ms, d, a=1.2, r=1.6):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .25*np.sin(4*np.pi*hz(m+det)*t) for m in ms for det in (-.08, .08))
    return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
def tick():
    t = T(.06); return filt(np.sin(2*np.pi*900*t) + .4*np.sin(2*np.pi*1500*t), 1800) * np.exp(-t*70)
def kick(g=1):
    t = T(.35); return np.sin(2*np.pi*(50 + 50*np.exp(-t*28))*t) * np.exp(-t*10) * g
def guitar(m, d=2.0):
    f = hz(m); n = int(SR*d); p = max(2, int(SR/f)); buf = filt(rng.uniform(-1, 1, p), 2000); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = .5*(buf[i % p] + buf[(i+1) % p])*.996
    return filt(out, 1800) * env(n, .003, .3)
def lead(m, d):
    t = T(d); ph = 2*np.pi*hz(m)*t*(1 + .003*np.sin(2*np.pi*5*t)); s = np.sin(ph) + .3*np.sin(2*ph)
    return filt(s, 1500) * env(len(t), .06, .35)
Em, C, G, D, Am, B7 = (40,52,55,59), (36,52,55,60), (43,55,59,62), (38,54,57,62), (45,52,57,60), (47,51,54,57)
MOTIF = [(0, 59), (.5, 62), (1.0, 64), (1.75, 66)]
# 1) URGENCE (0 – 35.8) : arpégiateur 120 bpm + tic-tac
spb = .5
b = 0.0; k = 0; seq = [Em, C, Am, B7]
while b < 35.6:
    ch = seq[(k//8) % 4]
    add(mus, saw(ch[1 + k % 3] + 12, .24), b, .1, (-.3, .3)[k % 2])
    if k % 2 == 0: add(mus, tick(), b, .07, .2)
    if k % 8 == 0: add(mus, pad(ch[1:], 4.4, .3, .8), b, .35); add(mus, saw(ch[0], 3.8, 400), b, .5)
    if 12.6 <= b < 15.4 and k % 2 == 1: add(mus, tick(), b, .09, -.2)
    b += spb/2; k += 1
for dt, m in MOTIF: add(mus, lead(m, .9), .1 + dt*.5, .13)
for at in np.arange(24.0, 26.9, .75): add(mus, kick(.8), at, .3); add(mus, kick(.5), at + .22, .15)
# 2) CALME (35.8 – fin) : guitare claire, sol majeur, lent
spb2 = 60/76
b = 35.8; k = 0
while b < 61.6:
    ch = [G, D, Em, C][k % 4]
    add(mus, pad(ch[1:], spb2*4 + 1, .8, 1.2), b, .45)
    for q, n in enumerate([0, 1, 2, 3, 2, 1]):
        x = b + q*spb2*4/6
        if x < 61.6: add(mus, guitar(ch[n] + 12, 1.8), x, .2, (-.3, .3)[q % 2])
    b += spb2*4; k += 1
for dt, m in MOTIF: add(mus, lead(m + 5, 1.2), 43.2 + dt*.7, .12)
for dt, m in MOTIF + [(2.6, 67)]: add(mus, lead(m + 5, 1.4), 57.9 + dt*.7, .12)
mus = filt(mus, 4000)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (rares, très doux) ----------
def hangup():
    t = T(.5); return filt(np.sin(2*np.pi*np.where(t < .2, 480, 360)*t), 1500) * env(len(t), .01, .05)
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
def dust(d=1.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 1500, 'high'), 4000) * np.exp(-t*2) * (1 - np.exp(-t*20))
def flip():
    t = T(.25); return filt(filt(rng.standard_normal(len(t)), 800, 'high'), 3000) * np.sin(np.pi*t/.25)
add(sfx, hangup(), 3.04, .2)
add(sfx, whoosh(), 6.9, .15)
add(sfx, dust(), 19.6, .2)                 # le terrain se dissout
for at in (29.11, 30.63, 33.40): add(sfx, flip(), at, .2)
add(sfx, whoosh(.8), 35.8, .15)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
