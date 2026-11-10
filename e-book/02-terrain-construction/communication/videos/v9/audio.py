"""V9 « La maison sans toit » (motion design, plan d'architecte) — musique + bruitages faits uniquement pour cette vidéo.
Style propre à V9 : vibraphone doux (trémolo lent) + nappe de cordes feutrée + harpe pincée (ostinato) à la solution.
Fa mineur -> la bémol majeur, 80 bpm. Thème de 5 notes au vibraphone (do – mi♭ – fa – la♭ – sol) :
début, « ce piège-là se calcule », et le toit final. Volume très bas sous la voix."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 60.4; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(9)
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
spb = 60 / 80
def vib(m, d=2.6):
    t = T(d); f = hz(m)
    s = (np.sin(2*np.pi*f*t) + .25*np.sin(2*np.pi*4*f*t)*np.exp(-t*6)) * np.exp(-t*1.4) * (1 + .25*np.sin(2*np.pi*4.5*t))
    return s * np.clip(t/.004, 0, 1)
def harp(m, d=1.6):
    p = int(SR / hz(m)); buf = rng.uniform(-1, 1, p); out = np.zeros(int(SR*d))
    for i in range(len(out)):
        out[i] = buf[i % p]; buf[i % p] = .5*(buf[i % p] + buf[(i+1) % p]) * .996
    return filt(out, 2500) * env(len(out), .002, .3)
def pad(ms, d, a=1.6, r=1.8):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.0, 0.08):
            ph = 2*np.pi*hz(m+det)*t + rng.uniform(0, 6); s += np.sin(ph) + .3*np.sin(2*ph) + .12*np.sin(3*ph)
    return filt(s, 1100) * env(len(t), a, r) / (3*len(ms))
def sub(m, d):
    t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .05, .6)
Fm, Db, Ab, Eb, Bbm, C = (41,60,65,68), (37,60,65,68), (44,60,63,68), (39,58,63,67), (34,58,61,65), (36,60,64,67)
MOTIF = [(0, 72), (.5, 75), (1.0, 77), (1.5, 80), (2.25, 79)]
def bars(seq, start, stop, pg=.5):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b)
        add(mus, pad(ch[1:], d + 1.2, .9, 1.2), b, pg)
        add(mus, sub(ch[0], d + .3), b, .35)
        b += spb*4; k += 1
# 1) ACCROCHE + PROBLÈME (0 – 13.8)
for dt, m in MOTIF: add(mus, vib(m), .05 + dt*spb, .3)
bars([Fm, Db, Ab, Eb], 0, 13.8, .45)
for at, m in ((7.4, 77), (9.6, 80), (11.98, 84), (12.6, 82)): add(mus, vib(m, 2.2), at, .16)
# 2) AGGRAVATION (13.8 – 30.1) : plus grave, battement lent qui ralentit
bars([Fm, Bbm, Db, C], 13.8, 30.1, .55)
b = 14.0
while b < 29.5: add(mus, sub(29, .5), b, .35); b += spb*2
for at, m in ((21.0, 65), (27.3, 68)): add(mus, vib(m, 3.0), at, .14)
# 3) SOLUTION (30.1 – 53.9) : le thème revient, la harpe tisse
for dt, m in MOTIF: add(mus, vib(m), 30.2 + dt*spb, .26)
bars([Ab, Eb, Fm, Db], 32.2, 53.9, .5)
ARP = [56, 63, 68, 72, 75, 72, 68, 63]
b = 32.7; k = 0
while b < 50.8:
    add(mus, harp(ARP[k % 8] + (0 if (k//16) % 2 == 0 else -1)), b, .2, .3 if k % 2 else -.3); b += spb/2; k += 1
for dt, m in MOTIF: add(mus, vib(m + 3), 44.5 + dt*spb, .18)
# 4) LE TOIT + FIN
for dt, m in MOTIF: add(mus, vib(m + 5, 3.0), 51.05 + dt*spb*.8, .26)
bars([Db, Eb], 51.0, 54.0, .5)
bars([Ab], 54.0, 59.9, .55)
for dt, m in ((0, 68), (.5, 72), (1.0, 75), (1.5, 80)): add(mus, vib(m, 3.2), 56.3 + dt*spb, .2)
mus = filt(mus, 4500)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
# ---------- BRUITAGES (rares, très doux) ----------
def pencil(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 2500, 'high'), 6000) * (.5 + .5*np.sin(2*np.pi*9*t)**2) * np.sin(np.pi*t/d)
def drop():
    t = T(.25); return filt(np.sin(2*np.pi*(700 - 1200*t)*t) * np.exp(-t*18), 2000)
def thud():
    t = T(.4); return filt(rng.standard_normal(len(t)), 220) * np.exp(-t*14) + .6*np.sin(2*np.pi*70*t)*np.exp(-t*12)
def whoosh(d=.6):
    t = T(d); return filt(filt(rng.standard_normal(len(t)), 300, 'high'), 2200) * np.sin(np.pi*t/d)**2
def chime(m):
    t = T(2.0); return (np.sin(2*np.pi*hz(m)*t) + .4*np.sin(2*np.pi*hz(m)*2.76*t)*np.exp(-t*4)) * np.exp(-t*2.5)
add(sfx, pencil(.9), .1, .18)
for at in (15.0, 16.1, 16.98): add(sfx, drop(), at, .22)
add(sfx, thud(), 22.95, .5)
rain = filt(filt(rng.standard_normal(int(SR*5)), 3000), 500, 'high') * env(int(SR*5), .4, .8)
add(sfx, rain, 23.76, .07)
add(sfx, whoosh(.5), 30.0, .2)
add(sfx, thud(), 37.95, .25)
add(sfx, chime(84), 51.9, .16); add(sfx, chime(88), 53.4, .14)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
