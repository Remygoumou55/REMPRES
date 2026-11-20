"""Fusionne les CSV bruts de prospection, dédoublonne et calcule un score de priorité."""
import csv, re, sys
from pathlib import Path

BASE = Path(__file__).resolve().parents[2] / "docs" / "prospection-guinee"
CATS = [("petites", "Petite"), ("moyennes", "Moyenne"), ("grandes", "Grande")]

# Doublons entre catégories : (catégorie à retirer, nom exact)
RETIRER = {("petites", "Guinée Voyages"), ("moyennes", "Riviera Taouyah Hotel"),
           ("moyennes", "Clinique Ambroise Paré"), ("grandes", "Clinique Pasteur Conakry"), ("moyennes", "Palm Camayenne"), ("moyennes", "Aguimmo Promotion SA")}

# Prospects signalés prioritaires par les agents (urgence/opportunité identifiée)
PRIORITAIRES = ["auto école prestige", "africa digitale", "aguimmo", "afric-immo", "gag ",
    "couture mode africaine", "hello eats", "coco restaurant", "rianne", "osd",
    "clinique pasteur", "ciba", "hôtel kaloum", "mk habitat", "b2d", "seta motors", "debo",
    "krypta", "soguipal", "icarus", "areeba", "sogeag", "guinée télécom", "sgbg",
    "ciments de guinée", "port autonome", "cnss", "guiter", "lonagui", "ciao", "sonoco",
    "waraba", "diaouné", "yètè mali", "finadev", "mondial express", "mahatma"]
SECTEURS_PAYANTS = ["santé", "clinique", "dentaire", "pharma", "immobili", "hôtel", "hotel",
    "éducation", "universit", "école", "formation", "auto", "concession", "banque", "finance",
    "assurance", "cabinet", "avocat", "audit", "btp", "construction", "logistique", "transit",
    "mines", "microfinance", "voyage", "agroalimentaire", "industrie"]
URGENCE_MOTS = ["ouverture", "nouveau", "nouvelle", "nationalis", "rachat", "relance", "rebrand",
    "gmail", "yahoo", "2025", "2026", "changement", "transition", "lancement"]
FILIALES = ["ecobank", "uba", "afriland", "sunu", "nsia", "totalenergies", "radisson", "msc",
    "agl", "anglogold", "simfer", "orange", "onomo", "noom", "sogea", "access bank", "fbn",
    "coris", "orabank", "vivo", "helen keller", "cimaf"]

def has(txt, mots): t = txt.lower(); return any(m in t for m in mots)
def trouve(v): return bool(v) and v.strip().lower() not in ("non trouvé", "non trouve", "")

def scorer(x, cat):
    txt = " ".join([x["nom"], x["secteur"], x["activite_description"], x["qualite_site_notes"]])
    st = x["statut_site"]
    besoin = 5 if st in ("AUCUN", "FACEBOOK_SEULEMENT", "CASSE_OU_INJOIGNABLE") else \
        (3 if has(x["qualite_site_notes"], ["http:", "ancien", "daté", "pdf", "wordpress", "copyright", "pas à jour", "peu", "minimal"]) else 2)
    rent = {"petites": 2, "moyennes": 3, "grandes": 5}[cat] + (1 if has(x["secteur"] + " " + x["activite_description"], SECTEURS_PAYANTS) else 0)
    rent = min(rent, 5)
    public = x["public_prive"].lower().startswith(("public", "mixte"))
    filiale = has(x["nom"], FILIALES)
    accept = {"petites": 4, "moyennes": 4, "grandes": 3}[cat] - (1 if public else 0) - (2 if filiale and cat == "grandes" else 0)
    accept = max(accept, 1)
    tel, mail = trouve(x["telephone"]), trouve(x["email"])
    joign = 5 if tel and mail else 4 if tel else 3 if mail else (2 if trouve(x["reseaux_sociaux"]) else 1)
    prio = has(x["nom"], PRIORITAIRES)
    urg = 5 if prio else (4 if has(txt, URGENCE_MOTS) else 3)
    total = round((besoin*.25 + rent*.25 + accept*.20 + joign*.15 + urg*.15) / 5 * 100)
    return dict(score_besoin=besoin, score_rentabilite=rent, score_acceptation=accept,
                score_joignabilite=joign, score_urgence=urg, score_global=total,
                signale_prioritaire="oui" if prio else "non")

def main():
    rows = []
    for cat, label in CATS:
        for x in csv.DictReader(open(BASE / "brut" / f"{cat}.csv", encoding="utf-8"), delimiter=";"):
            if (cat, x["nom"]) in RETIRER: continue
            x = {k: (v or "").strip() for k, v in x.items()}
            x.update(scorer(x, cat)); x["categorie"] = label
            rows.append(x)
    rows.sort(key=lambda r: (["Petite", "Moyenne", "Grande"].index(r["categorie"]), -r["score_global"]))
    cols = ["categorie", "score_global"] + [c for c in rows[0] if c not in ("categorie", "score_global")]
    with open(BASE / "entreprises_guinee_consolide.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols, delimiter=";"); w.writeheader(); w.writerows(rows)
    print(len(rows), "entreprises écrites")
    return rows

if __name__ == "__main__":
    main()
