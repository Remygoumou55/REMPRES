#!/usr/bin/env python3
"""Maquette « Ça t'est déjà arrivé ? » : les 5 blocs, style A (bande dessinée, terre et or)."""
import os, json, subprocess, html as H
ROOT = os.path.dirname(os.path.abspath(__file__))
E = H.escape
C = dict(titre="#5A2E14", accent="#C8892B", bulle_v="#FBEFD9", fond_panel="#FFFCF5", wa_me="#F6E3BF", wa_bg="#F4EFE6")

# Types de cases :
# ("face", heure, titre, (av_gauche, nom_gauche), (av_droite, nom_droite), [(G|D, texte)], narration)
# ("chat", heure, titre, (av_contact, nom_contact, sous_titre), [(G|D, texte, heure)], narration)   G = contact, D = le vendeur (moi)
# ("comments", heure, titre, sous_titre, [(av, nom, texte)], narration)
# ("email", heure, titre, de, a, objet, corps, narration)
# ("think", heure, titre, av, texte)
BLOCS = [
 ("BLOC 1", "Quand le client est devant toi", "Suis la journée de Fanta, vendeuse de robes au marché.",
  "7 h 30. Fanta installe ses robes sur son étal. Elle sourit : aujourd'hui, elle va bien vendre.", [
  ("face","8 h 00","Le premier passant",("🧑🏾","Un passant"),("🧕🏾","Fanta"),[("G","C'est combien, ça ?"),("D","Ça, c'est 15 000, mon fr…")],"Il a déjà reposé la robe. Il est parti. Fanta n'a même pas fini sa phrase."),
  ("face","9 h 30","Personne ne veut donner son prix",("👨🏾","Un client"),("🧕🏾","Fanta"),[("G","La robe bleue, c'est combien ?"),("D","15 000."),("G","Tu peux laisser à combien ?"),("D","Toi, tu proposes combien ?"),("G","Non, dis-moi d'abord ton dernier prix."),("D","Propose seulement, on va s'entendre !")],"Chacun attend que l'autre parle en premier."),
  ("face","9 h 35","Le prix cassé en deux",("👨🏾","Le même client"),("🧕🏾","Fanta"),[("G","Bon… 7 000."),("D","Ah non ! Augmente un peu. Moi-même, je ne l'ai pas achetée à ce prix."),("G","Je ne peux pas augmenter. C'est tout ce que j'ai sur moi."),("D","Bon, donne 12 000. C'est ton prix, parce que c'est toi."),("G","Hum… Laisse, je vais voir ailleurs.")],"Il s'en va. Fanta a baissé son prix de 3 000… et elle n'a rien vendu."),
  ("face","11 h 00","« Je vais faire le tour »",("👩🏾","Une cliente"),("🧕🏾","Fanta"),[("G","La jaune, là, c'est combien ?"),("D","12 000, ma sœur. C'est du bon tissu."),("G","D'accord, j'ai compris. Je vais faire le tour, je reviens."),("D","Pas de problème, à tout à l'heure !")],"La journée passe. Elle n'est jamais revenue."),
  ("face","14 h 00","« Je dois d'abord montrer à mon mari »",("👩🏾‍🦱","Une cliente"),("🧕🏾","Fanta"),[("G","Waouh, elle est jolie ! Elle me plaît vraiment."),("D","Elle te va très bien. C'est 12 000."),("G","Bon… mais je dois d'abord la montrer à mon mari."),("D","Ah bon… D'accord. Reviens avec lui.")],"Ni elle, ni son mari ne sont revenus."),
  ("face","16 h 30","« Écris mon nom dans le cahier »",("👵🏾","Une cliente fidèle"),("🧕🏾","Fanta"),[("G","Je prends les deux robes. Mais je n'ai pas l'argent aujourd'hui. Écris mon nom dans le cahier, je paie à la fin du mois."),("D","Pas de problème, tu es ma cliente. Je t'écris.")],"Deux robes sont parties. Pas un franc n'est rentré."),
  ("think","18 h 30","Fanta range ses robes","🧕🏾","Cinq clients… Zéro franc dans ma caisse… Et un nom de plus dans le cahier. Qu'est-ce que j'ai fait de mal aujourd'hui ?"),
 ], ["Le client demande le prix… et part avant que tu finisses.","« Tu peux laisser à combien ? » « Toi, tu proposes combien ? »","Tu baisses ton prix… et le client part quand même.","« Je vais faire le tour, je reviens »… et tu ne le revois jamais.","« Je dois d'abord montrer à mon mari. »","« Écris mon nom dans le cahier »… et la personne ne revient jamais payer."]),

 ("BLOC 2", "Quand le client t'écrit", "Suis la journée d'Amina, qui vend des chaussures et des sacs sur WhatsApp, Facebook et TikTok.",
  "7 h 00. Amina publie ses nouvelles baskets en statut. Les vues montent vite : 120, 250, 400…", [
  ("chat","8 h 12","Deux coches bleues",("🧑🏾","Client inconnu","en ligne"),[("G","Bjr. Les baskets blanches c combien ?","08:12"),("D","Bonjour, 25 000 F.","08:15")],"✓✓ Vu à 8 h 16. Une heure passe. Puis une journée. Plus rien."),
  ("chat","10 h 05","Dix questions… puis plus rien",("👩🏾","Cliente","en ligne"),[("G","Le sac noir, il existe en marron ?","10:05"),("D","Oui ! Voici la vidéo 📹","10:06"),("G","Il est en cuir ? La bandoulière est longue ?","10:08"),("D","Simili cuir, bandoulière réglable. 2 vidéos de plus 📹📹","10:10"),("G","Il est trop beau 😍 Je vais voir et je te reviens.","10:14")],"Amina a passé 40 minutes avec elle. La cliente n'est jamais revenue."),
  ("chat","12 h 40","« C'est pas l'arnaque ? »",("👨🏾","Client","en ligne"),[("G","C'est pas l'arnaque ? Vous êtes où exactement ?","12:40"),("G","Envoie la vraie photo. Et je paie seulement à la livraison.","12:41"),("D","Je ne suis pas une arnaqueuse ! Si vous ne me faites pas confiance, laissez.","12:43")],"✓✓ Vu. Le client a commandé ailleurs."),
  ("comments","15 h 20","« Prix en inbox »","Commentaires sous la publication d'Amina",[("👩🏾‍🦱","Mariam","Prix svp ?"),("👩🏾","Amina — vendeuse","Inbox 📩"),("👩🏾‍🦱","Mariam","Toujours « inbox »… Laisse ça."),("🧑🏾","Kader","Si le prix est caché, c'est que c'est cher 😂")],"Mariam n'a jamais écrit en privé. Et quinze personnes ont aimé le commentaire de Kader."),
  ("chat","19 h 00","« C'est quoi ton dernier prix ? »",("👨🏾‍🦱","Client","en ligne"),[("G","C'est quoi ton dernier prix ? Ailleurs j'ai vu à 18 000.","19:00"),("D","Ok… 20 000 pour toi seulement.","19:02"),("G","Hum. Je vais réfléchir.","19:05")],"Amina a perdu 5 000 sur son prix… et le client réfléchit encore."),
  ("think","22 h 00","Amina compte ses messages","👩🏾","53 messages aujourd'hui. Des dizaines de « c'est combien ? ». Une seule vente. Pourquoi ils ne reviennent jamais ?"),
 ], ["« C'est combien ? » → tu réponds → deux coches bleues… et plus rien.","Tu réponds à dix questions, tu envoies des vidéos… et le client disparaît.","« C'est pas l'arnaque ? », « Vous êtes où ? », « Je paie à la livraison. »","Tu écris « prix en inbox »… et personne ne t'écrit.","« C'est quoi ton dernier prix ? »… et après la baisse : « Je vais réfléchir. »"]),

 ("BLOC 3", "Quand le colis est en route", "Suis Amina et Sékou, le livreur à moto qui livre pour elle.",
  "Ce matin, Amina a trois commandes. Elle est contente : la journée commence bien.", [
  ("chat","10 h 00","« Emballe, je prends ! »",("👩🏾‍🦰","Cliente","en ligne"),[("G","Je prends les sandales noires en 38. Emballe ! 🙏","10:00"),("D","Super ! Livraison cet après-midi 😊","10:01")],"Amina emballe les sandales et paie 2 000 F à Sékou pour la course. Sékou démarre sa moto."),
  ("chat","13 h 40","Annulé en pleine route",("👩🏾‍🦰","Cliente","en ligne"),[("G","Désolée, finalement j'annule. 🙏","13:40"),("D","Mais le livreur est déjà en route !","13:41")],"✓✓ Vu. Pas de réponse. Sékou fait demi-tour avec le colis."),
  ("face","15 h 10","Le client qui ne décroche plus",("📵","Le client"),("🧔🏾","Sékou"),[("D","Allô ? Allô ? Je suis devant la pharmacie avec votre colis…"),("G","« Le numéro que vous demandez n'est pas joignable pour le moment. »")],"Sékou appelle une fois, deux fois, trois fois. Il attend 30 minutes au soleil. Personne."),
  ("face","17 h 00","À la porte",("👩🏾","Une cliente"),("🧔🏾","Sékou"),[("G","Hum… Ce n'est pas la couleur que je voulais."),("D","Mais Madame, la boutique vous a envoyé la photo…"),("G","Et puis j'ai vu moins cher ailleurs. De toute façon, je n'ai pas l'argent aujourd'hui. Repasse demain."),("D","Demain ? Mais…"),("G","Repars avec.")],"La porte se ferme. Sékou remonte sur sa moto avec le carton."),
  ("face","19 h 00","Le soir, à la boutique",("🧔🏾","Sékou"),("👩🏾","Amina"),[("G","Trois courses, trois retours. Qui va payer mon carburant ?"),("D","Et moi ? J'ai payé les courses, l'emballage… et j'ai acheté exprès les sandales chez mon fournisseur.")],"Ce soir, personne n'a rien gagné. Ni la vendeuse, ni le livreur."),
 ], ["Le client dit « emballe ! »… puis « j'annule ».","Le colis est en route… et le client annule.","Le livreur arrive… et le client ne décroche plus.","À la porte : « Ce n'est pas la couleur », « J'ai vu moins cher », « Repasse demain ».","Tu as perdu le transport, l'emballage et ta journée pour une vente qui n'existait pas."]),

 ("BLOC 4", "Quand tu vends un produit digital", "Suis la semaine d'Ibrahima, qui vend une formation en ligne pour apprendre à vendre sur WhatsApp.",
  "Lundi. Ibrahima lance sa publicité. Il a travaillé trois mois sur sa formation.", [
  ("comments","Lundi","Les commentaires","Commentaires sous la publicité d'Ibrahima",[("🧑🏾","Moussa D.","Encore un vendeur de rêve 😂"),("👩🏾","Awa K.","Arnaqueur ! On connaît vos méthodes."),("🧑🏾‍🦱","Yao","Quelqu'un a le PDF gratuit ? 🙏")],"Ibrahima répond à chacun pour se défendre. Les commentaires empirent."),
  ("chat","Mardi","« C'est combien ? »… « Ok merci »",("🧑🏾","Prospect","en ligne"),[("G","Slt, votre formation c'est combien ?","09:30"),("D","15 000 F.","09:35"),("G","Ok merci.","09:36")],"Plus jamais de nouvelles."),
  ("chat","Mercredi","« C'est pas encore une arnaque ? »",("👨🏾","Prospect","en ligne"),[("G","Ça m'intéresse beaucoup. Mais c'est pas encore une arnaque comme les autres ?","14:10"),("D","Non, pas du tout ! Je suis sérieux, faites-moi confiance, j'ai plein d'élèves, ma formation est la meilleure, vous allez voir les résultats…","14:12")],"Un très long message. ✓✓ Vu. Aucune réponse."),
  ("chat","Vendredi","Le paiement qui n'arrive jamais",("👩🏾‍🦱","Prospecte","en ligne"),[("G","Ok je prends. Envoie le lien.","18:00"),("D","Voici le lien de paiement Orange Money 👇","18:01"),("D","Vous avez pu payer ?","20:30"),("G","Ça n'a pas marché… Je vais voir demain.","21:15")],"Demain n'est jamais arrivé."),
  ("think","Dimanche","Ibrahima fait ses comptes","👨🏾‍💻","Des centaines de personnes ont vu ma publicité. Des dizaines m'ont écrit. Une seule a payé. Pourtant, ma formation est vraiment bonne…"),
 ], ["« Encore un vendeur de rêve », « Arnaqueur ! » sous ta publicité.","« C'est combien ? » → « Ok merci » → plus rien.","« Ça m'intéresse, mais c'est pas encore une arnaque ? »","« Quelqu'un a le PDF gratuit ? »","Le client clique pour payer… puis abandonne au moment du paiement."]),

 ("BLOC 5", "Quand tu vends à des entreprises ou des services", "Suis le mois de Koffi, commercial dans une entreprise de fournitures de bureau.",
  "Début du mois. Koffi a décroché un rendez-vous avec une grande entreprise. S'il signe, c'est son meilleur contrat de l'année.", [
  ("face","Lundi, 10 h","Le rendez-vous",("👩🏾‍💼","La responsable des achats"),("👨🏾‍💼","Koffi"),[("D","Nous livrons en 48 heures, nous avons 300 produits, nos prix sont…"),("G","Votre offre est intéressante. Envoyez-moi un devis par mail, je regarde."),("D","Très bien, je vous l'envoie ce soir !")],"Koffi a parlé pendant 25 minutes. Il ne lui a posé presque aucune question."),
  ("email","Lundi, 20 h","Le devis","Koffi","Responsable des achats","Votre devis pour les fournitures de bureau","Madame, veuillez trouver ci-joint notre devis. Je reste à votre disposition. Cordialement, Koffi.","Une semaine passe. Aucune réponse."),
  ("face","Lundi suivant","La relance",("👩🏾‍💼","La responsable"),("👨🏾‍💼","Koffi"),[("D","Bonjour Madame, vous avez pu regarder mon devis ?"),("G","Oui… mais je dois voir avec mon directeur."),("D","D'accord, j'attends votre retour.")],"Le directeur, Koffi ne l'a jamais rencontré."),
  ("face","Deux semaines après","Le prix",("👩🏾‍💼","La responsable"),("👨🏾‍💼","Koffi"),[("G","Le directeur trouve votre prix plus élevé que celui de notre fournisseur actuel."),("D","Je peux vous faire 10 % de remise !"),("G","On vous rappellera.")],"Personne n'a rappelé."),
  ("think","Fin du mois","Koffi regarde son tableau de ventes","👨🏾‍💼","Un mois de travail. Un devis, une remise… et toujours rien de signé. Où est-ce que je l'ai perdue ?"),
 ], ["« Envoyez-moi un devis »… et plus jamais de nouvelles.","« Je dois voir avec mon directeur »… que tu ne rencontres jamais.","Tu fais une remise… et le client ne signe quand même pas.","Tu parles beaucoup de ton offre, sans poser de questions au client."]),
]

