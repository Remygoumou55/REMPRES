import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=44100;DUR=50.5;N=int(SR*DUR);rng=np.random.default_rng(23)
BPM=76;beat=60/BPM;bar=4*beat
def lp(x,f,o=2):return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2):return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2):return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
hz=lambda m:440*2**((m-69)/12)
mus=np.zeros((2,N))
def add(buf,sig,t,pan=0.0,g=1.0):
    i=int(t*SR);j=min(N,i+len(sig))
    if j<=i or i<0:return
    s=sig[:j-i]*g;buf[0,i:j]+=s*np.sqrt((1-pan)/2);buf[1,i:j]+=s*np.sqrt((1+pan)/2)
# A minor lo-fi: Am9 | Fmaj9 | Cmaj9 | Em7(add11)
chords=[[57,60,64,67,71],[53,57,60,64,67],[48,55,59,62,64],[52,55,59,62,69]]
roots=[33,29,36,28]
def rhodes(m,d):
    t=np.arange(int(SR*d))/SR;f=hz(m)*(1+0.0015*np.sin(2*np.pi*0.3*t))
    env=np.exp(-t*1.1)*(1-np.exp(-t*90))
    s=np.sin(2*np.pi*f*t+0.8*np.sin(2*np.pi*f*t)*np.exp(-t*3))  # light FM bell-ish
    return lp(s*env*(1+0.12*np.sin(2*np.pi*3.2*t)),3500)
def sub(m,d):
    t=np.arange(int(SR*d))/SR;return np.sin(2*np.pi*hz(m)*t)*np.minimum(1,t/0.03)*np.minimum(1,(d-t)/0.08)
def kick():
    t=np.arange(int(SR*0.35))/SR;f=48+60*np.exp(-t*35);return lp(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10),900)
def rim():
    t=np.arange(int(SR*0.12))/SR;return bp(rng.standard_normal(len(t)),900,3500)*np.exp(-t*45)*0.8+np.sin(2*np.pi*1700*t)*np.exp(-t*80)*0.3
def hat(o=False):
    t=np.arange(int(SR*(0.18 if o else 0.06)))/SR;return hp(rng.standard_normal(len(t)),7000)*np.exp(-t*(18 if o else 70))
def bell(m):
    t=np.arange(int(SR*1.6))/SR;f=hz(m);return (np.sin(2*np.pi*f*t)+0.25*np.sin(2*np.pi*2.76*f*t)*np.exp(-t*4))*np.exp(-t*2.2)*np.minimum(1,t*300)
sw=beat*0.58  # swing 8th
for b in range(int(DUR/bar)+1):
    t0=b*bar;c=chords[b%4];r=roots[b%4]
    for k,m in enumerate(c):add(mus,rhodes(m,bar*0.98),t0+k*0.018,-0.35+0.17*k,0.085)
    add(mus,rhodes(c[2],beat*1.5),t0+2.5*beat,0.2,0.04)
    if t0>3.4:add(mus,sub(r,bar*0.95),t0,0,0.26)
    for q in range(4):
        tb=t0+q*beat
        if 3.6<=tb<48.3:
            if q==0 or (q==2 and b%2): add(mus,kick(),tb,0,0.25)
            if q==2 and not b%2: add(mus,kick(),tb+beat*0.5,0,0.18)
            if q in(1,3): add(mus,rim(),tb,0.15,0.10)
            add(mus,hat(),tb,0.35,0.045);add(mus,hat(),tb+sw,0.35,0.03)
    if 18.9<=t0<48:  # soft melody, pentatonic A minor
        mel=[69,72,76,74,72,69,67,69]
        for q in range(2):add(mus,bell(mel[(b*2+q)%8]+12),t0+q*2*beat+beat*0.5,-0.4 if q else 0.4,0.035)
# vinyl crackle + room tone
cr=np.zeros(N);idx=rng.integers(0,N,int(DUR*25));cr[idx]=rng.uniform(-1,1,len(idx));cr=bp(cr,800,6000)*0.25+lp(rng.standard_normal(N),400)*0.004
mus+=cr*0.4
mus=lp(mus,7500)
# wow & warm saturation
mus=np.tanh(mus*1.3)/1.3
t=np.arange(N)/SR;mus*=np.minimum(1,t/1.5)*np.clip((DUR-t)/3.0,0,1)
mus/=np.abs(mus).max();mus*=0.8
wavfile.write('music.wav',SR,(mus.T*32767).astype(np.int16))
# -------- SFX (unique set) --------
fx=np.zeros((2,N))
def air(d=1.0):
    n=int(SR*d);t=np.arange(n)/SR;x=lp(rng.standard_normal(n),2500);x=bp(x,300,2400)
    env=(np.sin(np.pi*t/d)**3);return x*env
def mar(m):  # marimba
    t=np.arange(int(SR*0.5))/SR;f=hz(m);return (np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*4*f*t)*np.exp(-t*30))*np.exp(-t*9)*np.minimum(1,t*600)
def bub(m):
    t=np.arange(int(SR*0.15))/SR;f=hz(m)*(1+0.8*t/0.15);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/0.15)**2
def soft_hit():
    t=np.arange(int(SR*0.6))/SR;f=55+40*np.exp(-t*20);return lp(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*6),500)
def chime(ms):
    return sum(bell(m) for m in ms)/len(ms)
P=lambda s,t,g,pan=0:add(fx,s,t,pan,g)
for tt in[3.6,7.9,15.1,19.0,31.9,35.9,38.8,42.85]:P(air(1.1),tt-0.55,0.22)
P(mar(76),0.1,0.10);P(mar(81),2.65,0.14)
P(bub(72),8.1,0.10,-0.3);P(bub(76),10.31,0.10,0.3);P(bub(69),10.9,0.07,-0.2);P(bub(74),11.3,0.07,0.2)
P(mar(79),11.99,0.08);P(mar(83),12.9,0.08)
P(soft_hit(),14.1,0.30)
P(mar(76),19.0,0.08);P(mar(81),21.2,0.08)
for i,tt in enumerate([24.1,25.17,26.29,28.1,29.18,30.45]):P(mar([69,72,74,76,79,81][i]),tt,0.10,(-0.2+0.08*i))
P(air(0.7),34.0,0.12);P(mar(79),37.6,0.08)
P(bub(72),40.62,0.08);P(soft_hit(),43.95,0.28);P(chime([81,85,88]),44.0,0.09)
P(mar(84),47.19,0.11);P(chime([88,93]),47.25,0.05)
wavfile.write('sfx.wav',SR,(np.clip(fx,-1,1).T*32767).astype(np.int16))
print('ok',np.abs(fx).max())
