"""M5 « Ton grossiste est aussi ton concurrent » (livre 1) — musique + bruitages faits uniquement pour cette vidéo.
Style « boîte à musique de marionnette » un peu tendue (valse lente en mineur, accordéon doux), qui se libère en majeur au coup de ciseaux.
La mineur -> la majeur, valse à 3 temps, 84 bpm. Volume très bas."""
import numpy as np, wave
from scipy.signal import butter, sosfilt
SR = 44100; DUR = 40.7; N = int(SR * DUR); LEAD = 0.5
rng = np.random.default_rng(1010)
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
def acc(ms, d):
    t = T(d); s = np.zeros(len(t))
    for m in ms:
        for det in (-.003, .003):
            ph = 2*np.pi*hz(m)*(1+det)*t; s += np.sign(np.sin(ph))*.3 + np.sin(ph)
    return filt(s, 1400) * env(len(t), .04, .12) / (2*len(ms))
def mbox(m, d=1.2):
    t = T(d); f = hz(m); return (np.sin(2*np.pi*f*t) + .4*np.sin(2*np.pi*f*3*t)*np.exp(-t*6)) * np.exp(-t*3) * np.clip(t/.002, 0, 1)
def bass(m, d): t = T(d); return np.sin(2*np.pi*hz(m)*t) * env(len(t), .02, .2) * np.exp(-t*2)
Am, Dm, E, F, A, D, Es = (45,60,64,69), (38,62,65,69), (40,59,64,68), (41,60,65,69), (45,61,64,69), (38,62,66,69), (40,59,64,68)
MEL_MIN = [76, 72, 69, 71, 72, 74, 76, 74, 72, 71, 69, 68]
MEL_MAJ = [76, 73, 69, 71, 73, 74, 76, 78, 76, 73, 71, 69]
def waltz(seq, start, stop, mel, g=.12):
    b = start; k = 0
    while b < stop - .1:
        ch = seq[(k//3) % len(seq)]
        if k % 3 == 0: add(mus, bass(ch[0], spb*.9), b, .3)
        else: add(mus, acc(ch[1:], spb*.6), b, .12)
        add(mus, mbox(mel[k % len(mel)]), b, g, .3 if k % 2 else -.3)
        b += spb; k += 1
waltz([Am, Dm, E, Am], 0, 20.1, MEL_MIN, .1)
waltz([A, D, Es, A], 20.4, 31.0, MEL_MAJ, .12)
waltz([D, Es], 31.0, 35.6, MEL_MAJ, .11)
add(mus, sum(mbox(m, 3.5) for m in (69, 73, 76, 81)) / 3, 35.74, .4)
add(mus, acc((57, 61, 64, 69), 4.0), 36.0, .25)
mus = filt(mus, 4400)
t_all = np.arange(N)/SR
mus *= np.clip(t_all/.05, 0, 1) * np.clip((DUR - t_all)/1.2, 0, 1)
def snip(): t = T(.25); return filt(filt(rng.standard_normal(len(t)), 2500, 'high'), 7000) * (np.exp(-t*30) + np.exp(-np.abs(t-.12)*60))
def flip(): t = T(.3); return filt(filt(rng.standard_normal(len(t)), 800, 'high'), 4000) * np.sin(np.pi*t/.3)
def stampsnd(): t = T(.3); return filt(rng.standard_normal(len(t)), 300)*np.exp(-t*20) + .5*np.sin(2*np.pi*90*t)*np.exp(-t*18)
add(sfx, flip(), 5.56, .15)
add(sfx, stampsnd(), 18.14, .2)
for i in range(3): add(sfx, snip(), 20.2 + i*.23, .2)
def save(name, x):
    x = x / max(1e-9, np.abs(x).max()) * 0.9
    with wave.open(name, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x.T * 32767).astype('<i2').tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
