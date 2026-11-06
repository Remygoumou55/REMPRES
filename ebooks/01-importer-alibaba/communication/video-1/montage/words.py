import json,re
exec(open('align.py').read().split("N=len(words)")[0].split("segs=[];t=0.0")[0])  # syl()
chunks=json.load(open('chunks.json'))
out=[]
for s,e,t in chunks:
    ws=t.split(); sy=[max(syl(w),1) if re.search(r'\w',w) else 0 for w in ws]; tot=sum(sy) or 1
    c=s; wl=[]
    for w,y in zip(ws,sy):
        d=(e-s)*y/tot; wl.append([w,round(c,3),round(c+d,3)]); c+=d
    out.append({"s":s,"e":e,"w":wl})
json.dump(out,open('words.json','w'),ensure_ascii=False)
print(len(out))
