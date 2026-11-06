import re,json
txt="""Arrête de regarder des vidéos sur l'importation. Commence.
Avec « Briser la peur d'importer », le guide Alibaba de A à Z.
Une vidéo te dit de commencer par ici. Une autre te dit le contraire. Tu notes, tu enregistres, tu te perds.
Ce n'est pas ta faute. Ce qu'il te manque, ce n'est pas une vidéo de plus. C'est une méthode, du début à la fin, dans le bon ordre.
« Briser la peur d'importer », c'est ça : seize étapes claires. Créer ton compte. Trouver ton produit. Choisir ton fournisseur. Payer. Calculer le transport. Recevoir ton colis.
Chaque mot est expliqué simplement. Chaque étape a son exemple et sa checklist. Et à la fin, un plan d'action de trente jours pour passer ta première commande.
trois mille neuf cents francs CFA. Arrête de regarder : clique sur « Commander maintenant »."""
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
sil=[(2.29882, 2.67059), (3.21247, 3.64814), (5.41807, 5.60605), (7.59676, 8.09601), (9.96401, 10.3097), (11.6314, 11.9899), (13.5291, 14.0155), (14.7326, 15.1871), (15.9832, 16.3247), (18.677, 18.9939), (19.8548, 20.0305), (21.0208, 21.197), (22.0448, 22.4847), (23.6273, 24.0973), (24.9298, 25.1664), (26.0553, 26.2912), (27.8289, 28.1026), (28.9544, 29.1835), (30.2703, 30.4467), (31.4494, 32.0335), (33.7145, 34.0637), (36.4535, 36.7837), (37.3017, 37.5545), (40.0903, 40.6229), (41.9915, 42.303), (45.3573, 45.8898), (46.8254, 47.1869), (48.5752, 48.849)]
segs=[];t=0.0
for a,b in sil: segs.append((t,a)); t=b

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
