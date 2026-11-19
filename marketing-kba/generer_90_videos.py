"""Génère le plan des 90 vidéos KBA (Facebook + TikTok) au format Excel.
Les champs entre crochets ([MODÈLE], [PRIX TTC]...) seront remplis à partir du catalogue."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HEURE = "19h00 (heure de Conakry)"

FORMATS = {
    "A": ("Le prix du jour", [
        "[MODÈLE] [ANNÉE], clés en main à Conakry : [PRIX TTC]. Tout compris.",
        "[PRIX TTC]. C'est le prix final de cette [MODÈLE], douane comprise.",
        "Ce soir : la [MODÈLE] [ANNÉE] à [PRIX TTC], livrée à Conakry.",
    ], "[ANNÉE], [KM] kilomètres, [OPTION 1], [OPTION 2]. Sélectionnée en Corée du Sud.",
       "Tour rapide 360° de la voiture, puis gros plans sur les options"),
    "B": ("Visite en 30 secondes", [
        "Voici ce que vous avez pour [PRIX TTC], clés en main.",
        "Montez avec moi dans cette [MODÈLE].",
        "30 secondes pour faire le tour de la [MODÈLE] [ANNÉE].",
    ], "Extérieur impeccable, [KM] km. À l'intérieur : [OPTION 1], [OPTION 2], [OPTION 3].",
       "Ouverture de la portière, plan intérieur, tableau de bord, coffre"),
    "C": ("Les 3 atouts", [
        "3 raisons de choisir la [MODÈLE].",
        "Pourquoi tout le monde veut la [MODÈLE] ? 3 raisons.",
        "La [MODÈLE] [ANNÉE] en 3 points.",
    ], "Un : [OPTION 1]. Deux : [OPTION 2]. Trois : [OPTION 3]. Et seulement [KM] km.",
       "Un plan serré par atout, avec le chiffre 1, 2, 3 à l'écran"),
    "D": ("Quelle voiture pour votre budget ?", [
        "Avec [PRIX TTC], voici la voiture que vous récupérez à Conakry.",
        "Votre budget, c'est [PRIX TTC] ? Regardez ça.",
        "Pour [PRIX TTC] tout compris : une [MODÈLE] [ANNÉE].",
    ], "[MODÈLE] [ANNÉE], [KM] km, [OPTION 1] et [OPTION 2].",
       "Le prix en très gros à l'écran, puis révélation de la voiture"),
    "E": ("Profil d'acheteur", [
        "[PROFIL] ? Cette [MODÈLE] est faite pour vous.",
        "Vous cherchez une voiture pour [PROFIL] ? Regardez celle-ci.",
        "[PROFIL] : la [MODÈLE] [ANNÉE] coche toutes les cases.",
    ], "[PLACES] places, [OPTION 1], [OPTION 2]. [ANNÉE], [KM] km.",
       "Plans qui montrent l'usage : sièges arrière, coffre chargé, conduite"),
    "F": ("Payer en deux fois", [
        "Une [MODÈLE] à [PRIX TTC], et vous ne payez que la moitié pour commencer.",
        "Comment avoir cette [MODÈLE] en payant en deux fois.",
        "50 % aujourd'hui, 50 % plus tard : la [MODÈLE] [ANNÉE].",
    ], "[MODÈLE] [ANNÉE], [KM] km, [OPTION 1].",
       "Voiture + schéma animé 50 % / 50 % (commande / bateau)"),
    "G": ("Le voyage d'une commande", [
        "Cette [MODÈLE] est en mer. Direction Conakry.",
        "La [MODÈLE] d'un client vient de quitter la Corée.",
        "Jour [N] de voyage pour cette [MODÈLE].",
    ], "Commandée depuis Conakry, achetée en Corée, embarquée au nom du client.",
       "VRAIE commande : photos de chargement, carte du bateau (MarineTraffic)"),
    "H": ("Remise des clés", [
        "Il a commandé il y a [DÉLAI]. Aujourd'hui, il récupère ses clés.",
        "Remise des clés à Conakry : la [MODÈLE] est arrivée.",
        "Regardez sa réaction en découvrant sa [MODÈLE].",
    ], "[MODÈLE] [ANNÉE], commandée chez KBA, payée en deux fois, livrée avec tous ses papiers.",
       "VRAI client (avec son accord) : remise des clés, sourire, poignée de main"),
}

PRIX = [
    "Prix final : [PRIX TTC]. Achat, transport, douane : tout est compris, clés en main.",
    "Tout compris, clés en main à Conakry : [PRIX TTC]. Douane incluse.",
    "[PRIX TTC], tout compris. Vous n'avez plus rien à payer au port.",
]

ETAPES = {
    1: ("Le choix", "ÉTAPE 1 · Fiche + devis tout compris", "Écran WhatsApp : fiche KBA-00XX + devis (données floutées)", [
        "Elle vous plaît ? Écrivez-nous sur WhatsApp : vous recevez sa fiche complète et votre devis.",
        "Tout commence par un message WhatsApp. On vous envoie la fiche du véhicule et le prix final.",
        "Un message suffit : fiche détaillée, photos et devis tout compris, directement sur votre téléphone."]),
    2: ("La vérification", "ÉTAPE 2 · Vérifiée en vidéo, en Corée", "Désiré en Corée : numéro de châssis visible, moteur qui démarre", [
        "Avant tout paiement, Désiré, notre représentant en Corée, vérifie la voiture et vous envoie une vidéo.",
        "Depuis la Corée, Désiré filme votre voiture : numéro de châssis visible, moteur qui démarre.",
        "On ne vous demande rien tant que la voiture n'est pas vérifiée sur place, en vidéo."]),
    3: ("Le contrat", "ÉTAPE 3 · Contrat en français à votre nom", "Contrat et facture pro-forma (nom du client flouté)", [
        "Vous recevez un contrat en français, à votre nom : prix, délais et remboursement, tout est écrit.",
        "Bon de commande et facture pro-forma à votre nom. Vous signez quand tout est clair.",
        "Le prix du contrat, c'est le prix final. Noir sur blanc, en français."]),
    4: ("L'acompte 50 %", "ÉTAPE 4 · 50 % = voiture réservée", "Voiture avec la pancarte « Réservée + nom du client » (nom flouté)", [
        "Vous payez 50 % sur le compte de l'entreprise. La voiture est aussitôt réservée à votre nom.",
        "Dès votre acompte : le reçu, et la photo de la voiture marquée « Réservée » à votre nom.",
        "50 % par virement sur le compte KBA, et la voiture n'est plus à vendre : elle est à vous."]),
    5: ("La préparation", "ÉTAPE 5 · Papiers d'export prêts", "Retrait de la plaque coréenne, certificat d'export (même numéro de châssis)", [
        "En Corée, on retire la plaque, on prépare les papiers d'export et on réserve le bateau.",
        "Vous recevez la copie du certificat d'export, avec le même numéro de châssis que dans la vidéo.",
        "Pendant que vous attendez, tout se prépare : papiers d'export et place sur le bateau."]),
    6: ("L'embarquement", "ÉTAPE 6 · Sur le bateau, à votre nom", "Chargement sur le bateau / dans le conteneur + connaissement", [
        "Votre voiture monte sur le bateau. Le document de transport est à votre nom.",
        "Photos du chargement et document de transport à votre nom : votre voiture est en route.",
        "Le jour de l'embarquement, vous recevez les photos. C'est votre voiture, sur le bateau."]),
    7: ("Le solde 50 %", "ÉTAPE 7 · Le reste, quand elle navigue", "Capture du site de la compagnie maritime (vérification du document)", [
        "Vous vérifiez le document de transport sur le site de la compagnie, puis vous payez les 50 % restants.",
        "La voiture est en mer ? C'est seulement là que vous payez la deuxième moitié.",
        "Deuxième paiement, deuxième reçu. Et vous recevez les documents pour récupérer la voiture."]),
    8: ("Le voyage", "ÉTAPE 8 · Suivi du bateau en direct", "Carte MarineTraffic avec le bateau qui avance", [
        "Pendant le voyage, vous suivez votre bateau en direct sur votre téléphone.",
        "Un message WhatsApp à chaque étape, et un lien pour voir où est votre bateau.",
        "Où est votre voiture ? Ouvrez le lien : le bateau s'affiche en direct."]),
    9: ("L'arrivée", "ÉTAPE 9 · Douane déjà comprise", "Port de Conakry, la voiture qui sort du bateau", [
        "Arrivée au port de Conakry. La douane est déjà comprise dans votre prix.",
        "Au port, vous inspectez votre voiture. Les frais de douane ? Déjà inclus.",
        "Le bateau arrive à Conakry. Pas de frais surprise : tout est déjà réglé."]),
    10: ("Les clés", "ÉTAPE 10 · Clés + papiers en main", "Remise des clés à Conakry, papiers d'immatriculation", [
        "Et voilà : les clés, plus tous les papiers pour immatriculer votre voiture en Guinée.",
        "Remise des clés à Conakry. Vous repartez au volant de votre voiture.",
        "Fin du voyage : vos clés, vos papiers, votre voiture."]),
}

PAIEMENT = [
    "50 % à la commande, 50 % quand la voiture est sur le bateau.",
    "Payez en deux fois : 50 % pour commander, 50 % quand elle est en mer.",
]
CTA = [
    "Passez votre commande sur WhatsApp. Une nouvelle voiture chaque soir à 19 h : abonnez-vous.",
    "Passez votre commande maintenant sur WhatsApp. Et abonnez-vous pour la voiture de demain.",
    "Écrivez-nous sur WhatsApp et passez votre commande. Rendez-vous demain, 19 h.",
]

# Rotation des formats par semaine, selon le mois
ROTATION = {
    1: ["A", "B", "C", "D", "E", "A", "B"],   # Mois 1 : faire connaître
    2: ["A", "B", "F", "C", "E", "G", "D"],   # Mois 2 : convaincre
    3: ["A", "G", "B", "F", "H", "D", "H"],   # Mois 3 : faire acheter
}
REPLI = {"G": "A", "H": "B"}  # format de secours si pas encore de vraie commande

compteur = {k: 0 for k in FORMATS}
lignes = []
for jour in range(1, 91):
    mois = (jour - 1) // 30 + 1
    fmt = ROTATION[mois][(jour - 1) % 7]
    etape = (jour - 1) % 10 + 1
    if fmt == "G":
        etape = 6 if compteur["G"] % 2 == 0 else 8
    if fmt == "H":
        etape = 10
    nom_fmt, accroches, corps, plans_produit = FORMATS[fmt]
    i = compteur[fmt]
    compteur[fmt] += 1
    accroche = accroches[i % 3]
    nom_et, ecran_et, plans_et, voix_et = ETAPES[etape]
    voix_etape = voix_et[(jour - 1) // 10 % 3]
    prix = PRIX[jour % 3]
    paiement = PAIEMENT[jour % 2]
    cta = CTA[jour % 3]
    if fmt == "F":  # la vidéo dédiée au paiement développe le 50/50
        paiement = ("Vous payez 50 % à la commande : la voiture est réservée à votre nom. "
                    "Les 50 % restants seulement quand elle est sur le bateau.")
    intro = "Bienvenue chez KBA : chaque soir à 19 h, une voiture de Corée, prix tout compris. " if jour <= 3 else ""
    voix = " ".join([intro + accroche, corps, prix, voix_etape, paiement, cta])
    duree = round(len(voix.split()) / 2.6)
    ecran = (f"0–3 s : « [PRIX TTC] TOUT COMPRIS » en très gros + [MODÈLE] [ANNÉE]\n"
             f"Milieu : {ecran_et}\n"
             f"Puis : « 50 % commande · 50 % bateau »\n"
             f"Fin : « PASSEZ VOTRE COMMANDE » + WhatsApp [NUMÉRO]")
    plans = f"{plans_produit}\n+ {plans_et}\n+ Écran de fin KBA (identique tous les jours)"
    legende = ("[MODÈLE] [ANNÉE] · [PRIX TTC] tout compris, clés en main à Conakry 🇬🇳\n"
               "Paiement en 2 fois : 50 % à la commande, 50 % quand elle est sur le bateau.\n"
               "📲 Commandez sur WhatsApp : [NUMÉRO]\n"
               "#Guinée #Conakry #224 #VoitureGuinée #KBA #CléEnMain #VoitureCorée #[MARQUE]")
    note = ""
    if fmt in REPLI:
        note = (f"Nécessite une VRAIE commande/livraison. Si pas encore disponible : "
                f"faire le format {REPLI[fmt]} ({FORMATS[REPLI[fmt]][0]}).")
    if "[PROFIL]" in accroche:
        note = "Choisir le profil selon la voiture : grande famille / business / premier véhicule / prestige."
    if "[N]" in accroche:
        note = (note + " [N] = nombre de jours de mer.").strip()
    lignes.append([jour, mois, HEURE, "", f"{fmt} · {nom_fmt}", f"{etape}. {nom_et}",
                   accroche, voix, f"≈ {duree} s", ecran, plans, legende,
                   "📲 Commandez sur WhatsApp : [NUMÉRO] · Site : [LIEN DU SITE]", note])

wb = Workbook()
ARIAL = "Arial"
bleu = PatternFill("solid", start_color="0B1F3A")
jaune = PatternFill("solid", start_color="FFF2CC")
gris = PatternFill("solid", start_color="F2F2F2")
fin = Side(style="thin", color="BFBFBF")
bord = Border(left=fin, right=fin, top=fin, bottom=fin)
wrap = Alignment(wrap_text=True, vertical="top")

def entete(ws, row, valeurs):
    for c, v in enumerate(valeurs, 1):
        cell = ws.cell(row=row, column=c, value=v)
        cell.font = Font(name=ARIAL, bold=True, color="FFFFFF")
        cell.fill = bleu
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = bord

# --- Feuille 1 : mode d'emploi
ws = wb.active
ws.title = "Mode d'emploi"
textes = [
    ("PLAN 90 VIDÉOS KBA · Facebook + TikTok", True),
    ("", False),
    ("Règles", True),
    ("• La même vidéo sort sur Facebook (Reels) et TikTok, tous les jours à 19h00, heure de Conakry.", False),
    ("• Format vertical 9:16, 45 secondes maximum, sous-titres incrustés.", False),
    ("• Accroche dans les 3 premières secondes : le modèle + le PRIX TOUT COMPRIS en très gros.", False),
    ("• Chaque vidéo : accroche → voiture → prix tout compris → 1 des 10 étapes → paiement 50/50 → CTA « Passez votre commande ».", False),
    ("• Le prix tout compris (achat + transport + douane, clés en main) est donné par l'entreprise pour chaque voiture.", False),
    ("• Écran de fin identique dans les 90 vidéos (logo KBA + WhatsApp + « Passez votre commande »).", False),
    ("", False),
    ("Champs à remplir (entre crochets dans les scripts)", True),
    ("[MODÈLE] [ANNÉE] [KM] [PLACES] [OPTION 1/2/3] [PRIX TTC] [MARQUE] : depuis l'onglet « Catalogue », colonne « Code voiture » de l'onglet « 90 vidéos ».", False),
    ("[NUMÉRO] : numéro WhatsApp de KBA · [LIEN DU SITE] : adresse du site.", False),
    ("[PROFIL] [DÉLAI] [N] : voir la colonne « Note ».", False),
    ("Cellules jaunes = à remplir.", False),
    ("", False),
    ("Les 3 mois", True),
    ("Mois 1 (J1–J30) : faire connaître le catalogue, installer le rendez-vous de 19 h.", False),
    ("Mois 2 (J31–J60) : convaincre : paiement en 2 fois, voyage des premières commandes.", False),
    ("Mois 3 (J61–J90) : faire acheter : remises de clés, clients satisfaits, prix du jour.", False),
    ("", False),
    ("Partir de 0 abonné", True),
    ("• Programmer à l'avance : Meta Business Suite (Facebook) et TikTok Studio (ordinateur).", False),
    ("• Exporter la vidéo SANS le logo TikTok avant de la publier sur Facebook.", False),
    ("• Répondre à tous les commentaires dans les 30 premières minutes ; sur TikTok, répondre à « Prix ? » par une vidéo.", False),
    ("• Épingler le commentaire WhatsApp sous chaque vidéo. Lieu : Conakry.", False),
    ("• Partager chaque vidéo sur le statut WhatsApp et dans les groupes Facebook guinéens (auto, business, diaspora).", False),
    ("• Sponsoriser les 2 ou 3 meilleures vidéos du mois : 5 à 10 $/jour, Conakry + diaspora guinéenne (France, USA, Belgique).", False),
    ("• Même visage ou même voix dans toutes les vidéos (idéalement Désiré, depuis la Corée).", False),
    ("• Préparer les vidéos par lots : tourner 7 à 14 vidéos d'un coup, monter avec le même modèle CapCut.", False),
]
for r, (t, gras) in enumerate(textes, 1):
    c = ws.cell(row=r, column=1, value=t)
    c.font = Font(name=ARIAL, bold=gras, size=14 if r == 1 else 11)
    c.alignment = Alignment(wrap_text=True, vertical="top")
ws.column_dimensions["A"].width = 120

# --- Feuille 2 : catalogue
wc = wb.create_sheet("Catalogue")
cols = ["Code voiture", "Marque", "Modèle", "Année", "Km", "Places", "Option 1", "Option 2",
        "Option 3", "Prix TTC clés en main ($)", "Prix TTC (GNF)", "Lien fiche site", "Disponible ?"]
entete(wc, 1, cols)
exemple = ["KBA-0000 (EXEMPLE)", "Hyundai", "Santa Fe", "2019", 62000, 7, "Caméra de recul",
           "Sièges cuir", "Écran tactile", 16000, "", "", "Oui"]
for c, v in enumerate(exemple, 1):
    cell = wc.cell(row=2, column=c, value=v)
    cell.font = Font(name=ARIAL, italic=True, color="808080")
    cell.border = bord
for r in range(3, 33):
    for c in range(1, len(cols) + 1):
        cell = wc.cell(row=r, column=c)
        cell.fill = jaune
        cell.border = bord
        cell.font = Font(name=ARIAL, color="0000FF")
wc.cell(row=34, column=1, value="Ligne 2 = exemple de format (chiffres fictifs). Remplir les lignes jaunes. "
        "Prix TTC : fourni par l'entreprise.").font = Font(name=ARIAL, italic=True)
for c, w in enumerate([20, 12, 18, 8, 10, 8, 18, 18, 18, 16, 16, 24, 12], 1):
    wc.column_dimensions[get_column_letter(c)].width = w
wc.freeze_panes = "A2"

# --- Feuille 3 : 90 vidéos
wv = wb.create_sheet("90 vidéos")
cols = ["Jour", "Mois", "Heure", "Code voiture (à remplir)", "Format", "Étape mise en avant",
        "Accroche (0–3 s)", "Texte voix off complet", "Durée estimée", "Texte à l'écran",
        "Plans à filmer", "Légende de la publication", "Commentaire épinglé", "Note"]
entete(wv, 1, cols)
for r, ligne in enumerate(lignes, 2):
    for c, v in enumerate(ligne, 1):
        cell = wv.cell(row=r, column=c, value=v)
        cell.font = Font(name=ARIAL, size=10, bold=(c == 7))
        cell.alignment = wrap
        cell.border = bord
        if c == 4:
            cell.fill = jaune
        elif r % 2 == 0:
            cell.fill = gris
for c, w in enumerate([6, 6, 12, 14, 18, 16, 34, 60, 9, 40, 40, 44, 30, 30], 1):
    wv.column_dimensions[get_column_letter(c)].width = w
wv.freeze_panes = "H2"
wv.auto_filter.ref = f"A1:N{len(lignes) + 1}"

# --- Feuille 4 : blocs étapes (bibliothèque)
wb_ = wb.create_sheet("Blocs étapes")
entete(wb_, 1, ["Étape", "Texte à l'écran", "Plans / preuve à montrer", "Version 1", "Version 2", "Version 3"])
for r, (n, (nom, ecr, pl, vs)) in enumerate(ETAPES.items(), 2):
    for c, v in enumerate([f"{n}. {nom}", ecr, pl, *vs], 1):
        cell = wb_.cell(row=r, column=c, value=v)
        cell.font = Font(name=ARIAL, size=10)
        cell.alignment = wrap
        cell.border = bord
for c, w in enumerate([18, 30, 40, 45, 45, 45], 1):
    wb_.column_dimensions[get_column_letter(c)].width = w

wb.save("marketing-kba/KBA_plan_90_videos.xlsx")
print("max durée:", max(int(l[8].split()[1]) for l in lignes), "s")
from collections import Counter
print(Counter(l[4] for l in lignes))
