"""Génère LISTE_COMPLETE.md à partir du CSV consolidé (classement par catégorie, site / sans site, score)."""
import csv
from pathlib import Path
BASE = Path(__file__).resolve().parents[2] / "docs" / "prospection-guinee"
rows = list(csv.DictReader(open(BASE / "entreprises_guinee_consolide.csv", encoding="utf-8-sig"), delimiter=";"))
def c(v, n=None):
    v = (v or "").replace("|", "/").replace("\n", " ")
    return v if not n or len(v) <= n else v[:n-1] + "…"
def lien(u):
    u = u.split(" ")[0].strip()
    if not u or u.lower().startswith("non"): return "—"
    return f"[{u}]({u if u.startswith('http') else 'https://' + u})"
out = ["# Liste complète des entreprises recensées (classées par score)\n",
       "Généré par `scripts/prospection/generer_listes.py` depuis `entreprises_guinee_consolide.csv`.",
       "Score sur 100 = besoin 25 % + rentabilité 25 % + chance d'acceptation 20 % + joignabilité 15 % + urgence 15 %. Méthode détaillée dans `RAPPORT_GLOBAL.md`.\n",
       "⚠️ Coordonnées issues de sources publiques, parfois anciennes : à confirmer avant tout appel. Les sites n'ont pas pu être ouverts depuis l'environnement (réseau bloqué) : leur qualité est à auditer à la main.\n"]
for cat, titre in [("Petite", "PETITES ENTREPRISES"), ("Moyenne", "MOYENNES ENTREPRISES"), ("Grande", "GRANDES ENTREPRISES")]:
    sub = sorted([r for r in rows if r["categorie"] == cat], key=lambda r: -int(r["score_global"]))
    sans = [r for r in sub if r["statut_site"] != "ACTIF"]
    avec = [r for r in sub if r["statut_site"] == "ACTIF"]
    out.append(f"\n## {titre} ({len(sub)} : {len(sans)} sans site, {len(avec)} avec site)\n")
    out.append(f"### {titre} — SANS site web ({len(sans)})\n")
    out.append("| # | Score | Entreprise | Secteur | Activité | Adresse | Téléphone | Email | Réseaux / statut | Source |")
    out.append("|---|---|---|---|---|---|---|---|---|---|")
    for i, r in enumerate(sans, 1):
        src = r["source"].split(" ")[0]
        out.append(f"| {i} | **{r['score_global']}** | **{c(r['nom'])}** | {c(r['secteur'])} | {c(r['activite_description'],140)} | {c(r['ville_adresse'],70)} | {c(r['telephone'])} | {c(r['email'])} | {c(r['statut_site'])} — {c(r['reseaux_sociaux'],80)} | [source]({src}) |")
    out.append(f"\n### {titre} — AVEC site web ({len(avec)})\n")
    out.append("| # | Score | Entreprise | Secteur | Lien du site | Observations | Téléphone | Email |")
    out.append("|---|---|---|---|---|---|---|---|")
    for i, r in enumerate(avec, 1):
        out.append(f"| {i} | **{r['score_global']}** | **{c(r['nom'])}** | {c(r['secteur'])} | {lien(r['site_web'])} | {c(r['qualite_site_notes'],160)} | {c(r['telephone'])} | {c(r['email'])} |")
(BASE / "LISTE_COMPLETE.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print("ok", len(rows))
