# Montage vidéo 1 : comment c'est fabriqué

- `align.py` / `words.py` : calent les sous-titres sur la voix (V1-VOIX.mp3), à partir des silences → `words.json`.
- `comp.html` : tout le motion design (accroche, couverture, schéma, cartes, pages, offre, sous-titres). `render(t)` dessine l'image au temps t.
- `render.js` : rend les images transparentes 1080×1920 à 30 i/s avec Playwright (`node render.js 0 57.5 30 ov`). Les images du livre sont dans `assets/` (cover.png, p28, p29, p38, p39, p46, p50, kits), rendues depuis les PDF de `dist/` avec pdftoppm.
- `music.py` : musique originale composée par programme (84 BPM, Do majeur, douce) + effets sonores (whoosh, pops, impacts, ding) → `music.wav`, `sfx.wav`. Aucun droit d'auteur.
- Mixage ffmpeg : voix compressée, musique baissée automatiquement sous la voix (sidechain), ambiance des scènes à 12 %, normalisation −14 LUFS.

Découpage : S1 0–3 s · couverture 3–7 s (S1 floutée) · S2 7–12,2 · S3 12,2–14,3 · schéma 14,3–20,75 · S3 20,75–23,75 · checklist 23,75–26,85 · S4 + peurs 26,85–32,4 · pages du livre 32,4–45 · S5 45–47,75 · offre 47,75–57,5.
