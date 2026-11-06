import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=44100;DUR=50.5;N=int(SR*DUR);rng=np.random.default_rng(7)
BPM=84;beat=60/BPM;bar=4*beat
def lp(x,f,o=2):return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2):return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2):return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
def hz(m):return 440*2**((m-69)/12)
mus=np.zeros((2,N))
def add(buf,sig,t,pan=0.0,g=1.0):
    i=int(t*SR);j=min(N,i+len(sig))
    if j<=i:return
    s=sig[:j-i]*g;buf[0,i:j]+=s*np.sqrt((1-pan)/2);buf[1,i:j]+=s*np.sqrt((1+pan)/2)
# progression (C major, warm): Cadd9 | Am7 | Fmaj7 | G6sus
chords=[[48,55,62,64,67],[45,52,60,64,67],[41,48,57,64,67],[43,50,59,62,67]]
roots=[36,33,29,31]
def epiano(m,d):
    t=np.arange(int(SR*d))/SR;f=hz(m)
    env=np.exp(-t*2.2)*(1-np.exp(-t*200))
    s=np.sin(2*np.pi*f*t)+0.35*np.sin(2*np.pi*2*f*t)*np.exp(-t*4)+0.08*np.sin(2*np.pi*3*f*t)*np.exp(-t*6)
    return s*env*(1+0.08*np.sin(2*np.pi*4.5*t))
def pad(ms,d):
    t=np.arange(int(SR*d))/SR;s=np.zeros_like(t)
    for m in ms:
        for det in(-0.08,0.08):
            ph=2*np.pi*hz(m+det)*t;s+=(2*((ph/(2*np.pi))%1)-1)*0.5
    s=lp(s,1200);a=np.minimum(1,t/0.8)*np.minimum(1,(d-t)/0.8);return s*a/len(ms)
def bass(m,d):
    t=np.arange(int(SR*d))/SR;return np.sin(2*np.pi*hz(m)*t)*np.minimum(1,t/0.02)*np.exp(-t*1.2)
def kick():
    t=np.arange(int(SR*0.4))/SR;f=50+90*np.exp(-t*30);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*9)
def shaker():
    t=np.arange(int(SR*0.09))/SR;return hp(rng.standard_normal(len(t)),6000)*np.exp(-t*50)
def pluck(m):
    t=np.arange(int(SR*0.6))/SR;f=hz(m);return (np.sin(2*np.pi*f*t)+0.3*np.sin(4*np.pi*f*t))*np.exp(-t*7)*np.minimum(1,t*400)
nb=int(DUR/bar)+1
for b in range(nb):
    t0=b*bar;c=chords[b%4];r=roots[b%4]
    add(mus,pad(c,bar+0.6),t0,0,0.22)
    for k,m in enumerate(c[1:]):
        add(mus,epiano(m+12,bar),t0+k*0.012,(-0.4+0.25*k),0.10)
    if t0>3.5:
        add(mus,bass(r,beat*2),t0,0,0.32);add(mus,bass(r,beat*2),t0+2*beat,0,0.26)
    for q in range(4):
        tb=t0+q*beat
        if 3.6<=tb<48.5:
            if q in(0,2):add(mus,kick(),tb,0,0.22)
            add(mus,shaker(),tb+beat/2,0.3,0.07)
            if tb>19.0: add(mus,shaker(),tb+beat*0.75,-0.3,0.04)
    if t0>=19.0:   # arpeggio lift on solution + offer
        arp=[c[2]+12,c[3]+12,c[4]+12,c[3]+12]
        for q in range(8):add(mus,pluck(arp[q%4]),t0+q*beat/2,(-0.5 if q%2 else 0.5),0.045 if t0<42 else 0.06)
mus=lp(mus,9000)
# master fades
t=np.arange(N)/SR;fade=np.minimum(1,t/1.2)*np.clip((DUR-t)/2.5,0,1);mus*=fade
mus/=np.abs(mus).max();mus*=0.8
wavfile.write('music.wav',SR,(mus.T*32767).astype(np.int16))
# ---------- SFX ----------
sfx=np.zeros((2,N))
def whoosh(d=0.55,up=True):
    n=int(SR*d);x=rng.standard_normal(n);t=np.arange(n)/SR
    out=np.zeros(n);seg=512
    for i in range(0,n,seg):
        p=i/n;fc=(400+5000*p) if up else (5400-5000*p)
        out[i:i+seg]=bp(x[i:i+seg+0],max(200,fc*0.6),min(18000,fc*1.4),1)[:len(out[i:i+seg])]
    env=np.sin(np.pi*np.minimum(1,t/d))**2;return lp(out*env,8000)
def pop(f=900):
    t=np.arange(int(SR*0.12))/SR;fr=f*(1+0.6*np.exp(-t*60));return np.sin(2*np.pi*np.cumsum(fr)/SR)*np.exp(-t*35)
def thump():
    t=np.arange(int(SR*0.35))/SR;f=70+120*np.exp(-t*25);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*12)+0.15*lp(rng.standard_normal(len(t)),2000)*np.exp(-t*40)
def ding():
    t=np.arange(int(SR*1.4))/SR;return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for f,a,d in[(1318.5,1,3),(1975.5,.5,4),(2637,.25,6)])
def swipe():return whoosh(0.3,True)
def scratch():
    n=int(SR*0.3);t=np.arange(n)/SR;return bp(rng.standard_normal(n),1500,4000)*np.sin(np.pi*t/0.3)
def riser(d=2.0):
    n=int(SR*d);t=np.arange(n)/SR;x=hp(rng.standard_normal(n),3000)*(t/d)**2;return x
def place(sig,tt,g,pan=0):add(sfx,sig,tt,pan,g)
G=0.5
for tt in[3.65,8.0,15.0,19.0,31.9,35.9,39.6,43.6]:place(lp(whoosh(0.6),5000),tt-0.32,0.20*G,0)
place(riser(2.0),1.2,0.06)
for tt in[0.05,2.62]:place(pop(700),tt,0.2*G)
for tt in[8.1,8.7,9.3,10.31,10.85,11.35]:place(pop(800+60*(tt%3)),tt,0.14*G,(-0.3 if int(tt*10)%2 else 0.3))
for tt in[12.0,12.75]:place(pop(1000),tt,0.15*G)
place(thump(),14.05,0.35*G)
place(pop(1000),19.0,0.15*G);place(thump(),25.17,0.35*G)
for tt in[26.29,26.95,28.10,29.18,29.62,30.45]:place(pop(950),tt,0.13*G,0.2)
for tt in[34.06,36.78]:place(swipe(),tt-0.12,0.18*G,-0.3)
place(pop(800),42.4,0.15*G);place(scratch(),42.75,0.12*G);place(thump(),43.1,0.35*G);place(ding(),43.15,0.12*G)
place(pop(1300),45.85,0.2*G);place(ding(),45.9,0.08*G)
sfx=np.clip(sfx,-1,1)
wavfile.write('sfx.wav',SR,(sfx.T*32767).astype(np.int16))
print('ok',np.abs(sfx).max())
