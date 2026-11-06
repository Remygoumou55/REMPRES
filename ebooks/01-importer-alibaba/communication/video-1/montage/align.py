import re,json
txt="""Ton grossiste achète sur Alibaba. Pourquoi pas toi ?
La réponse tient dans un seul guide : « Briser la peur d'importer ».
Tous les jours, tu vas au marché. Tu achètes chez le grossiste. Tu revends un peu plus cher… et ta marge est toute petite.
Pendant ce temps, ton grossiste commande les mêmes produits en Chine, directement à l'usine. Et c'est lui qui gagne le plus.
On t'a dit de commencer par le marché local. Tu l'as fait. Tu sais déjà acheter et revendre. Tu as fait le plus dur.
Ce qui te bloque maintenant, c'est la peur : peur de l'arnaque, peur des calculs, peur de la douane.
Ce guide te donne tout ce qu'il faut savoir avant ta première commande : trouver un fournisseur sérieux, payer sans risque, calculer le transport, passer la douane. Avec des exemples, des captures d'écran et des messages prêts à copier.
Commence petit, comme ton grossiste a commencé.
Le guide et ses trois kits : au lieu de cinq mille francs, seulement trois mille neuf cents francs CFA.
Clique sur « Commander maintenant », et achète enfin à la source."""
words=txt.split()
def syl(w):
    w=w.lower(); w=re.sub(r"[^a-zàâäéèêëîïôöùûüç']","",w)
    n=len(re.findall(r"[aeiouyàâäéèêëîïôöùûü]+",w))
    if w.endswith('e') and n>1 and not w.endswith(('ée',)): n-=1
    if w.endswith('es') and n>1: n-=1
    if w.endswith('ent') and n>1 and w not in('maintenant','directement','comment'): n-=1
    return max(n,1) if w else 0
S=[syl(w) for w in words]
punct=[bool(re.search(r"[.,:?…»]$",w)) for w in words]
sil=[(1.78322,2.16252),(2.77177,3.19211),(4.86637,5.16878),(6.62297,7.15313),(8.62134,9.052),(10.2661,10.6112),(12.0541,12.3868),(13.9751,14.3763),(14.982,15.2481),(18.666,18.9457),(20.4795,20.9197),(22.7372,23.0725),(23.469,23.8202),(25.4048,25.6516),(26.5203,26.982),(28.908,29.2848),(30.0495,30.3259),(31.1536,31.3539),(32.0904,32.533),(35.8419,36.2237),(37.591,37.8841),(38.7202,38.9436),(40.0349,40.2476),(40.9488,41.3109),(44.6658,45.0728),(45.8232,46.0674),(47.4022,47.8241),(49.1238,49.3443),(52.258,52.6271),(55.7967,55.9543)]
segs=[];t=0.0
for a,b in sil: segs.append((t,a)); t=b
segs.append((t,55.95)) if t<55.9 else None
segs=[s for s in segs if s[1]-s[0]>0.05]
tot=sum(e-s for s,e in segs); rate=tot/sum(S)
print('segs',len(segs),'rate s/syl',round(rate,3))
N=len(words);K=len(segs);INF=1e18
pre=[0]
for x in S: pre.append(pre[-1]+x)
dp=[[INF]*(N+1) for _ in range(K+1)];bk=[[0]*(N+1) for _ in range(K+1)]
dp[0][0]=0
for k in range(1,K+1):
  d=segs[k-1][1]-segs[k-1][0]
  for j in range(1,N+1):
    for i in range(max(0,j-25),j):
      if dp[k-1][i]>=INF: continue
      c=dp[k-1][i]+((pre[j]-pre[i])*rate-d)**2/ max(d,0.5)+(0 if punct[j-1] or j==N else 0.6)
      if c<dp[k][j]: dp[k][j]=c;bk[k][j]=i
j=N;out=[]
for k in range(K,0,-1):
  i=bk[k][j];out.append((segs[k-1][0],segs[k-1][1],' '.join(words[i:j])));j=i
out.reverse()
for s,e,t in out: print(f"{s:6.2f}-{e:6.2f} {t}")
json.dump(out,open('chunks.json','w'),ensure_ascii=False,indent=0)
