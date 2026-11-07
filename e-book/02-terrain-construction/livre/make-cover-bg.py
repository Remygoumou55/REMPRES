"""Fabrique le fond de couverture (bleu nuit + photo fusionnés en UNE seule image, sans ligne droite).
Usage : python3 make-cover-bg.py  -> images/cover-bg-a4.jpg et images/cover-bg-phone.jpg"""
from PIL import Image
import numpy as np
NAVY = np.array([15, 42, 68], float)
src = Image.open('images/img-01.jpg').convert('RGB')
def make(W, H, top, blend, out):
    bg = np.ones((H, W, 3)) * NAVY
    s = W / src.width; ih = int(src.height * s)
    im = np.asarray(src.resize((W, ih), Image.LANCZOS), float)
    y0 = int(top * H); y1 = min(H, y0 + ih)
    photo = np.zeros((H, W, 3)); photo[y0:y1] = im[:y1 - y0]
    y = np.arange(H) / H
    a = np.clip((y - top) / blend, 0, 1); a = a * a * (3 - 2 * a)          # fondu doux (smoothstep)
    a[y < top] = 0
    out_img = bg * (1 - a[:, None, None]) + photo * a[:, None, None]
    d = np.clip((y - 0.72) / 0.22, 0, 1); d = d * d * (3 - 2 * d) * 0.92    # assombrit le bas pour le texte
    out_img = out_img * (1 - d[:, None, None]) + np.array([10, 28, 46]) * d[:, None, None]
    Image.fromarray(out_img.clip(0, 255).astype('uint8')).save(out, quality=90)
make(1654, 2339, 0.300, 0.150, 'images/cover-bg-a4.jpg')
make(850, 1512, 0.315, 0.140, 'images/cover-bg-phone.jpg')
print('ok')
