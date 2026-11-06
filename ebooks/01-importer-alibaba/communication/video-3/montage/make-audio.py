"""Compose une musique de fond originale et des effets sonores (aucun droit d'auteur).
Sortie : music.wav et sfx.wav (51,5 s, 44,1 kHz, stéréo)."""
import numpy as np, wave, os

SR = 44100
DUR = 51.5
N = int(SR * DUR)
rng = np.random.default_rng(7)
HERE = os.path.dirname(os.path.abspath(__file__))

def note(f): return 440.0 * 2 ** ((f - 69) / 12)

def tone(freq, dur, harm=(1, .5, .25, .12), attack=.02, release=.4):
    t = np.arange(int(SR * dur)) / SR
    w = sum(a * np.sin(2 * np.pi * freq * (k + 1) * t + k) for k, a in enumerate(harm))
    env = np.minimum(1, t / attack) * np.minimum(1, (dur - t) / release).clip(0, 1)
    return w * env

def lowpass(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def add(buf, sig, at, gain=1.0):
    i = int(at * SR); j = min(len(buf), i + len(sig))
    if i < len(buf): buf[i:j] += sig[:j - i] * gain

music = np.zeros(N)
# Partie A : tension (0 – 22,6 s), 80 bpm, la mineur
SPLIT = 22.6
bar = 3.0
chordsA = [(57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59)]  # Am F Dm E
t = 0.0; k = 0
while t < SPLIT + 1:
    for m in chordsA[k % 4]:
        add(music, tone(note(m), bar + .6, harm=(1, .35, .15), attack=.8, release=1.2), t, .16)
    add(music, tone(note(chordsA[k % 4][0] - 24), bar, harm=(1, .3), attack=.3, release=.8), t, .22)
    t += bar; k += 1
beat = 0.75
for b in np.arange(0, SPLIT, beat):           # battement de cœur discret
    kt = np.arange(int(SR * .35)) / SR
    add(music, np.sin(2 * np.pi * (55 + 40 * np.exp(-kt * 30)) * kt) * np.exp(-kt * 9), b, .45)
# Partie B : solution (22,6 s – fin), 100 bpm, do majeur, entraînant
spb = 0.6
chordsB = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
t = SPLIT; k = 0
while t < DUR:
    ch = chordsB[k % 4]
    for m in ch:
        add(music, tone(note(m), spb * 4 + .3, harm=(1, .3, .1), attack=.05, release=.6), t, .13)
    add(music, tone(note(ch[0] - 24), spb * 4, harm=(1, .4), attack=.02, release=.3), t, .24)
    for s in range(8):                         # arpège pincé
        m = ch[s % 3] + (12 if s >= 4 else 0)
        add(music, tone(note(m), .28, harm=(1, .2), attack=.003, release=.25), t + s * spb / 2, .07)
    t += spb * 4; k += 1
for b in np.arange(SPLIT, DUR, spb):           # kick + charleston
    kt = np.arange(int(SR * .3)) / SR
    add(music, np.sin(2 * np.pi * (50 + 60 * np.exp(-kt * 35)) * kt) * np.exp(-kt * 10), b, .5)
    hh = rng.standard_normal(int(SR * .05)) * np.exp(-np.arange(int(SR * .05)) / SR * 80)
    add(music, hh - lowpass(hh, .3), b + spb / 2, .08)
# fondu à la jonction, à l'entrée et à la sortie
tt = np.arange(N) / SR
music *= np.clip(tt / 1.0, 0, 1) * np.clip((DUR - tt) / 1.5, 0, 1)
dip = 1 - 0.6 * np.exp(-((tt - SPLIT) / .4) ** 2)
music *= dip

# Effets sonores
sfx = np.zeros(N)
def whoosh(d=.6):
    n = int(SR * d); x = rng.standard_normal(n)
    env = np.sin(np.pi * np.arange(n) / n) ** 2
    return lowpass(x, .08) * env * 3
def pop():
    t = np.arange(int(SR * .09)) / SR
    return np.sin(2 * np.pi * (600 + 7000 * t) * t) * np.exp(-t * 40)
def stamp():
    t = np.arange(int(SR * .25)) / SR
    return (np.sin(2 * np.pi * 110 * t) * 1.2 + rng.standard_normal(len(t)) * .4) * np.exp(-t * 22)
def boom():
    t = np.arange(int(SR * 1.2)) / SR
    return np.sin(2 * np.pi * (45 + 30 * np.exp(-t * 6)) * t) * np.exp(-t * 3)
def ding():
    t = np.arange(int(SR * 1.2)) / SR
    return (np.sin(2 * np.pi * 1318 * t) + .6 * np.sin(2 * np.pi * 1975 * t) + .3 * np.sin(2 * np.pi * 2637 * t)) * np.exp(-t * 4)
def riser(d=1.2):
    n = int(SR * d); t = np.arange(n) / SR
    return lowpass(rng.standard_normal(n), .03 + .2 * t / d) * (t / d) ** 2 * 3

add(sfx, boom(), 0.0, .8)
for at in (4.05, 8.26, 16.22, 22.64, 29.79, 40.65, 44.23):
    add(sfx, whoosh(), at - .3, .5)
M2 = 22.64
for d in (.4, 2.06, 3.66, 5.26): add(sfx, pop(), M2 + d, .5)
for d in (.95, 2.6, 4.2, 5.8): add(sfx, stamp(), M2 + d, .6)
M3 = 29.79
for d in (.6, 3.6, 7.5): add(sfx, pop(), M3 + d, .5)
M4 = 44.23
add(sfx, whoosh(.4), M4 + 2.05, .6)
add(sfx, ding(), M4 + 2.9, .45)
add(sfx, riser(), M4 + 2.9, .4)
add(sfx, pop(), M4 + 4.1, .6)

def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * .9
    st = np.repeat((x * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(os.path.join(HERE, name), 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
save('music.wav', music)
save('sfx.wav', sfx)
print('ok')
