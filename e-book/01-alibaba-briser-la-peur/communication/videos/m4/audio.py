"""M4 « Commencer petit » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style : pizzicati de cordes légers qui « montent » comme un escalier, glockenspiel, et une grosse caisse douce. Tension au début, puis élan.
Si bémol majeur, 96 bpm. Thème de 5 notes (fa – si♭ – do – ré – do) : début, solution, fin. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 35.6; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(707)
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
spb = 60 / 96
def pizz(m):
    t = T(.5); f = hz(m); return (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t)*np.exp(-t*20)) * np.exp(-t*10) * np.clip(t/.003, 0, 1)
def glock(m, d=1.4):
    t = T(d); f = hz(m); return (np.sin(2*np.pi*f*t) + .3*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*6)) * np.exp(-t*3) * np.clip(t/.002, 0, 1)
def pad(ms, d, a=1.2, r=1.5):
    t = T(d); s = sum(np.sin(2*np.pi*hz(m+det)*t + rng.uniform(0, 6)) for m in ms for det in (-.05, .05)); return filt(s, 900) * env(len(t), a, r) / (2*len(ms))
def kick(): t = T(.35); return np.sin(2*np.pi*(52 + 45*np.exp(-t*28))*t) * np.exp(-t*9)
Bb, Eb, F, Gm, Cm = (46,62,65,70), (51,63,67,70), (41,60,65,69), (43,62,67,70), (48,63,67,72)
MOTIF = [(0, 77), (.5, 82), (1.0, 84), (1.5, 86), (2.25, 84)]
def bars(seq, start, stop, pg=.4):
    b = start; k = 0
    while b < stop - .2:
        ch = seq[k % len(seq)]; d = min(spb*4, stop - b); add(mus, pad(ch, d + 1.0, .8, 1.0), b, pg); b += spb*4; k += 1
for dt, m in MOTIF: add(mus, glock(m), .05 + dt*spb, .26)
bars([Gm, Eb], 0, 11.9, .42)
b = 2.7; k = 0
while b < 11.8: add(mus, pizz([55, 58, 55, 62][k % 4]), b, .14, .3 if k % 2 else -.3); b += spb/2; k += 1
b = 8.4
while b < 11.8: add(mus, kick(), b, .2); b += spb
for dt, m in MOTIF: add(mus, glock(m), 12.2 + dt*spb, .24)
bars([Bb, Eb, F, Bb], 12.0, 26.0, .45)
# l'escalier qui monte
STAIR = [58, 62, 65, 70, 74, 77, 82]
b = 14.2; k = 0
while b < 25.8: add(mus, pizz(STAIR[k % 7] + (12 if b > 21 else 0)), b, .14, .3 if k % 2 else -.3); b += spb/2; k += 1
b = 14.2
while b < 25.8: add(mus, kick(), b, .16); b += spb*2
bars([Eb, F], 26.0, 29.0, .45); bars([Bb], 29.0, 35.2, .5)
for dt, m in MOTIF + [(3.0, 89)]: add(mus, glock(m, 1.8), 26.1 + dt*spb, .24)
mus = filt(mus, 4600)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def shrink():
    t = T(.6); return np.sin(2*np.pi*np.cumsum(900 - 700*t/.6)/SR) * env(len(t), .02, .2) * .5
def coin(): t = T(.3); return (np.sin(2*np.pi*1800*t) + .5*np.sin(2*np.pi*2700*t)) * np.exp(-t*18)
def step(): t = T(.2); return filt(rng.standard_normal(len(t)), 400) * np.exp(-t*25)
add(sfx, shrink(), 1.6, .15)
for i in range(4): add(sfx, coin(), 9.3 + i*.5 + .6, .06)
for at in (14.2, 17.4, 21.1, 23.5): add(sfx, step(), at, .25)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
