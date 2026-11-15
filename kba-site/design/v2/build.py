"""Assemble index.html (variante 2) à partir de index.src.html : blocs répétés, icônes, logo en ligne."""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "index.src.html").read_text()

WA = '<svg class="wa-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.2c.2 1.9 1.9 3.9 4 4.7l1.2-1.1 1.8.8-.4 1.6c-3.6.2-7-3.3-7-6.9l1.6-.4.8 1.8z" fill="currentColor" stroke="none"/></svg>'
ARROW = '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'
DIAMOND = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0L10 5L5 10L0 5Z" fill="currentColor"/></svg>'

logo = (ROOT / "assets/kba-symbole.svg").read_text()
logo = re.sub(r' width="\d+" height="\d+"', "", logo, count=1).replace("<svg ", '<svg id="loaderSvg" aria-hidden="true" ', 1)

def mq(items, outline_every=2):
    one = "".join(f'<span class="mq-item{" o" if i % outline_every else ""}">{html.escape(t)}{DIAMOND}</span>' for i, t in enumerate(items))
    return one * 3

MQ1 = mq(["Voitures vérifiées", "Prix total sans surprise", "Vidéo à votre nom", "Paiement à l'entreprise", "Suivi du bateau"])
MQ2 = mq(["Hyundai", "Kia", "Genesis", "Toyota", "SUV", "Berlines", "Utilitaires", "Minibus"])

steps = [
    ("Le choix", "Vous choisissez une voiture. Vous recevez sa fiche complète et un devis jusqu'au port.", "Fiche + devis détaillé", False),
    ("La vérification", "Nous reconfirmons sa disponibilité et la filmons avec une feuille à votre nom.", "Vidéo à votre nom", False),
    ("Le contrat", "Bon de commande et facture du vendeur à votre nom : prix, délais, remboursement.", "Contrat en français", False),
    ("L'acompte 50 %", "Vous payez par virement l'entreprise coréenne qui vend. Jamais un compte personnel.", "Reçu du vendeur", True),
    ("La préparation", "Le vendeur radie l'immatriculation coréenne, prépare l'export et réserve le bateau.", "Certificat de radiation", False),
    ("L'embarquement", "La voiture monte à bord. Le connaissement (B/L) porte votre nom.", "B/L + photos du chargement", False),
    ("Le solde 50 %", "Vous vérifiez vous-même le B/L chez la compagnie maritime, puis vous payez le reste.", "B/L original ou télex", True),
    ("Le voyage", "Vous suivez le navire en direct. Nous vous écrivons à chaque étape.", "Lien de suivi du navire", False),
    ("L'arrivée", "Vous payez la douane au transitaire et inspectez la voiture au port.", "Reçus officiels", False),
    ("Les clés", "Remise des clés à Conakry, avec tous les papiers pour l'immatriculer.", "Dossier complet à votre nom", False),
]
STEPS = "".join(
    f'<article class="step{" pay" if pay else ""}">{"<span class=\"pay-tag label\">Paiement</span>" if pay else ""}'
    f'<div class="step-n">{i + 1:02d}</div><h3 class="h3">{html.escape(t)}</h3><p>{html.escape(d)}</p>'
    f'<span class="proof label">{CHECK}{html.escape(p)}</span></article>'
    for i, (t, d, p, pay) in enumerate(steps)
)

checks6 = [
    ("L'entreprise qui vend", "Son numéro d'entreprise coréen à 10 chiffres se vérifie gratuitement sur le site officiel des impôts coréens. Il doit être « actif »."),
    ("Le même numéro de châssis", "Identique sur la carte grise, l'inspection, la vidéo, le certificat d'export et le B/L."),
    ("Une vidéo à votre nom", "Votre nom, la date, le numéro de châssis, le moteur qui démarre. Avant tout paiement."),
    ("Le B/L, vérifié par vous", "Le solde se paie après votre vérification sur le site officiel de la compagnie maritime."),
    ("Un compte d'entreprise", "Vous payez l'entreprise inscrite sur la facture. Jamais Western Union, jamais une personne."),
    ("Rencontrez-nous", "Au bureau de Conakry, ou en appel vidéo depuis le parc en Corée. Une vraie entreprise montre son visage."),
]
CHECKS6 = "".join(f'<div class="c6 rv"><div class="n">{i + 1:02d}</div><h3 class="h3">{html.escape(t)}</h3><p>{html.escape(d)}</p></div>' for i, (t, d) in enumerate(checks6))

