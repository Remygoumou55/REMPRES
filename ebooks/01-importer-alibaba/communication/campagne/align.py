"""Aligne un texte (phrases) sur un fichier voix via les silences (sans reconnaissance vocale).
Usage : python3 align.py voix.mp3 texte.txt  -> imprime début/fin de chaque phrase."""
import sys, re, subprocess
mp3, txt = sys.argv[1], sys.argv[2]
out = subprocess.run(['ffmpeg','-v','info','-i',mp3,'-af','silencedetect=noise=-36dB:d=0.12','-f','null','-'],capture_output=True,text=True).stderr
dur = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',mp3],capture_output=True,text=True).stdout)
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', out)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', out)]
sil = list(zip(st, en + [dur]*(len(st)-len(en))))
# segments de parole
segs=[]; cur=0.0
for a,b in sil:
    if a-cur>0.05: segs.append((cur,a))
    cur=b
if dur-cur>0.05: segs.append((cur,dur))
phr=[l.strip() for l in open(txt) if l.strip()]
syl=lambda s: max(1,len(re.findall(r'[aeiouyéèêëàâîïôöûùü]+',s.lower())))
w=[syl(p) for p in phr]; W=sum(w)
speech=sum(b-a for a,b in segs)
# position cumulée de parole -> temps réel
def at(x):
    acc=0
    for a,b in segs:
        if acc+(b-a)>=x: return a+(x-acc)
        acc+=b-a
    return segs[-1][1]
gaps=[(a,b) for a,b in zip([s[1] for s in segs[:-1]],[s[0] for s in segs[1:]])]
def snap(t):
    best=min(gaps,key=lambda g: abs((g[0]+g[1])/2-t))
    return best
# programmation dynamique : choisir len(phr)-1 pauses, dans l'ordre, au plus près des positions attendues
import math
exp=[]; c=0
for i in range(len(phr)-1): c+=w[i]; exp.append(at(speech*c/W))
G=len(gaps); K=len(exp)
mid=[(g[0]+g[1])/2 for g in gaps]; L=[g[1]-g[0] for g in gaps]
INF=1e18; dp=[[INF]*(G+1) for _ in range(K+1)]; bk=[[0]*(G+1) for _ in range(K+1)]
for j in range(G+1): dp[0][j]=0
for k in range(1,K+1):
    for j in range(k,G+1):
        cost=(mid[j-1]-exp[k-1])**2 - 0.15*L[j-1]   # préfère les longues pauses
        best=min(range(k-1,j),key=lambda q: dp[k-1][q]) if True else 0
        dp[k][j]=dp[k-1][best]+cost; bk[k][j]=best
j=min(range(K,G+1),key=lambda q: dp[K][q]); pick=[]
for k in range(K,0,-1): pick.append(j-1); j=bk[k][j]
pick=pick[::-1]
res=[]; start=segs[0][0]
for i,p in enumerate(phr):
    if i<K: g=gaps[pick[i]]; res.append((start,g[0],p)); start=g[1]
    else: res.append((start,segs[-1][1],p))
for a,b,p in res: print(f"{a:6.2f} {b:6.2f}  {p}")
