# Configuration vidéo : Hyundai Kona 1.6 Turbo
VOIX = "audio/voix_kona.mp3"
OUT = "KBA_Kona_2017_13500_voix.mp4"
MODELE = "HYUNDAI KONA 1.6 TURBO"
INFO = None
# --- Texte exact de la voix off, calé sur les pauses mesurées dans le MP3 (silencedetect -30 dB / 70 ms)
# (début, fin, [(mot affiché, syllabes)]) ; dans chaque bloc, les mots sont répartis selon leurs syllabes
BLOCS = [
    (0.00, 1.26, [("Hyundai", 2), ("Kona", 2), ("Turbo.", 2)]),
    (1.64, 2.82, [("13 500", 4), ("dollars,", 2)]),
    (2.96, 3.75, [("toutes", 1), ("taxes", 1), ("comprises !", 2)]),
    (4.06, 5.84, [("2017-2018,", 10)]),
    (6.02, 6.56, [("essence,", 2)]),
    (6.69, 7.09, [("moins", 1), ("de", 1)]),
    (7.17, 8.41, [("83 000", 5), ("kilomètres.", 4)]),
    (8.78, 9.22, [("Turbo,", 2)]),
    (9.33, 10.23, [("boîte", 1), ("automatique,", 4)]),
    (10.31, 11.46, [("jantes", 1), ("18", 2), ("pouces.", 1)]),
    (11.77, 12.65, [("Intérieur", 4), ("cuir,", 1)]),
    (12.75, 13.44, [("GPS,", 3)]),
    (13.58, 14.45, [("caméra", 3), ("de", 1), ("recul,", 2)]),
    (14.56, 15.04, [("affichage", 3)]),
    (15.11, 17.73, [("tête", 1), ("haute,", 1), ("sièges", 2), ("ventilés", 3), ("pour", 1), ("la", 1),
                    ("chaleur", 2), ("de", 1), ("Conakry…", 3)]),
    (18.14, 19.29, [("et", 1), ("deux", 1), ("clés", 1), ("intelligentes.", 4)]),
    (19.76, 21.10, [("Châssis", 2), ("vérifié", 3), ("en", 1), ("vidéo", 2)]),
    (21.18, 21.91, [("avant", 2), ("tout", 1), ("paiement.", 2)]),
    (22.30, 22.71, [("Achat,", 2)]),
    (22.81, 23.84, [("transport,", 2), ("douane :", 2)]),
    (24.08, 24.68, [("tout", 1), ("est", 1), ("compris.", 2)]),
    (24.96, 28.98, [("50 %", 4), ("à", 1), ("la", 1), ("commande,", 3), ("le", 1), ("reste", 2), ("dès", 1),
                    ("que", 1), ("vous", 1), ("allez", 2), ("recevoir", 3), ("votre", 2), ("B/L.", 2)]),
    (29.34, 30.82, [("Passez", 2), ("votre", 2), ("commande", 2), ("chez", 1), ("KBA.", 3)]),
    (31.04, 31.63, [("Lien", 1), ("en", 1), ("bio.", 2)]),
    (31.99, 32.51, [("Abonnez-vous :", 4)]),
    (32.79, 34.79, [("une", 1), ("voiture", 2), ("chaque", 1), ("soir", 1), ("à", 1), ("19 heures !", 3)]),
]
DUREE = 37.0
PRIX = "13 500 $"

# --- Plans plus longs (≈ 3 s), chacun calé sur la phrase qui en parle
PLANS = [
    (7, 0.0),      # accroche + prix
    (3, 4.06),     # 2017-2018, essence
    (24, 6.69),    # moins de 83 000 km (compteur)
    (9, 8.78),     # turbo, boîte auto, jantes 18 pouces (profil, roues visibles)
    (30, 11.77),   # intérieur cuir, GPS
    (25, 13.58),   # caméra de recul
    (37, 15.11),   # affichage tête haute, sièges ventilés
    (21, 17.73),   # deux clés intelligentes
    (14, 19.76),   # châssis vérifié
    (35, 22.30),   # achat, transport, douane : tout est compris
    (2, 24.96),    # paiement 50 / 50
    (4, 29.34),    # passez votre commande chez KBA
]
REPERES = dict(prix=1.64, toutes=2.96, fin_accroche=4.06, recap=22.30, compris=24.08,
               paiement=24.96, fin=29.34, abonnez=31.99, bio="Lien")