countries = [
    ("GN", "Guinée", "13 ans", "Port de Conakry", "45 – 70 jours"),
    ("SN", "Sénégal", "10 ans", "Port de Dakar", "45 – 70 jours"),
    ("ML", "Mali", "À confirmer", "Via Conakry ou Dakar", "55 – 85 jours"),
    ("CI", "Côte d'Ivoire", "5 ans", "Port d'Abidjan", "50 – 75 jours"),
    ("TG · BJ", "Togo · Bénin", "Libre · 10 ans", "Lomé · Cotonou", "45 – 65 jours"),
    ("EU", "Diaspora", "Selon le pays", "Remise à votre famille", "Suivi WhatsApp"),
]
COUNTRIES = "".join(
    f'<div class="ctry rv"><div class="ctry-name"><small>{c}</small>{html.escape(n)}</div>'
    f'<div class="ctry-v"><span class="label">Âge max.</span>{html.escape(a)}</div>'
    f'<div class="ctry-v"><span class="label">Arrivée</span>{html.escape(p)}</div>'
    f'<div class="ctry-v"><span class="label">Délai</span>{html.escape(d)}</div></div>'
    for c, n, a, p, d in countries
)

faq = [
    ("Comment savoir que vous n'êtes pas une arnaque ?", "Ne nous croyez pas sur parole : vérifiez. Vous recevez le numéro d'entreprise du vendeur coréen, une vidéo de la voiture à votre nom, et vous vérifiez vous-même le B/L. Vous payez uniquement une entreprise enregistrée, jamais une personne. Et vous pouvez nous rencontrer à Conakry."),
    ("À qui j'envoie l'argent ?", "Directement à l'entreprise coréenne qui vend la voiture, par virement, avec une facture à votre nom. La douane, vous la payez au transitaire. L'argent de la voiture ne passe jamais par un compte personnel."),
    ("Le prix affiché comprend quoi ?", "La voiture, le transport en bateau et l'assurance jusqu'au port. La douane est estimée à part, car vous la payez vous-même au transitaire. Aucun autre frais ne s'ajoute."),
    ("Combien de temps pour recevoir ma voiture ?", "En général 45 à 70 jours entre l'acompte et les clés pour Conakry, selon les départs de bateaux. Vous recevez les dates prévues dès la commande, et le suivi du navire en direct."),
    ("La voiture a-t-elle eu un accident ?", "Vous recevez son historique officiel coréen (CarHistory), traduit en français, avant de payer. Il montre les sinistres déclarés à l'assurance et les inondations."),
    ("Je vis en Europe : qui récupère la voiture ?", "La personne que vous désignez par écrit, accompagnée par notre équipe à Conakry. Vous suivez tout sur WhatsApp, avec photos et suivi du bateau."),
]
FAQ = "".join(f'<div class="qa"><button class="qa-q" aria-expanded="false">{html.escape(q)}<span class="qa-ico"></span></button><div class="qa-a"><p>{html.escape(a)}</p></div></div>' for q, a in faq)

out = src
for k, v in {"LOGO": logo, "WA": WA, "ARROW": ARROW, "CHECK": CHECK, "MQ1": MQ1, "MQ2": MQ2, "STEPS": STEPS, "CHECKS6": CHECKS6, "COUNTRIES": COUNTRIES, "FAQ": FAQ}.items():
    out = out.replace("{{" + k + "}}", v)
assert "{{" not in out, re.findall(r"\{\{\w+\}\}", out)
(ROOT / "index.html").write_text(out)
print("index.html :", len(out) // 1024, "Ko")
