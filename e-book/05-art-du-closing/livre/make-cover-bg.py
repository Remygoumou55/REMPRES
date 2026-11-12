"""Fond de couverture : vert profond + illustration BD fusionnés en UNE image (fondu doux, sans ligne droite).
Source : illustrations/cover-src.jpg si elle existe (image faite pour la couverture), sinon ill-01-premier-non.jpg.
Usage : python3 make-cover-bg.py -> illustrations/cover-bg-a4.jpg"""
import os
from PIL import Image
import numpy as np
VERT = np.array([18, 59, 47], float)
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'illustrations')
src_path = os.path.join(D, 'cover-src.jpg')
if not os.path.exists(src_path): src_path = os.path.join(D, 'ill-01-premier-non.jpg')
src = Image.open(src_path).convert('RGB')
def make(W, H, top, blend, out):
    bg = np.ones((H, W, 3)) * VERT
    s = max(W / src.width, (H * (1 - top)) / src.height)        # l'image couvre toute la largeur et le bas
    iw, ih = int(src.width * s), int(src.height * s)
    im = np.asarray(src.resize((iw, ih), Image.LANCZOS), float)
    x0 = (iw - W) // 2; im = im[:, x0:x0 + W]
    y0 = int(top * H); y1 = min(H, y0 + ih)
    photo = np.zeros((H, W, 3)); photo[y0:y1] = im[:y1 - y0]
    y = np.arange(H) / H
    a = np.clip((y - top) / blend, 0, 1); a = a * a * (3 - 2 * a); a[y < top] = 0
    img = bg * (1 - a[:, None, None]) + photo * a[:, None, None]
    d = np.clip((y - 0.80) / 0.14, 0, 1); d = d * d * (3 - 2 * d) * 0.9   # bas assombri pour le texte
    img = img * (1 - d[:, None, None]) + np.array([12, 40, 32]) * d[:, None, None]
    Image.fromarray(img.clip(0, 255).astype('uint8')).save(out, quality=90)
make(1680, 2376, 0.30, 0.16, os.path.join(D, 'cover-bg-a4.jpg'))
print('ok', os.path.basename(src_path))