CSS = f"""
@page {{ size: A4; margin: 15mm 16mm 15mm 16mm; }}
body {{ font-family: 'Times New Roman','Liberation Serif',serif; font-size: 14pt; color: #1d1d1d; }}
.top .k {{ color: {C['accent']}; letter-spacing: 3pt; font-weight: bold; font-size: 10.5pt; }}
.top h1 {{ margin: 3pt 0 4pt; color: {C['titre']}; font-size: 28pt; }}
.top p {{ margin: 0 0 10pt; }}
.blochead {{ break-before: page; }}
.blochead.first {{ break-before: auto; }}
.bloc {{ display: inline-block; background: {C['titre']}; color: #fff; padding: 7pt 16pt; border-radius: 20pt; font-weight: bold; font-size: 15pt; margin: 4pt 0 6pt; }}
.bloc span {{ color: {C['accent']}; margin-right: 6pt; }}
.sub {{ font-size: 14.5pt; margin: 2pt 0 4pt; }}
.intro {{ font-style: italic; font-size: 14pt; margin: 2pt 0 10pt; color: #444; }}
.time {{ display: flex; align-items: center; gap: 10pt; margin: 14pt 0 6pt; break-after: avoid; }}
.time .h {{ background: {C['accent']}; color: #fff; font-weight: bold; padding: 3pt 10pt; border-radius: 12pt; font-size: 12.5pt; white-space: nowrap; }}
.time .t {{ font-weight: bold; color: {C['titre']}; font-size: 15pt; }}
.time .line {{ flex: 1; border-top: 1.5pt dotted {C['accent']}; }}
.panel {{ border: 2.2pt solid {C['titre']}; border-radius: 4pt; padding: 9pt 11pt 7pt; background: {C['fond_panel']}; box-shadow: 4pt 4pt 0 {C['accent']}; break-inside: avoid; margin-bottom: 4pt; }}
.stage {{ display: grid; grid-template-columns: 72pt 1fr 72pt; gap: 6pt; align-items: start; }}
.char {{ text-align: center; }}
.char .face {{ font-size: 44pt; line-height: 1; }}
.char .name {{ font-size: 9.5pt; font-weight: bold; letter-spacing: .8pt; text-transform: uppercase; color: #555; margin-top: 3pt; }}
.char.r .name {{ color: {C['accent']}; }}
.talk {{ display: flex; flex-direction: column; gap: 9pt; padding-top: 4pt; }}
.b {{ position: relative; background: #fff; border: 1.8pt solid {C['titre']}; border-radius: 16pt; padding: 7pt 13pt; max-width: 84%; line-height: 1.35; font-size: 13.5pt; }}
.b.g {{ align-self: flex-start; }}
.b.d {{ align-self: flex-end; background: {C['bulle_v']}; }}
.b.g::before {{ content: ""; position: absolute; left: -11pt; top: 10pt; border: 6pt solid transparent; border-right: 11pt solid {C['titre']}; border-left: 0; }}
.b.g::after {{ content: ""; position: absolute; left: -8pt; top: 11.5pt; border: 4.5pt solid transparent; border-right: 8.5pt solid #fff; border-left: 0; }}
.b.d::before {{ content: ""; position: absolute; right: -11pt; top: 10pt; border: 6pt solid transparent; border-left: 11pt solid {C['titre']}; border-right: 0; }}
.b.d::after {{ content: ""; position: absolute; right: -8pt; top: 11.5pt; border: 4.5pt solid transparent; border-left: 8.5pt solid {C['bulle_v']}; border-right: 0; }}
.n {{ text-align: center; font-style: italic; color: #555; margin: 8pt 30pt 1pt; font-size: 13.5pt; }}
/* écran de téléphone */
.phone {{ width: 78%; margin: 0 auto; border: 2pt solid #2b2b2b; border-radius: 16pt; overflow: hidden; background: {C['wa_bg']}; }}
.phone .bar {{ background: {C['titre']}; color: #fff; padding: 5pt 10pt; display: flex; align-items: center; gap: 8pt; font-size: 12.5pt; }}
.phone .bar .av {{ font-size: 18pt; background: #fff3; border-radius: 50%; width: 24pt; height: 24pt; display: flex; align-items: center; justify-content: center; }}
.phone .bar small {{ display: block; font-size: 9.5pt; opacity: .8; }}
.phone .msgs {{ padding: 8pt 10pt; display: flex; flex-direction: column; gap: 6pt; }}
.m {{ max-width: 78%; padding: 5pt 10pt 3pt; border-radius: 10pt; font-size: 13pt; line-height: 1.3; box-shadow: 0 1pt 0 #0001; }}
.m.g {{ align-self: flex-start; background: #fff; border-top-left-radius: 2pt; }}
.m.d {{ align-self: flex-end; background: {C['wa_me']}; border-top-right-radius: 2pt; }}
.m .tm {{ display: block; text-align: right; font-size: 8.5pt; color: #777; margin-top: 1pt; }}
.m.d .tm::after {{ content: " ✓✓"; color: #3a7bd5; }}
/* commentaires */
.cm {{ width: 86%; margin: 0 auto; background: #fff; border: 1px solid #ddd; border-radius: 8pt; padding: 6pt 10pt; }}
.cm .head {{ font-size: 11pt; color: #777; margin-bottom: 4pt; }}
.cm .c {{ display: flex; gap: 8pt; margin: 6pt 0; align-items: flex-start; }}
.cm .c .av {{ font-size: 20pt; }}
.cm .c .txt {{ background: #f1f1f1; border-radius: 12pt; padding: 4pt 10pt; font-size: 13pt; }}
.cm .c .txt b {{ display: block; font-size: 11pt; }}
/* e-mail */
.mail {{ width: 86%; margin: 0 auto; background: #fff; border: 1px solid #ccc; border-radius: 6pt; font-size: 13pt; }}
.mail .h {{ background: #f3f3f3; padding: 6pt 10pt; border-bottom: 1px solid #ddd; font-size: 11.5pt; line-height: 1.5; }}
.mail .body {{ padding: 8pt 10pt; }}
.mail .att {{ display: inline-block; margin-top: 6pt; background: #f6efe3; border: 1px solid #e0cfa9; border-radius: 4pt; padding: 2pt 8pt; font-size: 11pt; }}
/* pensée */
.think {{ text-align: center; break-inside: avoid; }}
.think .cloud {{ display: inline-block; background: {C['bulle_v']}; border: 1.8pt dashed {C['titre']}; border-radius: 30pt; padding: 10pt 18pt; font-style: italic; font-size: 14pt; max-width: 78%; }}
.think .face {{ font-size: 48pt; display: block; margin-top: 4pt; }}
.check {{ break-inside: avoid; border-top: 3pt solid {C['accent']}; padding-top: 8pt; margin-top: 14pt; }}
.check h2 {{ margin: 0 0 4pt; color: {C['titre']}; font-size: 17pt; }}
.check ul {{ padding-left: 4pt; margin: 4pt 0; }} .check li {{ list-style: none; margin: 3pt 0; }}
.final {{ break-inside: avoid; background: {C['titre']}; color: #fff; border-radius: 8pt; padding: 14pt 18pt; margin-top: 18pt; font-size: 15pt; }}
.final b {{ color: #F4C979; }}
"""

