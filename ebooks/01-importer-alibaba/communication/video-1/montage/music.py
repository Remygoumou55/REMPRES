import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=44100;DUR=57.6;N=int(SR*DUR);rng=np.random.default_rng(11)
BPM=100;beat=60/BPM;bar=4*beat;s16=beat/4
def lp(x,f,o=2):return sosfilt(butter(o,f,'low',fs=SR,output='sos'),x)
def hp(x,f,o=2):return sosfilt(butter(o,f,'high',fs=SR,output='sos'),x)
def bp(x,a,b,o=2):return sosfilt(butter(o,[a,b],'band',fs=SR,output='sos'),x)
hz=lambda m:440*2**((m-69)/12)
mus=np.zeros((2,N))
def add(buf,sig,t,pan=0.0,g=1.0):
    i=int(t*SR);j=min(N,i+len(sig))
    if j<=i or i<0:return
    s=sig[:j-i]*g;buf[0,i:j]+=s*np.sqrt((1-pan)/2);buf[1,i:j]+=s*np.sqrt((1+pan)/2)
# D major warm: Dmaj7 | Bm7 | Gmaj7 | A6sus
chords=[[62,66,69,73],[59,62,66,69],[55,59,62,66],[57,62,64,66]];roots=[38,35,31,33]
def kalimba(m):
    t=np.arange(int(SR*1.2))/SR;f=hz(m)
    return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*5.4*f*t)*np.exp(-t*25)+0.15*np.sin(2*np.pi*2.01*f*t)*np.exp(-t*6))*np.exp(-t*3.5)*np.minimum(1,t*500)
def pad(ms,d):
    t=np.arange(int(SR*d))/SR;s=sum(np.sin(2*np.pi*hz(m)*t+0.3*np.sin(2*np.pi*hz(m)*2*t))+0.5*np.sin(2*np.pi*hz(m)*1.003*t) for m in ms)
    return lp(s,1500)*np.minimum(1,t/1.0)*np.minimum(1,(d-t)/1.0)/len(ms)
def logbass(m,d=0.45):
    t=np.arange(int(SR*d))/SR;f=hz(m)*(1+0.5*np.exp(-t*40));s=np.sin(2*np.pi*np.cumsum(f)/SR)
    return np.tanh(2*s)*np.exp(-t*5)*np.minimum(1,t*300)
def conga(m,d=0.25):
    t=np.arange(int(SR*d))/SR;f=hz(m)*(1+0.15*np.exp(-t*60));return (np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*18)+0.2*bp(rng.standard_normal(len(t)),1500,5000)*np.exp(-t*80))
def shaker(a=1):
    t=np.arange(int(SR*0.07))/SR;return bp(rng.standard_normal(len(t)),5000,12000)*np.exp(-t*45)*a
def kick():
    t=np.arange(int(SR*0.3))/SR;f=52+70*np.exp(-t*30);return lp(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*11),700)
cong_pat=[(0,63),(3,66),(6,63),(8,66),(10,70),(11,66),(14,63)]  # 16th positions
mel=[74,76,78,81,78,76,74,73, 74,78,81,83,81,78,76,74]
for b in range(int(DUR/bar)+1):
    t0=b*bar;c=chords[b%4];r=roots[b%4]
    add(mus,pad(c,bar+0.8),t0,0,0.16)
    if t0>3.0:
        for p,dd in [(0,0),(6,0),(10,0)]:add(mus,logbass(r+12,0.4),t0+p*s16,0,0.20)
    for q in range(16):
        tq=t0+q*s16
        if 3.1<=tq<55.5:
            add(mus,shaker(1 if q%4==2 else 0.55),tq,0.4,0.05)
            if q in(0,8):add(mus,kick(),tq,0,0.20)
    if 7.0<=t0<55.5:
        for p,m in cong_pat:add(mus,conga(m-12),t0+p*s16,-0.35,0.06)
    if t0>=14.0:
        for k in range(8):
            if k%2==0 or t0>=32: add(mus,kalimba(mel[(b%2)*8+k]),t0+k*beat/2,(0.3 if k%2 else -0.3),0.05 if t0<47 else 0.065)
    else:
        for k in range(4):add(mus,kalimba(c[k]+12),t0+k*beat,(0.3 if k%2 else -0.3),0.045)
mus=lp(mus,8000);mus=np.tanh(mus*1.2)/1.2
t=np.arange(N)/SR;mus*=np.minimum(1,t/1.0)*np.clip((DUR-t)/2.5,0,1)
mus/=np.abs(mus).max();mus*=0.8
wavfile.write('music.wav',SR,(mus.T*32767).astype(np.int16))
fx=np.zeros((2,N))
def wood(f=900):
    t=np.arange(int(SR*0.12))/SR;return (np.sin(2*np.pi*f*t)+0.5*np.sin(2*np.pi*2.6*f*t))*np.exp(-t*55)
def swish(d=0.9):
    n=int(SR*d);t=np.arange(n)/SR;x=bp(rng.standard_normal(n),2500,9000);return x*(np.sin(np.pi*t/d)**2)*(0.3+0.7*np.abs(np.sin(2*np.pi*14*t)))
def djembe():
    t=np.arange(int(SR*0.5))/SR;f=75+60*np.exp(-t*30);return lp(np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-t*7),600)+0.15*bp(rng.standard_normal(len(t)),300,1500)*np.exp(-t*40)
P=lambda s,t,g,pan=0:add(fx,s,t,pan,g)
for tt in[3.2,7.1,12.3,14.3,20.8,23.8,26.9,32.4,44.7,47.75]:P(swish(0.9),tt-0.45,0.10)
P(kalimba(86),0.05,0.10);P(wood(800),2.16,0.18)
P(wood(1000),7.4,0.10);P(wood(900),12.5,0.10)
P(wood(700),15.3,0.10);P(wood(800),15.8,0.10);P(kalimba(81),17.5,0.10);P(djembe(),19.2,0.30);P(wood(1100),19.9,0.10)
P(wood(1000),23.1,0.10);P(kalimba(78),24.3,0.10);P(kalimba(83),24.85,0.10);P(djembe(),25.65,0.32)
for tt in[29.28,30.33,31.35]:P(djembe(),tt,0.18,0.2)
P(kalimba(74),32.6,0.08)
for i,tt in enumerate([36.22,37.88,38.94,40.25]):P(kalimba([76,78,81,83][i]),tt,0.09,-0.2+0.13*i)
for i,tt in enumerate([41.31,42.36,43.2]):P(wood(900+150*i),tt,0.10)
P(wood(1000),45.2,0.10)
P(kalimba(74),47.85,0.08);P(wood(800),49.6,0.10);P(swish(0.35),50.45,0.08);P(djembe(),50.74,0.30);P(kalimba(86),50.78,0.09);P(kalimba(90),50.9,0.07)
P(wood(1200),52.6,0.14);P(kalimba(93),52.65,0.07)
wavfile.write('sfx.wav',SR,(np.clip(fx,-1,1).T*32767).astype(np.int16))
print('ok')
