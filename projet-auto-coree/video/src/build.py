"""Assemble la vidéo verticale 1080x1920 à partir des photos + calques texte (scenes.json)."""
import json, subprocess, os
here = os.path.dirname(os.path.abspath(__file__))
photos = os.path.join(here, '..', '..', 'photos')
scenes = json.load(open(os.path.join(here, 'scenes.json')))
FPS, T = 30, 0.5  # images/s, durée des fondus
parts = []
for s in scenes:
    out = os.path.join(here, f"clip_{s['id']}.mp4"); d = s['dur']
    ov = os.path.join(here, f"ov_{s['id']}.png")
    if s.get('full'):
        cmd = ['ffmpeg','-y','-loop','1','-t',str(d),'-i',ov,
               '-vf',f"scale=1080:1920,format=yuv420p,fps={FPS}",'-c:v','libx264','-preset','medium','-crf','20',out]
    else:
        # image agrandie puis recadrée avec un déplacement lent (effet "travelling")
        pan = s.get('pan','right')
        big = 'scale=-2:2240'  # photo 3:4 agrandie en 1680x2240 pour laisser de la marge au travelling
        x = {'right':f"(in_w-1080)*t/{d}", 'left':f"(in_w-1080)*(1-t/{d})"}.get(pan, "(in_w-1080)/2")
        y = {'down':f"(in_h-1920)*t/{d}", 'up':f"(in_h-1920)*(1-t/{d})"}.get(pan, "(in_h-1920)/2")
        vf = (f"[0:v]{big},fps={FPS},crop=1080:1920:x='{x}':y='{y}',eq=contrast=1.06:saturation=1.08[bg];"
              f"[bg][1:v]overlay=0:0,format=yuv420p")
        cmd = ['ffmpeg','-y','-loop','1','-t',str(d),'-i',os.path.join(photos,s['photo']),
               '-loop','1','-t',str(d),'-i',ov,'-filter_complex',vf,'-c:v','libx264','-preset','medium','-crf','20',out]
    subprocess.run(cmd, check=True, capture_output=True); parts.append((out, d))
# enchaînement avec fondus (xfade)
inputs, fc, prev, offset = [], [], '0:v', 0.0
for i,(p,d) in enumerate(parts): inputs += ['-i', p]
for i in range(1, len(parts)):
    offset += parts[i-1][1] - T
    trans = 'fade' if i in (1, len(parts)-2) else 'smoothleft'
    lab = f'v{i}'; fc.append(f"[{prev}][{i}:v]xfade=transition={trans}:duration={T}:offset={offset:.2f}[{lab}]"); prev = lab
final = os.path.join(here, '..', 'demo-corolla-tiktok.mp4')
subprocess.run(['ffmpeg','-y',*inputs,'-filter_complex',';'.join(fc),'-map',f'[{prev}]',
                '-c:v','libx264','-preset','medium','-crf','21','-pix_fmt','yuv420p','-movflags','+faststart',final], check=True, capture_output=True)
for p,_ in parts: os.remove(p)
print('OK', final)