def panel(p):
    k = p[0]
    if k == "face":
        _, h, t, (al, nl), (ar, nr), lines, nar = p
        talk = "".join(f'<div class="b {"g" if w=="G" else "d"}">{E(x)}</div>' for w, x in lines)
        body = (f'<div class="stage"><div class="char"><div class="face">{al}</div><div class="name">{E(nl)}</div></div>'
                f'<div class="talk">{talk}</div><div class="char r"><div class="face">{ar}</div><div class="name">{E(nr)}</div></div></div>'
                f'<div class="n">{E(nar)}</div>')
    elif k == "chat":
        _, h, t, (av, nm, st), lines, nar = p
        msgs = "".join(f'<div class="m {"g" if w=="G" else "d"}">{E(x)}<span class="tm">{tm}</span></div>' for w, x, tm in lines)
        body = (f'<div class="phone"><div class="bar"><span class="av">{av}</span><span>{E(nm)}<small>{E(st)}</small></span></div>'
                f'<div class="msgs">{msgs}</div></div><div class="n">{E(nar)}</div>')
    elif k == "comments":
        _, h, t, head, items, nar = p
        cs = "".join(f'<div class="c"><span class="av">{av}</span><div class="txt"><b>{E(n)}</b>{E(x)}</div></div>' for av, n, x in items)
        body = f'<div class="cm"><div class="head">💬 {E(head)}</div>{cs}</div><div class="n">{E(nar)}</div>'
    elif k == "email":
        _, h, t, de, a, obj, corps, nar = p
        body = (f'<div class="mail"><div class="h"><b>De :</b> {E(de)}<br><b>À :</b> {E(a)}<br><b>Objet :</b> {E(obj)}</div>'
                f'<div class="body">{E(corps)}<br><span class="att">📎 devis.pdf</span></div></div><div class="n">{E(nar)}</div>')
    elif k == "think":
        _, h, t, av, txt = p
        return (f'<div class="time"><span class="h">{E(h)}</span><span class="t">{E(t)}</span><span class="line"></span></div>'
                f'<div class="think"><div class="cloud">{E(txt)}</div><span class="face">{av}</span></div>')
    return f'<div class="time"><span class="h">{E(h)}</span><span class="t">{E(t)}</span><span class="line"></span></div><div class="panel">{body}</div>'

