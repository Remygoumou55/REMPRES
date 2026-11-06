"""Vidéo 5 : ambiance premium originale (piano + cordes douces, mi bémol majeur, 72 bpm) et effets métalliques discrets."""
import numpy as np, wave, os
SR=44100; DUR=34.5; N=int(SR*DUR); rng=np.random.default_rng(505)
HERE=os.path.dirname(os.path.abspath(__file__)); tt=np.arange(N)/SR
hz=lambda m: 440*2**((m-69)/12)
def add(b,s,at,g=1.0):
    i=int(at*SR); j=min(len(b),i+len(s))
    if 0<=i<len(b): b[i:j]+=s[:j-i]*g
def piano(m,d=2.2):
    t=np.arange(int(SR*d))/SR; f=hz(m)
    s=sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t*(1.6+k*.9)) for k,a in ((1,1),(2,.45),(3,.2),(4,.08)))
    return s*np.clip(t/.004,0,1)
def pad(m,d):
    n=int(SR*d); t=np.arange(n)/SR
    s=sum(np.sin(2*np.pi*hz(m+det)*t)+.3*np.sin(4*np.pi*hz(m+det)*t) for det in (-.08,0,.07))
    return s*np.clip(t/1.5,0,1)*np.clip((d-t)/1.5,0,1)
mus=np.zeros(N)
prog=[(51,55,58,62),(48,51,55,58),(44,48,51,55),(46,50,53,58)]   # Eb Cm Ab Bb
bar=60/72*4; t0=0; k=0
while t0<DUR:
    ch=prog[k%4]
    for m in ch[:3]: add(mus,pad(m,bar+2),t0,.05)
    add(mus,piano(ch[0]-12,3),t0,.35)
    for s,m in enumerate((ch[1]+12,ch[2]+12,ch[3]+12,ch[2]+12)): add(mus,piano(m),t0+s*bar/4+.02,.18)
    t0+=bar; k+=1
mus*=np.clip(tt/1.5,0,1)*np.clip((DUR-tt)/2.5,0,1)
sfx=np.zeros(N)
def clink():
    t=np.arange(int(SR*1.5))/SR
    return sum(a*np.sin(2*np.pi*f*t)*np.exp(-t*d) for a,f,d in ((1,2093,5),(.6,3136,7),(.35,4699,9),(.2,5587,12)))
def swish(d=.8):
    n=int(SR*d); x=rng.standard_normal(n); y=np.empty(n); s=0
    for i in range(n): s+=.05*(x[i]-s); y[i]=s
    return y*np.sin(np.pi*np.arange(n)/n)**2*4
def low():
    t=np.arange(int(SR*1.4))/SR
    return np.sin(2*np.pi*(55+20*np.exp(-t*5))*t)*np.exp(-t*2.5)
add(sfx,low(),0,.6)
for at in (4.79,7.60,15.13,17.25,24.28): add(sfx,swish(),at-.45,.35)
for at in (5.6,13.70,27.76,31.4): add(sfx,clink(),at,.25)
def save(n,x):
    x=x/(np.abs(x).max()+1e-9)*.9; st=np.repeat((x*32767).astype(np.int16)[:,None],2,axis=1)
    with wave.open(os.path.join(HERE,n),'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
save('music.wav',mus); save('sfx.wav',sfx); print('ok')
