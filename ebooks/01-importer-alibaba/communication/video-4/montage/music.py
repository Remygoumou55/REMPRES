import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=44100;DUR=79.1;N=int(SR*DUR);rng=np.random.default_rng(5)
BPM=92;beat=60/BPM;bar=4*beat
def lp(x,f,o=2):return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2):return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2):return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
hz=lambda m:440*2**((m-69)/12)
mus=np.zeros((2,N))
def add(buf,sig,t,pan=0.0,g=1.0):
    i=int(t*SR);j=min(N,i+len(sig))
    if j<=i or i<0:return
    s=sig[:j-i]*g;buf[0,i:j]+=s*np.sqrt((1-pan)/2);buf[1,i:j]+=s*np.sqrt((1+pan)/2)
# F major: Fadd9 | Dm7 | Bbmaj7 | C(sus4)
chords=[[53,60,65,67,69],[50,57,60,65,69],[46,53,57,62,65],[48,55,60,65,67]];roots=[41,38,34,36]
def piano(m,d=2.0,v=1):
    t=np.arange(int(SR*d))/SR;f=hz(m)
    s=sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*(1.5+k*1.2)) for k,a in [(1,1),(2,.45),(3,.18),(4,.08)])
    return s*np.minimum(1,t*400)*v
def pizz(m):
    t=np.arange(int(SR*0.5))/SR;f=hz(m);return lp((np.sin(2*np.pi*f*t)+.5*np.sin(4*np.pi*f*t))*np.exp(-t*12),2500)*np.minimum(1,t*800)
def tick(a=1):
    t=np.arange(int(SR*0.04))/SR;return hp(rng.standard_normal(len(t)),4000)*np.exp(-t*120)*a
def clap():
    t=np.arange(int(SR*0.2))/SR;x=bp(rng.standard_normal(len(t)),900,4000);env=np.exp(-t*25)*(1+0.6*np.exp(-((t-0.012)/0.004)**2))
    return x*env
def kick():
    t=np.arange(int(SR*0.3))/SR;f=55+50*np.exp(-t*30);return lp(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*10),600)
def bass(m,d):
    t=np.arange(int(SR*d))/SR;return lp(np.sin(2*np.pi*hz(m)*t)+.2*np.sin(4*np.pi*hz(m)*t),400)*np.minimum(1,t/.02)*np.exp(-t*1.4)
for b in range(int(DUR/bar)+1):
    t0=b*bar;c=chords[b%4];r=roots[b%4]
    for k in range(4):add(mus,piano(c[1+k%3]+12 if k%2 else c[2],1.8,.8),t0+k*beat,-0.25+0.17*k,0.07)
    add(mus,piano(c[0],bar,0.9),t0,0,0.06)
    if t0>3.4:add(mus,bass(r,bar*.9),t0,0,0.22);add(mus,bass(r,beat),t0+2.5*beat,0,0.14)
    for q in range(8):
        tq=t0+q*beat/2
        if 3.5<=tq<77.5:
            add(mus,tick(1 if q%2==0 else .5),tq,0.45,0.05)
            if q in(0,5):add(mus,kick(),tq,0,0.18)
            if q in(2,6) and t0>7.5:add(mus,clap(),tq,-0.1,0.05)
    if 7.5<=t0<77:
        arp=[c[2]+12,c[3]+12,c[4]+12,c[3]+12,c[2]+24,c[4]+12]
        for q in range(6):add(mus,pizz(arp[q]),t0+q*(bar/6),(-.4 if q%2 else .4),0.045)
mus=lp(mus,9000);mus=np.tanh(mus*1.1)/1.1
t=np.arange(N)/SR;mus*=np.minimum(1,t/1.0)*np.clip((DUR-t)/2.5,0,1)
mus/=np.abs(mus).max();mus*=0.8
wavfile.write('music.wav',SR,(mus.T*32767).astype(np.int16))
fx=np.zeros((2,N))
def msg():  # chat bubble "bloop"
    t=np.arange(int(SR*0.18))/SR;f=600+500*(t/0.18);return np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/0.18)**1.5
def paper(d=0.45):
    n=int(SR*d);t=np.arange(n)/SR;return bp(rng.standard_normal(n),1200,7000)*(np.sin(np.pi*t/d)**2)*(0.4+0.6*rng.random(n)**4)
def err():
    t=np.arange(int(SR*0.35))/SR;return lp(np.sign(np.sin(2*np.pi*180*t))*0.3+np.sin(2*np.pi*180*t),1200)*np.exp(-t*9)*np.minimum(1,t*300)
def ok():
    return sum(piano(m,1.2) for m in [77,81,84])/3
def tickfx():
    t=np.arange(int(SR*0.06))/SR;return np.sin(2*np.pi*2200*t)*np.exp(-t*90)
def whoosh(d=0.7):
    n=int(SR*d);t=np.arange(n)/SR;return lp(bp(rng.standard_normal(n),400,3000),3000)*(np.sin(np.pi*t/d)**3)
P=lambda s,t,g,pan=0:add(fx,s,t,pan,g)
P(err(),0.1,0.12);P(tickfx(),0.9,0.08)
for tt in[3.55,7.8,20.6,32.4,45.7,53.9,61.9,63.6,67.6,71.6,73.1]:P(whoosh(),tt-0.35,0.12)
P(paper(),3.7,0.10);P(msg(),6.71,0.10)
for tt in[7.81,20.67,32.43,45.75,53.98]:P(piano(84,1.0),tt,0.10)
P(msg(),11.3,0.14,-0.3);P(err(),14.07,0.16);P(tickfx(),15.1,0.08);P(msg(),18.44,0.14,0.3);P(ok(),18.5,0.07)
P(paper(),22.2,0.10)
for tt in[24.68,25.6,26.3]:P(tickfx(),tt,0.10)
P(paper(),27.5,0.10);P(ok(),29.7,0.07)
P(paper(),36.2,0.10)
for tt in[37.44,38.96,40.0]:P(tickfx(),tt,0.09)
P(paper(),41.3,0.10);P(err(),42.2,0.12);P(err(),43.6,0.12)
P(tickfx(),49.04,0.08);P(tickfx(),50.96,0.08);P(ok(),52.2,0.07)
for tt in[57.62,59.32,60.18]:P(tickfx(),tt,0.09)
P(err(),61.95,0.16)
P(ok(),65.81,0.07);P(paper(),67.6,0.10);P(paper(),67.9,0.08)
P(ok(),73.2,0.08);P(tickfx(),74.6,0.08);P(msg(),75.46,0.12);P(ok(),75.5,0.06)
wavfile.write('sfx.wav',SR,(np.clip(fx,-1,1).T*32767).astype(np.int16))
print('ok')
