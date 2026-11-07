# Usage: python3 check.py file.pdf outdir  -> fill ratio per page + contact sheets
import sys, subprocess, os, glob
from PIL import Image
pdf, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
for f in glob.glob(out+'/p-*.png'): os.remove(f)
subprocess.run(['pdftoppm','-r','30','-png',pdf,out+'/p'],check=True)
files = sorted(glob.glob(out+'/p-*.png'))
low=[]
for i,f in enumerate(files,1):
    im=Image.open(f).convert('L'); w,h=im.size
    px=im.load(); last=0
    for y in range(h-int(h*0.07)):  # ignore footer zone
        row=[px[x,y] for x in range(0,w,2)]
        if min(row)<200: last=y
    r=last/(h*0.93)
    if r<0.6: low.append((i,round(r,2)))
print('pages',len(files),'low-fill(<60%):',low)
# contact sheets 6x3
ims=[Image.open(f).convert('RGB') for f in files]
W,H=ims[0].size; per=18
for s in range(0,len(ims),per):
    sheet=Image.new('RGB',(W*6+70,H*3+40),'white')
    for k,im in enumerate(ims[s:s+per]):
        sheet.paste(im.resize((W,H)),(10+(k%6)*(W+10),10+(k//6)*(H+10)))
    sheet.save(f'{out}/sheet-{s//per+1}.png')
