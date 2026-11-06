# Vidéo 2 · version 2 (refaite complètement)

**Identité propre à la vidéo 2 :** fond nuit violette (#1d1446 → #3a2a86), accent jaune lumière #FFC94A, police Poppins, sous-titres en bandeau sombre arrondi. Musique lo-fi originale (76 BPM, la mineur, piano électrique, vinyle) et effets propres (souffle d'air, marimba, bulles, cloche douce).

**Synchronisation :** la voix est transcrite mot par mot (`asr.py` → `transcription-voix.json`), puis chaque phrase est calée sur les silences réels de la voix (`phrases.json`). Chaque animation démarre exactement quand la phrase est dite.

**Corrections demandées par le client :**
- S3 : le sourire du début est coupé (départ à 1,4 s, ralenti doux).
- « 16 étapes » supprimé : la voix ne le dit pas. Seules les 6 étapes prononcées s'affichent, chacune au moment exact où elle est dite.
- La capture checklist sur S6 est placée en haut, au-dessus de la tête.
- Le pack sur S7 est réduit et placé dans le ciel. L'ancien prix n'apparaît qu'une fois le fond violet revenu.
- Animations plus lentes (0,6 à 0,9 s, courbes douces).
- Volumes : voix −19 LUFS (avant normalisation), musique −37 LUFS (18 dB sous la voix), effets environ 14 dB sous la voix. Final à −14 LUFS.
