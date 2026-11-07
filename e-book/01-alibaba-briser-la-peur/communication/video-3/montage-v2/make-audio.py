"""Vidéo 3 : musique cinématique originale + effets sonores (composés ici, sans droits d'auteur).
Tension (0 – 30,2 s, ré mineur, 90 bpm) puis espoir (30,2 s – fin, ré majeur / si mineur)."""
import numpy as np, wave, os

SR = 44100; DUR = 51.5; N = int(SR * DUR)
rng = np.random.default_rng(303)
HERE = os.path.dirname(os.path.abspath(__file__))
tt = np.arange(N) / SR

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def env(n, a, r):
    t = np.arange(n) / SR; d = n / SR
    return np.clip(t / a, 0, 1) * np.clip((d - t) / r, 0, 1)
def lp(x, a):
    y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s += a * (x[i] - s); y[i] = s
    return y
def add(buf, sig, at, g=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if 0 <= i < len(buf): buf[i:j] += sig[:j - i] * g
def strings(m, d, g=1.0):           # nappe de cordes (somme de dents de scie légèrement désaccordées)
    n = int(SR * d); t = np.arange(n) / SR; s = np.zeros(n)
    for det in (-.12, 0, .11):
        f = hz(m + det)
        s += sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))
    return s * env(n, .9, 1.4) * g
def pluck(m, d=.9):
    n = int(SR * d); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * hz(m) * t) + .35 * np.sin(4 * np.pi * hz(m) * t)) * np.exp(-t * 5)
def timpani(at, g=1.0):
    t = np.arange(int(SR * 1.3)) / SR
    add(mus, np.sin(2 * np.pi * (70 + 25 * np.exp(-t * 8)) * t) * np.exp(-t * 3.2) + rng.standard_normal(len(t)) * .05 * np.exp(-t * 20), at, g)

mus = np.zeros(N)
SPLIT = 30.19
# --- Partie 1 : tension
drone = np.sin(2 * np.pi * hz(38) * tt) + .4 * np.sin(2 * np.pi * hz(45) * tt)
mus += drone * np.clip(tt / 2, 0, 1) * (tt < SPLIT + 1) * .18
prog1 = [(50, 53, 57), (46, 50, 53), (48, 52, 55), (45, 49, 52)]      # Dm Bb C A
bar = 60 / 90 * 4
k = 0; t0 = 0.0
while t0 < SPLIT:
    for m in prog1[k % 4]: add(mus, strings(m, bar + 1.2), t0, .05)
    for s in range(8):                                                # ostinato grave en croches
        add(mus, pluck(prog1[k % 4][0] - 12, .3) * .9, t0 + s * bar / 8, .16)
    t0 += bar; k += 1
for at in (0.12, 8.83, 16.70, 22.67):                                 # timbales sur les temps forts
    timpani(at, .9)
# --- Partie 2 : espoir
prog2 = [(62, 66, 69), (59, 62, 66), (55, 59, 62), (57, 61, 64)]      # D Bm G A
bar2 = 60 / 96 * 4
k = 0; t0 = SPLIT
while t0 < DUR:
    ch = prog2[k % 4]
    for m in ch: add(mus, strings(m - 12, bar2 + 1.2), t0, .045)
    for s in range(8):
        add(mus, pluck(ch[s % 3] + (12 if s % 4 == 3 else 0), .8), t0 + s * bar2 / 8, .1)
    add(mus, pluck(ch[0] - 24, 1.4), t0, .35)
    t0 += bar2; k += 1
for b in np.arange(SPLIT, DUR, 60 / 96):                              # pulsation légère
    t = np.arange(int(SR * .25)) / SR
    add(mus, np.sin(2 * np.pi * (48 + 50 * np.exp(-t * 40)) * t) * np.exp(-t * 14), b, .35)
mus *= np.clip(tt / 1.2, 0, 1) * np.clip((DUR - tt) / 2.0, 0, 1)
mus *= 1 - .55 * np.exp(-((tt - SPLIT) / .5) ** 2)

# --- Effets sonores
sfx = np.zeros(N)
def whoosh(d=.9):
    n = int(SR * d); x = rng.standard_normal(n); t = np.arange(n) / n
    return lp(x, .04 + .1 * np.sin(np.pi * t).mean()) * np.sin(np.pi * t) ** 2 * 4
def thud():
    t = np.arange(int(SR * .5)) / SR
    return np.sin(2 * np.pi * (90 + 40 * np.exp(-t * 25)) * t) * np.exp(-t * 9)
def stamp():
    t = np.arange(int(SR * .3)) / SR
    return (np.sin(2 * np.pi * 140 * t) + rng.standard_normal(len(t)) * .5) * np.exp(-t * 20)
def paper():
    n = int(SR * .35); t = np.arange(n) / n
    return (rng.standard_normal(n) - lp(rng.standard_normal(n), .2)) * np.sin(np.pi * t) * .8
def tick():
    t = np.arange(int(SR * .12)) / SR
    return np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 45)
def chime():
    t = np.arange(int(SR * 1.6)) / SR
    return sum(a * np.sin(2 * np.pi * f * t) for a, f in ((1, 1174.7), (.6, 1760), (.3, 2349.3))) * np.exp(-t * 3.2)

for at in (4.05, 8.28, 16.24, 22.67, 30.19, 40.66, 44.23): add(sfx, whoosh(), at - .45, .45)
for at in (8.83, 10.70, 12.92, 14.66): add(sfx, thud(), at, .55)
M2 = 22.67
for d in (.37, 2.40, 3.76, 5.32): add(sfx, whoosh(.5), M2 + d - .1, .25)
for d in (1.1, 3.0, 4.4, 6.0): add(sfx, stamp(), M2 + d + .25, .45)
M3 = 30.19
for d in (1.57, 3.98, 5.76): add(sfx, paper(), M3 + d, .5)
for d in (2.06, 5.5, 7.23): add(sfx, tick(), M3 + d + .2, .35)
M4 = 44.23
add(sfx, whoosh(.5), M4 + 2.2, .35)
add(sfx, chime(), M4 + 2.67, .3)
add(sfx, tick(), M4 + 3.97 + .3, .4)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * .9
    st = np.repeat((x * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(os.path.join(HERE, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
save('music.wav', mus); save('sfx.wav', sfx); print('ok')
