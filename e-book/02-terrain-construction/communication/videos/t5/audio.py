"""T5 « Le maçon » (motion design) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à T5 : orgue électrique doux (Wurlitzer) + basse ronde + percussions « chantier » feutrées
(bois, petits chocs métalliques très doux), do mineur -> mi bémol majeur, 88 bpm.
Thème de 4 notes à l'orgue (do – mib – sol – fa) : début, « la bonne méthode », fin. Pas d'aigus. Voix calée avec 0,5 s d'entrée."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 55.8; N = int(SR * DUR); LEAD = 0.5
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
spb = 60 / 88
def wurli(m, d, vel=1.0):
    t = T(d); f = hz(m)
    s = np.sin(2*np.pi*f*t) + .55*np.sin(2*np.pi*2*f*t)*np.exp(-t*2) + .25*np.sin(2*np.pi*3*f*t)*np.exp(-t*5)
    s *= (1 + .1*np.sin(2*np.pi*5.5*t)) * np.exp(-t*.8) * env(len(t), .006, .4)
    return filt(s, 2200) * vel
def pad(ms, d, a=1.4, r=1.6):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.07, 0.07): s += np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) + .4*np.sin(4*np.pi*hz(m+det)*t)
    return filt(s, 1200) * env(len(t), a, r) / (2*len(ms))
def bass(m, d):
    t = T(d); return filt(np.sin(2*np.pi*hz(m)*t) + .3*np.sin(2*np.pi*2*hz(m)*t), 380) * np.exp(-t*1.2) * env(len(t), .01, .15)
def kick():
    t = T(.35); return np.sin(2*np.pi*(50 + 45*np.exp(-t*30))*t) * np.exp(-t*11)
def wood():
    t = T(.1); return filt(np.sin(2*np.pi*620*t) + .5*np.sin(2*np.pi*1100*t), 2000) * np.exp(-t*45)
def tink():
    t = T(.25); return filt(np.sin(2*np.pi*1400*t) + .4*np.sin(2*np.pi*2350*t), 2600) * np.exp(-t*18)
Cm, Ab, Eb, Bb, Fm, G = (36,55,60,63), (32,56,60,63), (39,55,58,63), (34,53,58,62), (41,56,60,65), (31,55,59,62)
MOTIF = [(0, 60), (.5, 63), (1.0, 67), (1.75, 65)]
def bars(seq, start, stop, groove=True, wg=.11, pg=.45):
    b = start; k = 0
    while b < stop - .15:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + .8, .5, .9), b, pg)
        add(mus, bass(ch[0], spb*1.8), b, .45); 
        if b + 2*spb < stop: add(mus, bass(ch[0] + (7 if k % 2 else 0), spb*1.5), b + 2*spb, .35)
        for q, o in enumerate((0, 1.5, 2, 3)):
            x = b + o*spb
            if x < stop: add(mus, wurli(ch[1 + q % 3] + 12, 1.6, .7), x, wg, (-.25, .25)[q % 2])
        if groove:
            for q in range(4):
                x = b + q*spb
                if x >= stop: break
                if q in (0, 2): add(mus, kick(), x, .3)
                if q in (1, 3): add(mus, wood(), x, .08, .2)
                if q == 3 and k % 2: add(mus, tink(), x + spb/2, .03, -.3)
        b += spb*4; k += 1
# 1) ACCROCHE (0 – 4.3) : le thème à l'orgue, posé
add(mus, pad(Cm[1:], 4.6, .2, 1.2), -.2, .4)
for dt, m in MOTIF: add(mus, wurli(m, 2.2, .9), .05 + dt*spb, .2, .1)
# 2) PROBLÈME (4.3 – 12.7) : groove léger
bars([Cm, Ab, Eb, Bb], 4.3, 12.7)
# 3) AGGRAVATION (12.7 – 24.5) : sans groove, plus sombre, horloge douce
bars([Cm, Fm, Ab, G], 12.7, 24.4, groove=False, wg=.08, pg=.5)
b = 12.75
while b < 24.2: add(mus, wood(), b, .06); b += spb
add(mus, pad((24, 36), 1.6, .1, 1.2), 23.2, .35)
# 4) SOLUTION (24.5 – 47.4) : lumière, mi bémol majeur, le groove revient
for dt, m in MOTIF: add(mus, wurli(m + 3, 2.2, .9), 24.72 + dt*spb, .17, -.1)
bars([Eb, Bb, Cm, Ab], 25.8, 47.4)
for dt, m in MOTIF: add(mus, wurli(m + 3, 2.0, .8), 39.71 + dt*spb, .13)
# 5) ACTION (47.4 – fin)
bars([Ab, Bb, Eb, Eb], 47.4, 53.6)
for dt, m in MOTIF + [(2.5, 70)]: add(mus, wurli(m + 15, 2.2, .7), 49.94 + dt*spb, .13)
for k, m in enumerate((39, 51, 55, 58, 63)): add(mus, wurli(m, 3.5, .7), 53.5 + k*.05, .14, (k-2)*.2)
add(mus, pad((51, 55, 58, 63), 2.3, .2, 1.8), 53.45, .5)
mus = filt(mus, 4500)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)

# ---------- BRUITAGES (peu nombreux, doux) ----------
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2500) * np.sin(np.pi*t/d)**2
def pop(f=700):
    t = T(.12); return filt(np.sin(2*np.pi*f*(1 + .8*np.exp(-t*40))*t) * np.exp(-t*30), 2500)
def thud(g=1.0):
    t = T(.45); return np.sin(2*np.pi*(55 + 55*np.exp(-t*24))*t) * np.exp(-t*10) * g
def ring():
    t = T(.9); return filt(np.sin(2*np.pi*np.where((t*6).astype(int) % 2 == 0, 660, 520)*t), 2000) * env(len(t), .01, .1)
for at in (4.25, 12.7, 24.5, 36.1, 47.4): add(sfx, whoosh(), at - .3, .16)
add(sfx, ring(), 0.05, .12)                  # notification du maçon
add(sfx, thud(.6), 2.14, .3)                 # n'envoie rien
for at in (7.8, 9.35): add(sfx, pop(650), at, .2)
add(sfx, whoosh(.5), 11.96, .15)             # l'argent part
for at in (15.55, 15.85, 16.15): add(sfx, ring(), at, .06)
add(sfx, thud(.7), 22.4, .3)                 # la jauge tombe
for at in (29.35, 30.4, 30.95): add(sfx, thud(.8), at + .35, .32)   # fondations, murs, dalle
add(sfx, thud(.8), 40.1, .3)                 # le guide tombe
for at in (50.2, 50.45, 50.7, 50.95): add(sfx, pop(600), at + .3, .14)
add(sfx, pop(900), 52.42, .22)

def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
