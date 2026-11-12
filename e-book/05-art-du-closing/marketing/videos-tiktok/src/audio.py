"""Musique des pubs TikTok : groove afro léger, 100 bpm, ré mineur -> fa majeur, + whoosh aux changements de scène."""
import numpy as np, wave, sys, json
from scipy.signal import butter, sosfilt
SR=44100; V=sys.argv[1]; DUR=float(sys.argv[2]) if len(sys.argv)>2 else 25.0; N=int(SR*DUR)
CUTS={'A':[4.2,8.6,15.6,19.4],'B':[4,8.6,14.6,19.4],'C':[4.6,9,15.6,19.4],'D':[4.2,8.6,14.6,19.4],'E':[4.2,8.6,15.2,19.4],'F':[4.4,8.8,14.8,19.4],'A2':[3.6,6.1,11.3,14.1]}[V]
rng=np.random.default_rng(7)
hz=lambda m:440*2**((m-69)/12)
def T(d): return np.arange(int(SR*d))/SR
def filt(x,f,k='low',o=2): return sosfilt(butter(o,f,k,fs=SR,output='sos'),x)
L=np.zeros((2,N))
def add(s,at,g=1,pan=0):
    i=int(at*SR); j=min(N,i+len(s))
    if i>=N: return
    s=s[:j-i]*g; L[0,i:j]+=s*(1-max(0,pan)); L[1,i:j]+=s*(1+min(0,pan))
def kick():
    t=T(.35); return np.sin(2*np.pi*(50+90*np.exp(-t*30))*t)*np.exp(-t*9)
def shaker():
    n=filt(rng.standard_normal(int(SR*.06)),5000,'high'); return n*np.exp(-np.arange(len(n))/SR*60)
def marimba(m,d=.5):
    t=T(d); f=hz(m); return (np.sin(2*np.pi*f*t)+.3*np.sin(2*np.pi*4*f*t)*np.exp(-t*30))*np.exp(-t*7)
def bass(m,d):
    t=T(d); f=hz(m); s=np.sin(2*np.pi*f*t)+.3*np.sin(4*np.pi*f*t); return filt(s,400)*np.clip(t/.01,0,1)*np.clip((d-t)/.05,0,1)
def pad(ms,d):
    t=T(d); s=sum(np.sin(2*np.pi*hz(m)*t+rng.uniform(0,6))+np.sin(2*np.pi*hz(m+.07)*t) for m in ms)
    return filt(s,1200)*np.clip(t/.6,0,1)*np.clip((d-t)/.6,0,1)/len(ms)
def whoosh():
    n=rng.standard_normal(int(SR*.45)); t=np.arange(len(n))/SR
    return filt(n,1800)*np.sin(np.pi*t/.45)**2
spb=60/100; chords=[(50,53,57,62),(46,50,53,58),(48,52,55,60),(53,57,60,65)]
b=0;k=0
while b<DUR-.1:
    ch=chords[k%4]; add(pad(ch[1:],spb*4+.3),b,.10)
    add(bass(ch[0]-12,spb*1.5),b,.32); add(bass(ch[0]-12,spb*.5),b+spb*2.5,.25); add(bass(ch[0]-5,spb),b+spb*3,.22)
    for q in range(4):
        add(kick(),b+q*spb,.5 if b>=.6 else .0)
        for e in range(2): add(shaker(),b+q*spb+e*spb/2+spb/4,.08,(-.4,.4)[e])
    for q,n in enumerate([0,2,1,3,2,1,3,2]):
        add(marimba(ch[n]+12),b+q*spb/2,.11,(-.3,.3)[q%2])
    b+=spb*4; k+=1
for c in CUTS: add(whoosh(),c-.25,.18)
fade=np.ones(N); f=int(SR*1.5); fade[-f:]=np.linspace(1,0,f); L*=fade
L/=np.abs(L).max()*1.12
w=wave.open(f'music-{V}.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((L.T*32767).astype('<i2').tobytes()); w.close(); print('ok',V)