out = ['<div class="top"><div class="k">AVANT DE COMMENCER</div><h1>Ça t\'est déjà arrivé ?</h1>',
       '<p>Voici <b>5 histoires vraies de la vente en Afrique</b> : au marché, sur WhatsApp, sur la route du livreur, en ligne et dans les bureaux. Lis celle qui te ressemble… ou lis-les toutes. <b>Tu vas sûrement te reconnaître.</b></p></div>']
for i, (num, titre, sub, intro, panels, checks) in enumerate(BLOCS):
    out.append(f'<div class="blochead{" first" if i==0 else ""}"><div class="bloc"><span>{num}</span>{E(titre)}</div><div class="sub">{E(sub)}</div><div class="intro">{E(intro)}</div></div>')
    out += [panel(p) for p in panels]
    items = "".join(f"<li>☐ {E(x)}</li>" for x in checks)
    out.append(f'<div class="check"><h2>Et toi, ça t\'est déjà arrivé ?</h2><ul>{items}</ul></div>')
out.append('<div class="final"><b>Tu as coché au moins une case ?</b> Alors tu n\'es pas seul. Fanta, Amina, Sékou, Ibrahima et Koffi vivent ce que des milliers de vendeurs africains vivent chaque jour. <b>Chacune de ces scènes a une explication, et presque chacune a une solution.</b> Tourne la page : on commence.</div>')
html = f'<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>{CSS}</style></head><body>{"".join(out)}</body></html>'
hp = os.path.join(ROOT, "_tous.html"); open(hp, "w", encoding="utf-8").write(html)
outp = os.path.join(ROOT, "maquette-5-blocs-style-A.pdf")
js = "const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file://%s');await p.pdf({path:'%s',format:'A4',printBackground:true,margin:{top:'15mm',bottom:'15mm',left:'16mm',right:'16mm'}});await b.close();})();" % (hp, outp)
jsp = os.path.join(ROOT, "_r.js"); open(jsp, "w").write(js)
subprocess.run(["node", jsp], check=True)
os.remove(hp); os.remove(jsp)
print(outp)
