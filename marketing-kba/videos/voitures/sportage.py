# Configuration vidéo : Kia Sportage 2.0 Turbo T-GDI (2011/2012), 12 500 $ TTC
VOIX = "audio/voix_sportage.mp3"
OUT = "KBA_Sportage_2012_12500_voix.mp4"
MODELE = "KIA SPORTAGE 2.0 TURBO"
PRIX = "12 500 $"
DUREE = 36.3
# pastille d'infos (texte, jusqu'à quand) : kilométrage affiché par transparence
INFO = ("2011-2012 · Essence · 153 059 km", 9.50)

# Texte exact de la voix off, calé sur les pauses mesurées dans le MP3 (silencedetect -30 dB / 70 ms)
BLOCS = [
    (0.00, 1.36, [("Kia", 1), ("Sportage", 3), ("Turbo.", 2)]),
    (1.71, 2.98, [("12 500", 5), ("dollars,", 2)]),
    (3.11, 4.11, [("toutes", 1), ("taxes", 1), ("comprises !", 2)]),
    (4.40, 5.88, [("2011-2012,", 8)]),
    (6.08, 7.59, [("essence,", 2), ("deux", 1), ("litres", 1), ("turbo,", 2)]),
    (7.73, 9.19, [("plus", 1), ("de", 1), ("260", 4), ("chevaux.", 2)]),
    (9.50, 10.42, [("Boîte", 1), ("automatique,", 4)]),
    (10.51, 11.61, [("jantes", 1), ("18", 2), ("pouces,", 1)]),
    (11.74, 13.37, [("et", 1), ("un", 1), ("grand", 1), ("toit", 1), ("ouvrant", 2), ("panoramique.", 4)]),
    (13.85, 14.72, [("Intérieur", 4), ("cuir,", 1)]),
    (14.85, 15.63, [("écran", 2), ("tactile,", 2)]),
    (15.75, 16.62, [("caméra", 3), ("de", 1), ("recul,", 2)]),
    (16.76, 18.19, [("climatisation", 5), ("automatique,", 4)]),
    (18.27, 19.19, [("démarrage", 3), ("sans", 1), ("clé.", 1)]),
    (19.52, 20.87, [("Châssis", 2), ("vérifié", 3), ("en", 1), ("vidéo", 2)]),
    (20.94, 21.67, [("avant", 2), ("tout", 1), ("paiement.", 2)]),
    (21.99, 22.41, [("Achat,", 2)]),
    (22.53, 23.61, [("transport,", 2), ("douane :", 2)]),
    (23.83, 24.42, [("tout", 1), ("est", 1), ("compris.", 2)]),
    (24.68, 25.99, [("50 %", 4), ("à", 1), ("la", 1), ("commande,", 3)]),
    (26.06, 28.52, [("le", 1), ("reste", 2), ("dès", 1), ("que", 1), ("vous", 1), ("recevez", 3), ("votre", 2), ("B/L.", 2)]),
    (28.84, 29.85, [("Passez", 2), ("votre", 2), ("commande", 2)]),
    (29.93, 30.36, [("chez", 1), ("KBA,", 3)]),
    (30.51, 31.07, [("lien", 1), ("en", 1), ("bio.", 2)]),
    (31.42, 31.98, [("Abonnez-vous :", 4)]),
    (32.21, 34.13, [("une", 1), ("voiture", 2), ("chaque", 1), ("soir", 1), ("à", 1), ("19 heures !", 3)]),
]

# Plans : (image, début) — chacun calé sur ce que dit la voix
PLANS = [
    (68, 0.0),     # accroche + prix (trois-quarts avant)
    (55, 4.40),    # 2011-2012
    (57, 6.08),    # essence, 2.0 turbo (badge T-GDI)
    (69, 7.73),    # 260 chevaux (trois-quarts arrière, double échappement)
    (45, 9.50),    # boîte automatique
    (64, 10.51),   # jantes 18 pouces
    (58, 11.74),   # toit ouvrant panoramique
    (49, 13.85),   # intérieur cuir, écran tactile
    (53, 15.75),   # caméra de recul
    (47, 16.76),   # climatisation automatique
    (46, 18.27),   # démarrage sans clé (clé intelligente)
    (59, 19.52),   # châssis vérifié
    (61, 21.99),   # achat, transport, douane : tout est compris
    (66, 24.68),   # paiement 50 / 50
    (70, 28.84),   # passez votre commande chez KBA
]
REPERES = dict(prix=1.71, toutes=3.11, fin_accroche=4.40, recap=21.99, compris=23.83,
               paiement=24.68, fin=28.84, abonnez=31.42, bio="lien")
