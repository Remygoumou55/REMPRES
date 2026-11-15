/* KBA · variante 2 — moteur d'interface et de motion design.
   GSAP + ScrollTrigger (animations), Lenis (défilement fluide).
   3 langues (assets/i18n.js), 2 thèmes, conversion des prix dans toutes les devises (assets/js/rates.js). */
(function () {
  "use strict";

  /* ================= Réglages ================= */
  var WA_NUMBER = "821072229167";
  var PHONE_DISPLAY = "+82 10-7222-9167";
  var MAIN_CUR = ["USD", "EUR", "GNF", "XOF", "XAF", "KRW", "GBP", "CAD", "CNY", "AED", "NGN", "GHS", "MAD"];
  var LOCALE = { fr: "fr-FR", en: "en-US", ko: "ko-KR" };

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HAS_GSAP = !!window.gsap && !REDUCED;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var I18N = window.KBA_I18N, RATES = (window.KBA_RATES || { rates: { USD: 1 }, date: "" });

  var nav2 = (navigator.language || "fr").slice(0, 2);
  var lang = store.get("kba-lang") || (nav2 === "ko" ? "ko" : nav2 === "en" ? "en" : "fr");
  if (!I18N[lang]) lang = "fr";
  var cur = store.get("kba-cur") || "USD";
  if (!RATES.rates[cur]) cur = "USD";
  var T = I18N[lang];

  function tr(path) { return path.split(".").reduce(function (o, k) { return o == null ? o : o[k]; }, T); }
  function money(usd) {
    var v = usd * (RATES.rates[cur] || 1);
    if (v >= 100000) v = Math.round(v / 1000) * 1000;
    try { return new Intl.NumberFormat(LOCALE[lang], { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(v); }
    catch (e) { return Math.round(v) + " " + cur; }
  }
  var wa = function (msg) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); };

  /* ================= Voitures (exemples) ================= */
  var IMG = "assets/img/";
  var cars = [
    { ref: "KBA-0009", real: true, type: "compacte", brand: "Hyundai", model: "Veloster", version: "1.6 GDi", year: 2011, km: 114038, fuel: "Essence", box: "Automatique", engine: "1.6 L GDi", seats: 4, status: "dispo", price: [3300, 1450, 50], customs: null, // TODO : prix parc 3 300 $ ; commission KBA
      photos: ["veloster/01-avant-3-4-droit.jpg", "veloster/02-avant-3-4-gauche.jpg", "veloster/03-avant-3-4-droit-2.jpg", "veloster/04-face-avant.jpg", "veloster/05-profil-gauche.jpg", "veloster/06-profil-droit.jpg", "veloster/07-arriere-3-4-gauche.jpg", "veloster/08-arriere-3-4-gauche-2.jpg", "veloster/09-arriere-3-4-droit.jpg", "veloster/10-face-arriere.jpg", "veloster/10b-coffre-ouvert.jpg", "veloster/11-optique-avant.jpg", "veloster/12-feu-arriere.jpg", "veloster/13-roue-avant.jpg", "veloster/14-aile-avant-droite.jpg", "veloster/15-plaque-constructeur.jpg", "veloster/16-porte-conducteur.jpg", "veloster/17-poste-conduite.jpg", "veloster/17b-poste-conduite-large.jpg", "veloster/17c-planche-bord-vue-passager.jpg", "veloster/17d-habitacle-avant.jpg", "veloster/18-volant.jpg", "veloster/19-compteur.jpg", "veloster/20-ecran-gps-console.jpg", "veloster/21-ecran-camera.jpg", "veloster/22-ecran-gps.jpg", "veloster/23-levier-automatique.jpg", "veloster/24-commandes-eco.jpg", "veloster/25-siege-passager.jpg", "veloster/25b-siege-passager-logo.jpg", "veloster/26-planche-bord-passager.jpg", "veloster/26b-porte-avant-droite.jpg", "veloster/29-banquette-arriere.jpg", "veloster/30-vue-arriere-vers-avant.jpg", "veloster/31-panneau-arriere-droit.jpg", "veloster/27-deux-cles.jpg", "veloster/28-camera-recul.jpg"] },
    { ref: "KBA-0008", real: true, type: "citadine", brand: "Chevrolet", model: "Spark", version: "LT", year: 2012, km: 94739, fuel: "Essence", box: "Automatique", engine: "1.0 L DOHC", seats: 5, status: "dispo", price: [2500, 1450, 50], customs: null, // TODO : prix parc 2 500 $ ; commission KBA
      photos: ["spark/01-avant-3-4-gauche.jpg", "spark/02-avant-3-4-droit.jpg", "spark/03-face-avant.jpg", "spark/04-avant-3-4-gauche-2.jpg", "spark/05-profil-gauche.jpg", "spark/06-profil-droit.jpg", "spark/07-arriere-3-4-gauche.jpg", "spark/08-arriere-3-4-droit.jpg", "spark/09-face-arriere.jpg", "spark/10-optique-roue.jpg", "spark/11-optique-avant.jpg", "spark/12-feu-arriere.jpg", "spark/13-porte-conducteur.jpg", "spark/13b-volant-compteur.jpg", "spark/13c-console-radio.jpg", "spark/13d-levier-automatique.jpg", "spark/13e-retroviseur-camera.jpg", "spark/14-sieges-avant.jpg", "spark/14b-banquette-arriere.jpg", "spark/14c-banquette-arriere-2.jpg", "spark/14d-dossiers-avant.jpg", "spark/14e-dossiers-avant-2.jpg", "spark/15-planche-bord-passager.jpg", "spark/15b-porte-avant-droite.jpg", "spark/15c-porte-arriere-gauche.jpg", "spark/15d-porte-arriere-droite.jpg", "spark/16-plaque-constructeur.jpg"] },
    { ref: "KBA-0007", real: true, type: "suv", brand: "Hyundai", model: "Maxcruz", version: "Full option", year: 2017, km: 73866, fuel: "Essence", box: "Automatique", engine: null, seats: 7, status: "dispo", price: [9500, 1550, 100], customs: null, // TODO : prix parc 9 500 $ ; commission KBA, fret ; km à confirmer
      photos: ["maxcruz/01-avant-3-4-droit.jpg", "maxcruz/02-avant-3-4-gauche.jpg", "maxcruz/03-arriere-3-4-droit.jpg", "maxcruz/04-arriere-3-4-gauche.jpg", "maxcruz/05-optique-avant.jpg", "maxcruz/06-porte-conducteur.jpg", "maxcruz/07-poste-conduite.jpg", "maxcruz/08-ecran-camera.jpg", "maxcruz/09-console-centrale.jpg", "maxcruz/10-siege-conducteur.jpg", "maxcruz/11-plaque-constructeur.jpg"] },
    { ref: "KBA-0006", real: true, type: "suv", brand: "Lexus", model: "RX 450h", version: "3.5 V6 HEV", year: 2018, km: 89000, fuel: "Hybride", box: "Automatique", engine: "3.5 L V6 + électrique", seats: 5, status: "dispo", price: [30000, 1550, 300], customs: null, // TODO : prix parc 30 000 $ ; commission KBA, fret
      photos: ["lexus-rx/01-face-avant.jpg", "lexus-rx/02-roue-retroviseur.jpg", "lexus-rx/03-poste-conduite.jpg", "lexus-rx/04-planche-bord-passager.jpg", "lexus-rx/05-console-arriere.jpg", "lexus-rx/06-banquette-arriere.jpg", "lexus-rx/07-porte-arriere.jpg", "lexus-rx/08-porte-arriere-2.jpg", "lexus-rx/09-plafonnier-toit.jpg", "lexus-rx/10-plaque-constructeur.jpg"] },
    { ref: "KBA-0005", real: true, type: "berline", brand: "Kia", model: "K5", version: "2.4 GDi", year: 2011, km: 227893, fuel: "Essence", box: "Automatique", engine: "2.4 L GDi", seats: 5, status: "dispo", price: null, customs: null, // TODO : prix au parc à recevoir
      videos: ["k5/video-1", "k5/video-2", "k5/video-3"],
      photos: ["k5/01-avant-3-4-gauche.jpg", "k5/02-avant-3-4-droit.jpg", "k5/03-face-avant.jpg", "k5/04-profil-gauche.jpg", "k5/05-arriere-3-4-droit.jpg", "k5/05b-face-arriere.jpg", "k5/06-coffre.jpg", "k5/07-poste-conduite.jpg", "k5/08-volant.jpg", "k5/09-compteur.jpg", "k5/10-console.jpg", "k5/11-toit-panoramique.jpg", "k5/12-commandes-porte.jpg", "k5/13-retroviseur.jpg", "k5/14-plaque-constructeur.jpg"] },
    { ref: "KBA-0004", real: true, type: "berline", brand: "Hyundai", model: "Grandeur", version: "HG", year: 2016, km: 124308, fuel: "Essence", box: "Automatique", engine: null, seats: 5, status: "dispo", price: [3600, 1450, 60], customs: null, // TODO : prix parc 3 600 $ ; commission KBA, fret
      photos: ["grandeur/01-avant-3-4-gauche.jpg", "grandeur/02-avant-3-4-droit.jpg", "grandeur/03-avant-3-4-gauche-2.jpg", "grandeur/04-face-avant.jpg", "grandeur/05-profil-gauche.jpg", "grandeur/06-profil-droit.jpg", "grandeur/07-arriere-3-4-gauche.jpg", "grandeur/08-arriere-3-4-droit.jpg", "grandeur/09-face-arriere.jpg", "grandeur/10-optique-avant.jpg", "grandeur/11-feu-arriere.jpg", "grandeur/12-roue-avant.jpg", "grandeur/19-tableau-de-bord-complet.jpg", "grandeur/20-poste-conduite.jpg", "grandeur/21-planche-de-bord.jpg", "grandeur/22-compteur.jpg", "grandeur/23-volant.jpg", "grandeur/24-ecran-gps.jpg", "grandeur/25-camera-recul.jpg", "grandeur/26-console.jpg", "grandeur/27-commandes.jpg", "grandeur/28-sieges-avant.jpg", "grandeur/29-siege-conducteur.jpg", "grandeur/30-siege-passager.jpg", "grandeur/31-planche-passager.jpg", "grandeur/35-planche-de-bord-cote.jpg", "grandeur/36-siege-passager-2.jpg", "grandeur/37-porte-avant-droite.jpg", "grandeur/38-banquette-arriere.jpg", "grandeur/39-banquette-arriere-droite.jpg", "grandeur/40-places-arriere.jpg", "grandeur/41-places-arriere-2.jpg", "grandeur/42-porte-arriere-droite.jpg", "grandeur/43-coffre.jpg", "grandeur/32-porte-avant.jpg", "grandeur/33-porte-arriere.jpg", "grandeur/34-deux-cles.jpg", "grandeur/13-plaque-constructeur.jpg"] },
    { ref: "KBA-0003", real: true, type: "berline", brand: "Hyundai", model: "Sonata Hybrid", version: "Full option", year: 2012, km: null, fuel: "Hybride", box: "Automatique", engine: "2.0 L + électrique", seats: 5, status: "dispo", price: [3500, 1450, 60], customs: null, // TODO : prix parc 3 500 $ ; commission KBA, fret, kilométrage à confirmer
      photos: ["sonata/01-avant-3-4.jpg", "sonata/02-avant-3-4-droit.jpg", "sonata/03-avant-3-4-gauche.jpg", "sonata/04-face-avant.jpg", "sonata/05-profil-gauche.jpg", "sonata/06-profil-droit.jpg", "sonata/07-arriere-3-4-gauche.jpg", "sonata/08-arriere-3-4-droit.jpg", "sonata/09-face-arriere.jpg", "sonata/10-optique-avant.jpg", "sonata/11-feu-arriere.jpg", "sonata/12-aile-avant.jpg", "sonata/13-poste-conduite.jpg", "sonata/14-porte-avant.jpg", "sonata/15-plaque-constructeur.jpg"] },
    { ref: "KBA-0002", real: true, type: "suv", brand: "Kia", model: "Sportage", version: "1.6 T-GDi", year: 2022, km: 136916, fuel: "Essence", box: "Automatique", engine: null, seats: 5, status: "dispo", price: [14000, 1550, 150], customs: null, // TODO : prix parc 14 000 $ ; ajouter la commission KBA, confirmer le fret 
      photos: ["sportage/01-avant-3-4.jpg", "sportage/02-avant-3-4-droit.jpg", "sportage/03-avant-3-4-gauche.jpg", "sportage/04-face-avant.jpg", "sportage/04b-optique-avant.jpg", "sportage/05-profil-gauche.jpg", "sportage/06-profil-droit.jpg", "sportage/07-arriere-3-4.jpg", "sportage/07c-arriere-3-4-droit.jpg", "sportage/07d-coffre-ouvert.jpg", "sportage/07b-face-arriere.jpg", "sportage/09-feu-arriere.jpg", "sportage/08-roue-avant.jpg", "sportage/08b-roue-avant-droite.jpg", "sportage/10b-porte-ouverte.jpg", "sportage/10-poste-conduite.jpg", "sportage/10d-compteur.jpg", "sportage/10c-commandes-gauche.jpg", "sportage/11b-ecran-camera.jpg", "sportage/11-console.jpg", "sportage/12-sieges-avant.jpg", "sportage/12b-siege-conducteur.jpg", "sportage/12c-siege-passager-incline.jpg", "sportage/13-siege-passager.jpg", "sportage/14-banquette-arriere.jpg", "sportage/14b-vue-arriere-vers-avant.jpg", "sportage/14c-banquette-accoudoir.jpg", "sportage/14d-dossiers-avant.jpg", "sportage/15-porte-avant-gauche.jpg", "sportage/16-porte-avant-droite.jpg", "sportage/15b-porte-arriere-droite.jpg", "sportage/17-plaque-constructeur.jpg"] },
    { ref: "KBA-0001", real: true, type: "berline", brand: "Chevrolet", model: "Malibu", version: "LT", year: 2012, km: 175491, fuel: "Essence", box: "Automatique", engine: null, seats: 5, status: "dispo", price: [2600, 1450, 60], customs: null, // TODO : prix parc 2 600 $ ; ajouter la commission KBA et confirmer le fret
      photos: ["malibu/01-avant-3-4.jpg", "malibu/02-avant-3-4-droit.jpg", "malibu/03-avant-3-4-gauche.jpg", "malibu/04-profil-droit.jpg", "malibu/05-arriere-3-4-gauche.jpg", "malibu/06-arriere-3-4-droit.jpg", "malibu/07-face-avant.jpg", "malibu/08-phare.jpg", "malibu/09-poste-conduite.jpg", "malibu/22-tableau-de-bord.jpg", "malibu/21-sieges-avant.jpg", "malibu/20-reglages-siege.jpg", "malibu/10-volant.jpg", "malibu/11-compteur.jpg", "malibu/12-console.jpg", "malibu/13-ecran-camera.jpg", "malibu/14-banquette-arriere.jpg", "malibu/18-banquette-arriere-2.jpg", "malibu/19-places-arriere.jpg", "malibu/17-porte-avant.jpg", "malibu/15-porte-arriere.jpg", "malibu/16-defaut-aile-arriere.jpg"] },
  ];
  var total = function (c) { return c.price ? c.price[0] + c.price[1] + c.price[2] : 0; };
  var priceTxt = function (c) { return c.price ? money(total(c)) : T.arr.onRequest; };
  var kmFmt = function (n) { return n == null ? "km " + T.dw.tbc : new Intl.NumberFormat(LOCALE[lang]).format(n) + " km"; };
  var carTxt = function (c) { return ((window.KBA_CARS_TXT || {})[c.ref] || {})[lang] || [[], []]; };
  var filter = "all";

  var ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>';
  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var ICON_DIAMOND = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M5 0L10 5L5 10L0 5Z" fill="currentColor"/></svg>';

  function poster(c, big) {
    return '<div class="car-lines"></div><div class="car-year"' + (big ? ' style="font-size:200px;top:40px"' : "") + ">" + c.year + '</div><div class="car-poster"' + (big ? ' style="bottom:56px"' : "") + '><span class="label">' + esc(c.brand + " · " + c.version) + "</span><b" + (big ? ' style="font-size:56px"' : "") + ">" + esc(c.model) + '</b></div><span class="car-pending label">' + T.arr.pending + "</span>";
  }
  function carCard(c, i) {
    var ICON_IMG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/></svg>';
    var media = c.photos.length
      ? '<div class="slides">' + c.photos.map(function (p, k) { return '<img class="slide' + (k ? "" : " on") + '" ' + (k ? 'data-src="' : 'src="') + IMG + p + '" alt="' + esc(c.brand + " " + c.model) + " · " + (k + 1) + '">'; }).join("") + "</div>" +
        '<span class="car-year-pill label">' + c.year + '</span><span class="car-count label">' + ICON_IMG + c.photos.length + " " + T.arr.photos + (c.videos ? " · " + c.videos.length + " " + T.arr.vids : "") + "</span>"
      : poster(c);
    var cls = c.status === "res" ? " res" : c.status === "route" ? " route" : "";
    return '<button class="car rv" data-i="' + i + '" data-type="' + c.type + '"' + (filter !== "all" && filter !== c.type ? ' style="display:none"' : "") + ">" +
      '<div class="car-media">' + media + '<div class="car-badges"><span class="badge label' + cls + '"><i></i>' + T.arr.status[c.status] + '</span>' + (c.real ? "" : '<span class="badge ex label">' + T.arr.ex + "</span>") + "</div></div>" +
      '<div class="car-body"><div class="car-ref label"><span>' + c.ref + "</span><span>" + T.arr.types[c.type] + "</span></div>" +
      '<div class="car-name">' + esc(c.brand + " " + c.model) + " <span>" + esc(c.version) + "</span></div>" +
      '<div class="car-spec">' + c.year + " · " + kmFmt(c.km) + " · " + T.arr.fuel[c.fuel] + " · " + T.arr.box[c.box] + "</div>" +
      '<div class="car-price"><div><span class="label" style="color:var(--d-muted)">' + T.arr.total + "</span><strong>" + priceTxt(c) + "</strong></div>" +
      '<span class="car-ok">' + ICON_SHIELD + T.arr.ok + "</span></div></div></button>";
  }

  /* ================= Téléphone « Avant KBA / Avec KBA » ================= */
  var phTl = null, phVisible = true;
  var CAR_SIL = '<svg viewBox="0 0 120 54" aria-hidden="true"><path d="M8 40c0-6 4-9 10-10l16-12c4-3 8-4 13-4h22c6 0 10 2 14 6l11 10c9 1 18 3 18 10v6c0 2-1 3-3 3h-8a10 10 0 0 1-20 0H44a10 10 0 0 1-20 0h-9c-4 0-7-3-7-7z" fill="currentColor"/><circle cx="34" cy="46" r="7" fill="#fff" opacity=".5"/><circle cx="91" cy="46" r="7" fill="#fff" opacity=".5"/></svg>';
  var ICON_DOC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>';
  function phMsg(m, k) {
    var dir = m[0], kind = m[1], txt = esc(m[2]);
    if (dir === "sys") return '<div class="msg sys">' + txt + "</div>";
    var media = "";
    if (kind === "photo") media = '<div class="m-photo">' + CAR_SIL + "<span>photo.jpg</span></div>";
    if (kind === "video") media = '<div class="m-video"><img src="' + IMG + 'sportage/02-avant-3-4-droit.jpg" alt=""><span class="m-sheet">' + esc(T.man.sheet) + '</span><span class="m-play"></span></div>';
    if (kind === "doc") media = '<span class="m-doc">' + ICON_DOC + "</span>";
    if (kind === "ship") media = '<div class="m-ship"><div class="m-route"><span>' + esc(T.man.track[0]) + '</span><i><em></em></i><span>' + esc(T.man.track[1]) + '</span></div></div>';
    var after = kind === "ship" ? '<span class="m-btn">' + esc(T.man.follow) + "</span>" : "";
    return '<div class="msg ' + dir + (kind ? " k-" + kind : "") + '">' + media + "<p>" + txt + "</p>" + after + "<time>" + (10 + k) + ":0" + k + (dir === "out" ? " ✓✓" : "") + "</time></div>";
  }
  function phHeader(s) {
    var p = $("#phone"); if (!p) return;
    p.classList.toggle("s1", s === 1);
    $$("[data-scene]", p).forEach(function (b) { var on = +b.getAttribute("data-scene") === s; b.classList.toggle("on", on); b.setAttribute("aria-selected", on); });
    $("#tbMode").textContent = s ? T.man.after : T.man.before;
    $("#phAv").textContent = s ? "KBA" : "AD";
    $("#phName").textContent = s ? T.man.kName : T.man.sName;
    $("#phSub").innerHTML = s ? '<span class="vf">✓</span> ' + esc(T.man.kSub) : esc(T.man.sSub);
    $$(".ph-scene", p).forEach(function (e, i) { e.classList.toggle("on", i === s); });
  }
  function phShowAll(s) { phHeader(s); $$(".ph-scene .msg").forEach(function (m) { if (!m.classList.contains("typing")) m.classList.add("show"); }); }
  function phRun(s) {
    if (phTl) phTl.kill();
    var sc = $$(".ph-scene")[s]; if (!sc) return;
    var msgs = $$(".msg", sc).filter(function (m) { return !m.classList.contains("typing"); }), typing = $(".typing", sc);
    msgs.forEach(function (m) { m.classList.toggle("show", false); }); typing.classList.toggle("show", false);
    phHeader(s);
    phTl = gsap.timeline({ onComplete: function () { phRun(1 - s); } });
    phTl.to({}, { duration: 0.5 });
    msgs.forEach(function (m) {
      var isIn = m.classList.contains("in");
      if (isIn) phTl.call(function () { typing.classList.add("show"); }).to({}, { duration: 0.95 }).call(function () { typing.classList.toggle("show", false); });
      phTl.call(function () { m.classList.add("show"); })
        .fromTo(m, { opacity: 0, y: 18, scale: 0.94 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)", transformOrigin: m.classList.contains("out") ? "100% 100%" : "0% 100%" })
        .to({}, { duration: m.classList.contains("out") ? 0.6 : 1 });
      if (m.classList.contains("k-ship")) phTl.fromTo($("em", m), { width: "0%" }, { width: "100%", duration: 1.6, ease: "power1.inOut" }, "-=0.7");
    });
    phTl.to({}, { duration: 2.8 });
    if (!phVisible) phTl.pause();
  }
  function buildPhone() {
    var body = $("#phBody"); if (!body) return;
    body.innerHTML = [T.man.chatA, T.man.chatB].map(function (list, s) { return '<div class="ph-scene' + (s ? " sc-kba" : " sc-scam") + '">' + list.map(phMsg).join("") + '<div class="msg in typing"><i></i><i></i><i></i></div></div>'; }).join("");
    [T.man.chatA, T.man.chatB].forEach(function (list, i) { $("#tbN" + i).textContent = i ? T.man.kName : T.man.sName; $("#tbP" + i).textContent = list[list.length - 1][2]; });
    $$("#phone [data-scene]").forEach(function (b) { b.onclick = function () { var s = +b.getAttribute("data-scene"); if (HAS_GSAP) phRun(s); else phShowAll(s); }; });
    if (HAS_GSAP) phRun(0); else phShowAll(1);
  }
  if ("IntersectionObserver" in window && $("#phone")) {
    new IntersectionObserver(function (es) { es.forEach(function (e) { phVisible = e.isIntersecting; if (phTl) { if (phVisible) phTl.resume(); else phTl.pause(); } }); }).observe($("#phone"));
  }

  /* ================= Prix : diagramme circulaire ================= */
  var donutOn = false, DR = 92, DC = 2 * Math.PI * 92;
  function buildDonut() {
    var svg = $("#donut"); if (!svg) return;
    var rows = $$(".pl-row"), vals = rows.map(function (r) { return +$("b", r).getAttribute("data-usd"); });
    var total = vals.reduce(function (a, b) { return a + b; }, 0), GAP = 4, off = 0;
    var pf = new Intl.NumberFormat(LOCALE[lang], { style: "percent", maximumFractionDigits: 1 });
    svg.setAttribute("aria-label", rows.map(function (r, i) { return $("span", r).textContent + " " + pf.format(vals[i] / total); }).join(", "));
    svg.innerHTML = '<circle class="d-track" cx="120" cy="120" r="' + DR + '"/>' + vals.map(function (v, i) {
      var len = Math.max(v / total * DC - GAP, 2.5);
      var c = '<circle class="seg s' + i + '" data-seg="' + i + '" tabindex="-1" cx="120" cy="120" r="' + DR + '" stroke-dasharray="' + (donutOn ? len : 0) + " " + DC + '" data-len="' + len + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 120 120)"/>';
      off += v / total * DC; return c;
    }).join("");
    rows.forEach(function (r, i) { $(".pct", r).textContent = pf.format(vals[i] / total); r.setAttribute("tabindex", "0"); });
    var wrap = $(".price-box"), tip = $("#donutTip");
    function hl(i) {
      wrap.classList.toggle("hl", i !== null);
      $$("[data-seg]", wrap).forEach(function (e) { e.classList.toggle("on", +e.getAttribute("data-seg") === i); });
      if (i === null) { tip.classList.toggle("on", false); return; }
      tip.innerHTML = "<span>" + esc($("span", rows[i]).textContent) + "</span><b>" + money(vals[i]) + "</b><em>" + pf.format(vals[i] / total) + "</em>"; tip.classList.add("on");
    }
    $$("[data-seg]", wrap).forEach(function (e) { var i = +e.getAttribute("data-seg"); e.onmouseenter = e.onfocus = function () { hl(i); }; e.onmouseleave = e.onblur = function () { hl(null); }; });
  }
  var priceRef = "KBA-0002";
  function fillPriceCars() {
    var sel = $("#priceCar"); if (!sel) return;
    sel.innerHTML = cars.filter(function (c) { return c.price; }).map(function (c) { return '<option value="' + c.ref + '">' + c.ref + " · " + esc(c.brand + " " + c.model) + " " + c.year + "</option>"; }).join("");
    sel.value = priceRef; sel.onchange = function () { setPriceCar(sel.value, true); };
    setPriceCar(priceRef, false);
  }
  function setPriceCar(ref, anim) {
    var c = cars.filter(function (x) { return x.ref === ref; })[0]; if (!c || !c.price) return;
    priceRef = ref;
    var t = c.price[0] + c.price[1] + c.price[2];
    $$(".pl-row b").forEach(function (b, i) { b.setAttribute("data-usd", c.price[i]); if (anim) b.dataset.done = 1; });
    $$(".pl-tot b, .donut-c b").forEach(function (b) { b.setAttribute("data-usd", t); if (anim) b.dataset.done = 1; });
    if (anim) { renderPrices(); var on = donutOn; donutOn = false; buildDonut(); if (on) showDonut(); else donutOn = false; }
    else buildDonut();
  }
  function showDonut() { donutOn = true; $$("#donut .seg").forEach(function (c, i) { setTimeout(function () { c.setAttribute("stroke-dasharray", c.getAttribute("data-len") + " " + DC); }, 150 + i * 280); }); }

  /* ================= Déclencheur à l'apparition ================= */
  function onView(el, fn) {
    if (!el) return;
    if (!("IntersectionObserver" in window) || REDUCED) { fn(); return; }
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { fn(); io.disconnect(); } }, { rootMargin: "0px 0px -15% 0px" }); io.observe(el);
  }

  /* ================= Diaporama des cartes ================= */
  var slideTimers = [];
  var FX = ["fade", "zoom", "slideL", "wipe", "blur", "slideR", "rise"];
  function startSlideshows() {
    slideTimers.forEach(clearTimeout); slideTimers = [];
    $$("#cars .car").forEach(function (card, n) {
      var imgs = $$(".slide", card); if (imgs.length < 2) return;
      var i = 0, fx = n % FX.length;
      function load(img) { if (img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; } }
      load(imgs[1]);
      function next() {
        if (card.offsetParent === null || document.hidden || current !== null) { slideTimers[n] = setTimeout(next, 1500); return; }
        var a = imgs[i]; i = (i + 1) % imgs.length; var b = imgs[i]; load(b); load(imgs[(i + 1) % imgs.length]);
        var kind = FX[fx++ % FX.length];
        if (!HAS_GSAP) { a.classList.toggle("on", false); b.classList.add("on"); }
        else {
          gsap.killTweensOf([a, b]);
          var from = { zoom: { opacity: 0, scale: 1.18 }, slideL: { xPercent: 100, opacity: 1 }, slideR: { xPercent: -100, opacity: 1 }, wipe: { clipPath: "inset(0 0 0 100%)", opacity: 1 }, blur: { opacity: 0, filter: "blur(14px)", scale: 1.05 }, rise: { yPercent: 100, opacity: 1 } }[kind] || { opacity: 0 };
          var outTo = { slideL: { xPercent: -30 }, slideR: { xPercent: 30 }, rise: { yPercent: -25 } }[kind] || {};
          gsap.set(b, Object.assign({ xPercent: 0, yPercent: 0, scale: 1, filter: "blur(0px)", clipPath: "inset(0 0 0 0%)", zIndex: 2 }, from));
          gsap.set(a, { zIndex: 1 });
          b.classList.add("on");
          gsap.to(b, { opacity: 1, xPercent: 0, yPercent: 0, scale: 1, filter: "blur(0px)", clipPath: "inset(0 0 0 0%)", duration: 1.4, ease: "power3.inOut" });
          gsap.to(a, Object.assign({ duration: 1.4, ease: "power3.inOut", onComplete: function () { a.classList.toggle("on", false); gsap.set(a, { opacity: 0, xPercent: 0, yPercent: 0, zIndex: 0 }); } }, outTo));
        }
        slideTimers[n] = setTimeout(next, 4200);
      }
      slideTimers[n] = setTimeout(next, 3000 + n * 700);
    });
  }

  /* ================= Textes ================= */
  function applyTexts() {
    document.documentElement.lang = lang;
    document.title = T.meta.title;
    var md = $('meta[name="description"]'); if (md) md.setAttribute("content", T.meta.desc);
    $$("[data-i18n]").forEach(function (e) { var v = tr(e.getAttribute("data-i18n")); if (v != null) e.innerHTML = v; });
    $$("[data-i18n-ph]").forEach(function (e) { e.placeholder = tr(e.getAttribute("data-i18n-ph")); });
    $$("[data-i18n-aria]").forEach(function (e) { e.setAttribute("aria-label", tr(e.getAttribute("data-i18n-aria"))); });
    $$("[data-i18n-alt]").forEach(function (e) { e.alt = tr(e.getAttribute("data-i18n-alt")); });
    $$("[data-wa]").forEach(function (a) { a.href = wa(T.wa[a.getAttribute("data-wa")]); });
    $$(".js-phone").forEach(function (e) { e.textContent = PHONE_DISPLAY; });
    $$(".js-lang").forEach(function (s) { s.value = lang; });
  }

  function renderLists() {
    var mq = function (items) { var one = items.map(function (t, i) { return '<span class="mq-item' + (i % 2 ? " o" : "") + '">' + esc(t) + ICON_DIAMOND + "</span>"; }).join(""); return one + one + one; };
    $("#mq1").innerHTML = mq(T.mq1); $("#mq2").innerHTML = mq(T.mq2);
    $("#trackMarks").innerHTML = T.hero.marks.map(function (m, i) { return '<span data-leg="' + i + '">' + esc(m) + "</span>"; }).join("");
    var words = T.man.text.split(/\s+/);
    $("#manifesto").innerHTML = words.map(function (w, i) { var hl = i > words.length * 0.42 && T.man.hl.indexOf(w) >= 0; return '<span class="w' + (hl ? " hl" : "") + '">' + esc(w) + "</span>"; }).join(" ");
    $("#journeyTrack").innerHTML = T.jr.steps.map(function (s, i) {
      var pay = i === 3 || i === 6;
      return '<article class="step' + (pay ? " pay" : "") + '">' + (pay ? '<span class="pay-tag label">' + T.jr.payTag + "</span>" : "") + '<div class="step-n">' + String(i + 1).padStart(2, "0") + '</div><h3 class="h3">' + esc(s[0]) + "</h3><p>" + esc(s[1]) + '</p><span class="proof label">' + ICON_CHECK + esc(s[2]) + "</span></article>";
    }).join("");
    $("#checks").innerHTML = T.dos.items.map(function (t) { return '<li><span class="ck">' + ICON_CHECK + "</span>" + esc(t) + '<span class="st">' + T.dos.wait + "</span></li>"; }).join("");
    $("#dsteps").innerHTML = T.dos.steps.map(function (s, i) { return '<div class="d-step" data-check="' + i + '"><span class="label">' + esc(s[0]) + '</span><h3 class="h3">' + esc(s[1]) + "</h3><p>" + esc(s[2]) + "</p></div>"; }).join("");
    $("#flowMobile").innerHTML = T.mo.mob.map(function (m, i) { return '<div' + (i === 2 ? ' class="bad"' : "") + "><b>" + esc(m[0]) + "</b><span>" + esc(m[1]) + "</span></div>"; }).join("");
    buildPhone(); fillPriceCars();
    $("#flowPoints").innerHTML = T.mo.pts.map(function (p) { return '<div class="rv"><h3 class="h3">' + esc(p[0]) + "</h3><p>" + esc(p[1]) + "</p></div>"; }).join("");
    $("#checks6").innerHTML = T.ve.checks.map(function (c, i) { return '<div class="c6 rv"><div class="n">' + String(i + 1).padStart(2, "0") + '</div><h3 class="h3">' + esc(c[0]) + "</h3><p>" + esc(c[1]) + "</p></div>"; }).join("");
    $("#scamList").innerHTML = T.ve.scam.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    $("#countries").innerHTML = T.co.list.map(function (c) { return '<div class="ctry rv"><div class="ctry-name"><small>' + c[0] + "</small>" + esc(c[1]) + '</div><div class="ctry-v"><span class="label">' + T.co.age + "</span>" + esc(c[2]) + '</div><div class="ctry-v"><span class="label">' + T.co.port + "</span>" + esc(c[3]) + '</div><div class="ctry-v"><span class="label">' + T.co.delay + "</span>" + esc(c[4]) + "</div></div>"; }).join("");
    $("#countrySel").innerHTML = T.cu.opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("");
    $("#faqList").innerHTML = T.fq.list.map(function (q) { return '<div class="qa"><button class="qa-q" aria-expanded="false">' + esc(q[0]) + '<span class="qa-ico"></span></button><div class="qa-a"><p>' + esc(q[1]) + "</p></div></div>"; }).join("");
    $$(".qa").forEach(function (qa) {
      var btn = $(".qa-q", qa), ans = $(".qa-a", qa);
      btn.addEventListener("click", function () {
        var open = !qa.classList.contains("open");
        qa.classList.toggle("open", open); btn.setAttribute("aria-expanded", open);
        if (HAS_GSAP) gsap.to(ans, { height: open ? "auto" : 0, duration: 0.6, ease: "expo.out", onComplete: function () { ScrollTrigger.refresh(); } });
        else ans.style.height = open ? "auto" : "0";
      });
    });
    var counts = cars.reduce(function (m, c) { m[c.type] = (m[c.type] || 0) + 1; return m; }, {});
    $("#filters").innerHTML = Object.keys(T.arr.types).filter(function (k) { return k === "all" || counts[k]; }).map(function (k) { return '<button class="chip' + (k === filter ? " on" : "") + '" data-f="' + k + '">' + T.arr.types[k] + "<sup>" + (k === "all" ? cars.length : counts[k]) + "</sup></button>"; }).join("");
    $$("#filters .chip").forEach(function (b) { b.addEventListener("click", function () { setFilter(b.getAttribute("data-f")); }); });
    $("#cars").innerHTML = cars.map(carCard).join("");
    $$("#cars .car").forEach(function (b) { b.addEventListener("click", function () { openCar(+b.getAttribute("data-i")); }); });
    startSlideshows();
  }

  function renderPrices() {
    $$("[data-usd]").forEach(function (e) { if (!e.hasAttribute("data-anim") || e.dataset.done) e.textContent = money(+e.getAttribute("data-usd")); });
    $$("[data-usd-range]").forEach(function (e) { var r = e.getAttribute("data-usd-range").split(","); e.textContent = money(+r[0]) + " – " + money(+r[1]); });
    var d = RATES.date ? new Date(RATES.date) : null;
    $("#ratesNote").textContent = d && !isNaN(d) ? T.ui.rates + " " + d.toLocaleDateString(LOCALE[lang]) : "";
  }

  /* ================= Devises ================= */
  function fillCurrencies() {
    var dn = null; try { dn = new Intl.DisplayNames([LOCALE[lang]], { type: "currency" }); } catch (e) {}
    var name = function (c) { try { return dn ? dn.of(c) : c; } catch (e) { return c; } };
    var codes = Object.keys(RATES.rates).filter(function (c) { return MAIN_CUR.indexOf(c) < 0; }).sort(function (a, b) { return name(a).localeCompare(name(b), LOCALE[lang]); });
    var html = '<optgroup label="' + esc(T.ui.main) + '">' + MAIN_CUR.filter(function (c) { return RATES.rates[c]; }).map(function (c) { return '<option value="' + c + '">' + c + "</option>"; }).join("") + "</optgroup>" +
      '<optgroup label="' + esc(T.ui.all) + '">' + codes.map(function (c) { return '<option value="' + c + '">' + c + " · " + esc(name(c)) + "</option>"; }).join("") + "</optgroup>";
    $$(".js-cur").forEach(function (s) { s.innerHTML = html; s.value = cur; });
  }
  $$(".js-cur").forEach(function (s) {
    s.addEventListener("change", function () {
      cur = s.value; store.set("kba-cur", cur);
      $$(".js-cur").forEach(function (o) { o.value = cur; });
      renderPrices();
      $$("#cars .car").forEach(function (b, i) { var st = $(".car-price strong", b); if (st) st.textContent = priceTxt(cars[i]); });
      if (current !== null) openCar(current, true);
    });
  });

  /* ================= Thème ================= */
  function setTheme(t) {
    document.documentElement.setAttribute("data-theme", t); store.set("kba-theme", t);
    var m = $('meta[name="theme-color"]'); if (m) m.setAttribute("content", t === "light" ? "#ffffff" : "#050b16");
    readMapColors();
  }
  $$(".js-theme").forEach(function (b) { b.addEventListener("click", function () { setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light"); }); });

  /* ================= Filtres et fiche voiture ================= */
  function setFilter(f) {
    filter = f;
    $$("#filters .chip").forEach(function (x) { x.classList.toggle("on", x.getAttribute("data-f") === f); });
    var cards = $$("#cars .car");
    var show = cards.filter(function (c) { return f === "all" || c.getAttribute("data-type") === f; });
    if (!HAS_GSAP) { cards.forEach(function (c) { c.style.display = show.indexOf(c) >= 0 ? "" : "none"; }); return; }
    gsap.to(cards, { opacity: 0, y: 16, duration: 0.25, ease: "power2.in", onComplete: function () {
      cards.forEach(function (c) { c.style.display = show.indexOf(c) >= 0 ? "" : "none"; });
      gsap.fromTo(show, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "expo.out" });
      ScrollTrigger.refresh();
    } });
  }

  var drawer = $("#drawer"), panel = $("#drawerPanel"), bg = $("#drawerBg"), lenis = null, gi = 0, current = null;
  if (HAS_GSAP) gsap.set(panel, { xPercent: 100 });
  function gallery(c) {
    if (!c.photos.length) return '<div class="dw-gal">' + poster(c, true) + "</div>";
    return '<div class="dw-gal"><img id="dwImg" src="' + IMG + c.photos[gi] + '" alt="' + esc(c.brand + " " + c.model) + '"><button class="dw-nav p" data-d="-1" aria-label="' + T.ui.prev + '">‹</button><button class="dw-nav n" data-d="1" aria-label="' + T.ui.next + '">›</button><span class="dw-count label" id="dwCount">' + (gi + 1) + " / " + c.photos.length + "</span></div>" +
      '<div class="dw-thumbs">' + c.photos.map(function (p, k) { return '<button data-k="' + k + '" class="' + (k === gi ? "on" : "") + '" aria-label="' + T.dw.photo + " " + (k + 1) + '"><img src="' + IMG + p + '" alt=""></button>'; }).join("") + "</div>";
  }
  function setPhoto(k) {
    var c = cars[current]; if (!c || !c.photos.length) return;
    gi = (k + c.photos.length) % c.photos.length;
    var img = $("#dwImg");
    if (HAS_GSAP) gsap.fromTo(img, { opacity: 0.2, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
    img.src = IMG + c.photos[gi];
    $("#dwCount").textContent = gi + 1 + " / " + c.photos.length;
    $$(".dw-thumbs button").forEach(function (b, n) { b.classList.toggle("on", n === gi); });
  }
  function openCar(i, refresh) {
    var c = cars[i]; if (!refresh) gi = 0; current = i;
    var t = total(c), half = c.price ? Math.round(c.price[0] / 2) : 0, name = c.brand + " " + c.model + " " + c.year, txt = carTxt(c);
    $("#dwRef").textContent = c.ref + " · " + T.arr.status[c.status];
    $("#drawerBody").innerHTML = gallery(c) +
      '<h3 class="display dw-title">' + esc(c.brand) + "<br>" + esc(c.model) + "</h3>" +
      '<div class="dw-sub">' + esc(c.version) + " · " + c.year + " · " + kmFmt(c.km) + " · " + T.arr.fuel[c.fuel] + " · " + T.arr.box[c.box] + "</div>" +
      (c.price ? '<div class="dw-price"><div class="dw-price-top"><span class="label" style="color:#6b7789">' + T.dw.priceTitle + "</span><strong>" + money(t) + "</strong></div>" +
      '<div class="dw-rows"><div><span>' + T.dw.car + "</span><span>" + money(c.price[0]) + "</span></div><div><span>" + T.dw.ship + "</span><span>" + money(c.price[1]) + "</span></div><div><span>" + T.dw.ins + "</span><span>" + money(c.price[2]) + '</span></div><div class="sep"><span>' + T.dw.cus + "</span><span>" + (c.customs ? money(c.customs[0]) + " – " + money(c.customs[1]) : T.dw.cusQuote) + "</span></div></div>" +
      '<div class="dw-pay"><b>' + T.dw.payTitle + "</b><br>" + T.dw.pay1.replace("{a}", money(half)) + "<br>" + T.dw.pay2.replace("{b}", money(t - half)) + "<br>" + T.dw.pay3 + "</div></div>" : '<div class="dw-price"><div class="dw-price-top"><span class="label" style="color:#6b7789">' + T.dw.priceTitle + '</span><strong style="font-size:32px">' + T.arr.onRequest + '</strong><span style="color:#6b7789;font-size:14px">' + T.dw.priceSoon + '</span></div></div>') +
      (c.videos ? '<div class="dw-h label">' + T.dw.videos + '</div><div class="dw-videos">' + c.videos.map(function (v) { return '<video controls playsinline preload="none" poster="' + IMG + v + '.jpg" src="' + IMG + v + '.mp4"></video>'; }).join("") + "</div>" : "") +
      '<div class="dw-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa(T.wa.reserve.replace("{car}", name).replace("{ref}", c.ref)) + '">' + T.dw.reserve + "</a>" +
      '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + wa(T.wa.video.replace("{car}", name).replace("{ref}", c.ref)) + '">' + T.dw.video + "</a></div>" +
      '<div class="dw-grid"><div><span>' + T.dw.engine + "</span>" + (c.engine ? esc(c.engine) : T.arr.fuel[c.fuel] + " · " + T.dw.tbc) + "</div><div><span>" + T.dw.seats + "</span>" + c.seats + "</div><div><span>" + T.dw.box + "</span>" + T.arr.box[c.box] + "</div><div><span>" + T.dw.wheel + "</span>" + T.dw.left + "</div></div>" +
      '<div class="dw-h label">' + T.dw.equip + '</div><ul class="dw-list">' + txt[0].map(function (e) { return "<li>✓ " + esc(e) + "</li>"; }).join("") + "</ul>" +
      '<div class="dw-h label">' + T.dw.defects + '</div><ul class="dw-list">' + txt[1].map(function (e) { return '<li><span style="color:var(--amber)">▲</span> ' + esc(e) + "</li>"; }).join("") + "</ul>" +
      (txt[2] ? '<div class="dw-note" style="box-shadow:0 0 0 1.5px #e6a23c"><b style="color:#b26b00">⚠ </b>' + esc(txt[2]) + "</div>" : "") +
      '<div class="dw-note">' + (c.real ? T.dw.noteReal : T.dw.note) + "</div>";
    $$(".dw-nav").forEach(function (b) { b.addEventListener("click", function () { setPhoto(gi + +b.getAttribute("data-d")); }); });
    $$(".dw-thumbs button").forEach(function (b) { b.addEventListener("click", function () { setPhoto(+b.getAttribute("data-k")); }); });
    if (refresh) return;
    drawer.style.visibility = "visible"; drawer.setAttribute("aria-hidden", "false"); panel.scrollTop = 0;
    if (lenis) lenis.stop();
    if (HAS_GSAP) {
      gsap.to(bg, { opacity: 1, duration: 0.5 });
      gsap.fromTo(panel, { xPercent: 100, x: 0 }, { xPercent: 0, x: 0, duration: 0.8, ease: "expo.out" });
      gsap.from("#drawerBody > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.04, ease: "expo.out", delay: 0.15 });
    } else { bg.style.opacity = 1; panel.style.transform = "none"; }
    $("#drawerX").focus();
  }
  function closeCar() {
    var done = function () { drawer.style.visibility = "hidden"; drawer.setAttribute("aria-hidden", "true"); current = null; if (lenis) lenis.start(); };
    if (HAS_GSAP) { gsap.to(bg, { opacity: 0, duration: 0.4 }); gsap.to(panel, { xPercent: 100, x: 0, duration: 0.6, ease: "expo.in", onComplete: done }); } else done();
  }
  $("#drawerX").addEventListener("click", closeCar);
  bg.addEventListener("click", closeCar);
  document.addEventListener("keydown", function (e) {
    if (current === null) return;
    if (e.key === "Escape") closeCar();
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") setPhoto(gi + (e.key === "ArrowRight" ? 1 : -1));
  });

  /* ================= Formulaire sur mesure ================= */
  $("#findForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, v = function (n) { return (f.elements[n].value || "").trim(); };
    var msg = [T.wa.form, "• " + (v("brand") + " " + v("model")).trim(), v("year") && "• " + T.wa.formYear + " : " + v("year"), v("budget") && "• " + T.wa.formBudget + " : " + v("budget"), "• " + T.wa.formTo + " : " + v("country"), T.wa.formName + " : " + v("name")].filter(Boolean).join("\n");
    $("#formLink").href = wa(msg);
    var out = $("#formOut"); out.classList.add("on");
    if (HAS_GSAP) gsap.from(out, { y: 16, opacity: 0, duration: 0.6, ease: "expo.out" });
  });

  /* ================= Carte : points + route du navire ================= */
  var M = window.KBA_MAP, canvas = $("#mapDots"), ctx = canvas.getContext("2d"), svg = $("#mapSvg");
  var origin = M.ports.incheon, maxD = 1450, dotRGB = "80,118,178", hotRGB = "141,178,255";
  function readMapColors() {
    var cs = getComputedStyle(document.documentElement);
    dotRGB = cs.getPropertyValue("--map-dot").trim() || dotRGB; hotRGB = cs.getPropertyValue("--map-hot").trim() || hotRGB;
  }
  readMapColors();
  var dots = M.dots.map(function (p) { var dx = p[0] - origin[0], dy = p[1] - origin[1]; return [p[0], p[1], Math.sqrt(dx * dx + dy * dy), Math.random()]; });
  var mapState = { wave: HAS_GSAP ? 0 : 1, t: 0 };
  function drawDots() {
    ctx.clearRect(0, 0, 1600, 860);
    var r = mapState.wave * maxD;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i], k = r - d[2];
      if (k < 0) continue;
      var fresh = k < 90 ? 1 - k / 90 : 0, tw = 0.55 + 0.45 * Math.sin(mapState.t * 1.4 + d[3] * 12);
      ctx.fillStyle = fresh > 0 ? "rgba(" + hotRGB + "," + (0.35 + fresh * 0.65) + ")" : "rgba(" + dotRGB + "," + (0.42 + tw * 0.25) + ")";
      ctx.beginPath(); ctx.arc(d[0], d[1], 1.9 + fresh * 1.2, 0, 6.283); ctx.fill();
    }
  }
  var NS = "http://www.w3.org/2000/svg";
  var el = function (tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); (parent || svg).appendChild(e); return e; };
  var defs = el("defs", {});
  var grad = el("linearGradient", { id: "rg", x1: "1", y1: "0", x2: "0", y2: "1" }, defs);
  el("stop", { offset: "0", "stop-color": "#8db2ff" }, grad); el("stop", { offset: "1", "stop-color": "#3d7bff" }, grad);
  var glow = el("filter", { id: "glow", x: "-50%", y: "-50%", width: "200%", height: "200%" }, defs);
  el("feGaussianBlur", { stdDeviation: "6" }, glow);
  el("path", { d: M.route, fill: "none", stroke: "rgba(61,123,255,.28)", "stroke-width": "1.5", "stroke-dasharray": "2 7" });
  var routeGlow = el("path", { d: M.route, fill: "none", stroke: "#3d7bff", "stroke-width": "6", opacity: ".35", filter: "url(#glow)" });
  var route = el("path", { d: M.route, fill: "none", stroke: "url(#rg)", "stroke-width": "2.4", "stroke-linecap": "round" });
  var L = route.getTotalLength();
  [route, routeGlow].forEach(function (p) { p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  var portsDef = [["incheon", 14, -14, "start", false], ["singapour", 12, 22, "start", true], ["cap", 14, 20, "start", true], ["conakry", -14, -12, "end", false], ["dakar", -12, -6, "end", true], ["abidjan", 6, 22, "middle", true], ["cotonou", 12, -8, "start", true]];
  var portTexts = {};
  var portEls = portsDef.map(function (p) {
    var xy = M.ports[p[0]], g = el("g", { opacity: HAS_GSAP ? 0 : 1 });
    if (!p[4]) el("circle", { cx: xy[0], cy: xy[1], r: 14, fill: "rgba(61,123,255,.18)" }, g);
    el("circle", { cx: xy[0], cy: xy[1], r: p[4] ? 3.2 : 5, class: "port-dot" }, g);
    portTexts[p[0]] = el("text", { x: xy[0] + p[1], y: xy[1] + p[2], "text-anchor": p[3], class: "port-tag" + (p[4] ? " dim" : "") }, g);
    return g;
  });
  var ship = el("g", { opacity: 0 });
  el("circle", { r: 18, fill: "rgba(61,123,255,.22)" }, ship);
  el("circle", { r: 7, class: "port-dot" }, ship);
  el("circle", { r: 3, fill: "#3d7bff" }, ship);
  var legAt = [0, 0.12, 0.24, 0.34, 0.52, 0.66, 0.84, 0.985], markAt = [0, 0.24, 0.66, 0.985], shipP = 0;
  function setShip(p) {
    shipP = p;
    var pt = route.getPointAtLength(L * p);
    ship.setAttribute("transform", "translate(" + pt.x + "," + pt.y + ")");
    route.style.strokeDashoffset = L * (1 - p); routeGlow.style.strokeDashoffset = L * (1 - p);
    $("#trackDay").textContent = T.hero.dayPrefix + String(Math.round(p * 38)).padStart(2, "0");
    $("#trackBar").style.transform = "scaleX(" + p + ")";
    var li = 0; legAt.forEach(function (a, i) { if (p >= a) li = i; });
    var leg = T.hero.legs[li], lt = $("#trackLeg"); if (lt.textContent !== leg) lt.textContent = leg;
    $$("#trackMarks span").forEach(function (s, i) { s.classList.toggle("on", p >= markAt[i]); });
  }
  function portLabels() { Object.keys(portTexts).forEach(function (k) { portTexts[k].textContent = T.hero.ports[k]; }); }

  /* ================= Premier rendu ================= */
  applyTexts(); fillCurrencies(); renderLists(); renderPrices(); portLabels(); setShip(HAS_GSAP ? 0 : 1); drawDots();
  onView($("#stats"), function () { $("#stats").classList.add("on"); });
  onView($("#donut"), showDonut);

  /* ================= Changement de langue ================= */
  function setLang(l) {
    if (!I18N[l] || l === lang) return;
    lang = l; T = I18N[l]; store.set("kba-lang", l);
    applyTexts(); fillCurrencies(); renderLists(); renderPrices(); portLabels(); setShip(shipP);
    $$(".rv").forEach(function (e) { e.classList.add("in"); });
    if (HAS_GSAP) { splitAll(); bindManifesto(); bindDossier(); buildCarousel(); ScrollTrigger.refresh(); }
    else $$("#manifesto .w").forEach(function (e) { e.style.opacity = 1; });
    if (current !== null) openCar(current, true);
  }
  $$(".js-lang").forEach(function (s) { s.addEventListener("change", function () { setLang(s.value); }); });

  /* ================= Sans animations : tout visible ================= */
  var loader = $("#loader");
  if (!HAS_GSAP) {
    loader.style.display = "none"; document.body.classList.remove("is-loading");
    $$(".rv").forEach(function (e) { e.classList.add("in"); });
    $$("#manifesto .w").forEach(function (e) { e.style.opacity = 1; });
    $$(".d-step").forEach(function (e) { e.classList.add("on"); });
    $$("#checks li").forEach(function (e) { e.classList.add("on"); });
    $("#fab").style.transform = "scale(1)";
    $$("[data-anim]").forEach(function (e) { e.dataset.done = 1; }); renderPrices();
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Défilement fluide ---------- */
  lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]'); if (!a) return;
    var id = a.getAttribute("href"), t = id === "#top" ? 0 : $(id);
    if (t === null) return; e.preventDefault(); closeMenu(); lenis.scrollTo(t, { offset: id === "#top" ? 0 : -10, duration: 1.6 });
  });

  /* ---------- Titres : mots qui montent ---------- */
  function splitWords(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [], inners = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
        var o = document.createElement("span"); o.className = "mask"; o.style.display = "inline-block"; o.style.verticalAlign = "top";
        var i = document.createElement("span"); i.textContent = w; o.appendChild(i); frag.appendChild(o); inners.push(i);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return inners;
  }
  function splitAll() { $$("[data-split]").forEach(function (h) { var w = splitWords(h); gsap.set(w, { yPercent: h.dataset.shown ? 0 : 115 }); }); }
  splitAll();
  $$("[data-split]").forEach(function (h) {
    ScrollTrigger.create({ trigger: h, start: "top 88%", once: true, onEnter: function () { h.dataset.shown = 1; gsap.to($$(".mask > span", h), { yPercent: 0, duration: 1.1, stagger: 0.04, ease: "expo.out" }); } });
  });

  /* ---------- Manifeste : mots éclairés ---------- */
  var manTween = null;
  function bindManifesto() {
    if (manTween) { if (manTween.scrollTrigger) manTween.scrollTrigger.kill(); manTween.kill(); }
    manTween = gsap.to("#manifesto .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: "#manifesto", start: "top 80%", end: "bottom 50%", scrub: 0.6 } });
  }
  bindManifesto();

  /* ---------- Apparitions ---------- */
  ScrollTrigger.batch(".rv", { start: "top 90%", once: true, onEnter: function (b) { gsap.fromTo(b, { opacity: 0, y: 36 }, { opacity: 1, y: 0, duration: 1, stagger: 0.07, ease: "expo.out", overwrite: true, onComplete: function () { b.forEach(function (x) { x.classList.add("in"); gsap.set(x, { clearProps: "transform,opacity" }); }); } }); } });

  /* ---------- Compteurs ---------- */
  $$("[data-count]").forEach(function (e) {
    var to = +e.getAttribute("data-count"), o = { v: 0 };
    ScrollTrigger.create({ trigger: e, start: "top 92%", once: true, onEnter: function () { gsap.to(o, { v: to, duration: 1.2, ease: "expo.out", onUpdate: function () { e.textContent = Math.round(o.v); } }); } });
  });
  $$("[data-anim]").forEach(function (e) {
    var to = +e.getAttribute("data-usd"), o = { v: 0 }; e.textContent = money(0);
    ScrollTrigger.create({ trigger: e, start: "top 92%", once: true, onEnter: function () { gsap.to(o, { v: to, duration: 1.8, ease: "expo.out", onUpdate: function () { if (!e.dataset.done) e.textContent = money(o.v); }, onComplete: function () { e.dataset.done = 1; e.textContent = money(+e.getAttribute("data-usd")); } }); } });
  });

  /* ---------- Bandeaux défilants ---------- */
  $$(".mq-row").forEach(function (row) {
    var dir = +row.getAttribute("data-dir"), x = 0;
    gsap.ticker.add(function () {
      var w = row.scrollWidth / 3; if (!w) return;
      var v = lenis.velocity || 0;
      x += dir * (0.7 + Math.min(Math.abs(v) * 0.35, 9));
      if (x <= -w) x += w; if (x > 0) x -= w;
      row.style.transform = "translate3d(" + x + "px,0,0) skewX(" + gsap.utils.clamp(-8, 8, -v * 0.35 * dir) + "deg)";
    });
  });

  /* ---------- En-tête, progression, bouton flottant ---------- */
  var hdr = $("#hdr"), lastY = 0;
  lenis.on("scroll", function (e) {
    var y = e.scroll;
    hdr.classList.toggle("is-solid", y > 60);
    hdr.classList.toggle("is-hidden", y > lastY && y > 600 && !document.body.classList.contains("menu-open"));
    lastY = y;
    $("#progress").style.transform = "scaleX(" + (e.progress || 0) + ")";
  });
  ScrollTrigger.create({ trigger: "#hero", start: "bottom 80%", onEnter: function () { gsap.to("#fab", { scale: 1, duration: 0.6, ease: "back.out(2)" }); }, onLeaveBack: function () { gsap.to("#fab", { scale: 0, duration: 0.3 }); } });

  /* ---------- Menu mobile ---------- */
  var menu = $("#menu");
  function openMenu() { document.body.classList.add("menu-open"); menu.style.visibility = "visible"; lenis.stop(); gsap.to(menu, { clipPath: "inset(0 0 0% 0)", duration: 0.9, ease: "expo.inOut" }); gsap.fromTo("#menu .m-link", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.05, duration: 0.9, ease: "expo.out", delay: 0.35 }); }
  function closeMenu() { if (!document.body.classList.contains("menu-open")) return; document.body.classList.remove("menu-open"); lenis.start(); gsap.to(menu, { clipPath: "inset(0 0 100% 0)", duration: 0.7, ease: "expo.inOut", onComplete: function () { menu.style.visibility = "hidden"; } }); }
  $("#burger").addEventListener("click", openMenu);
  $("#menuClose").addEventListener("click", closeMenu);

  /* ---------- Parcours : carrousel automatique (n'utilise pas le défilement) ---------- */
  var jr = { i: 0, timer: null, inView: false, hover: false, step: 0, max: 0, rs: null };
  var vp = $("#jrViewport"), track = $("#journeyTrack");
  function buildCarousel() {
    var steps = $$(".step", track); if (!steps.length) return;
    var gap = 20, padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    jr.step = steps[0].offsetWidth + gap;
    var visible = Math.max(1, Math.floor((vp.clientWidth - padL * 2 + gap) / jr.step));
    jr.max = Math.max(0, steps.length - visible);
    $("#jrDots").innerHTML = Array.from({ length: jr.max + 1 }, function (_, k) { return '<button aria-label="' + (k + 1) + '"><i></i></button>'; }).join("");
    $$("#jrDots button").forEach(function (b, k) { b.addEventListener("click", function () { goStep(k, true); }); });
    goStep(Math.min(jr.i, jr.max), false, true);
  }
  function goStep(k, user, instant) {
    if (k > jr.max) k = 0; if (k < 0) k = jr.max;
    jr.i = k;
    gsap.to(track, { x: -k * jr.step, duration: instant ? 0 : 1.1, ease: "expo.inOut" });
    $$(".step", track).forEach(function (s, n) { s.classList.toggle("cur", n === k); });
    $$("#jrDots button").forEach(function (b, n) { b.classList.toggle("done", n <= k); });
    if (user) restart();
  }
  function restart() { clearInterval(jr.timer); jr.timer = setInterval(function () { if (jr.inView && !jr.hover && !document.hidden && current === null) goStep(jr.i + 1); }, 3200); }
  $("#jrPrev").addEventListener("click", function () { goStep(jr.i - 1, true); });
  $("#jrNext").addEventListener("click", function () { goStep(jr.i + 1, true); });
  vp.addEventListener("mouseenter", function () { jr.hover = true; });
  vp.addEventListener("mouseleave", function () { jr.hover = false; });
  var sx = null;
  vp.addEventListener("pointerdown", function (e) { sx = e.clientX; });
  vp.addEventListener("pointerup", function (e) { if (sx === null) return; var dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) goStep(jr.i + (dx < 0 ? 1 : -1), true); });
  ScrollTrigger.create({ trigger: "#parcours", start: "top 75%", end: "bottom 25%", onToggle: function (s) { jr.inView = s.isActive; } });
  buildCarousel(); restart();
  window.addEventListener("resize", function () { clearTimeout(jr.rs); jr.rs = setTimeout(buildCarousel, 200); });

  /* ---------- Dossier : les vérifications se cochent ---------- */
  var dosTriggers = [];
  function bindDossier() {
    dosTriggers.forEach(function (t) { t.kill(); }); dosTriggers = [];
    var checks = $$("#checks li");
    $$(".d-step").forEach(function (s, i) {
      dosTriggers.push(ScrollTrigger.create({ trigger: s, start: "top 65%", end: "bottom 40%",
        onToggle: function (self) { s.classList.toggle("on", self.isActive); },
        onEnter: function () { for (var k = 0; k <= i; k++) { checks[k].classList.add("on"); checks[k].querySelector(".st").textContent = T.dos.done; } },
        onLeaveBack: function () { checks[i].classList.remove("on"); checks[i].querySelector(".st").textContent = T.dos.wait; } }));
    });
  }
  bindDossier();
  gsap.to("#filePhoto", { scale: 1, ease: "none", scrollTrigger: { trigger: "#dossier", start: "top bottom", end: "bottom top", scrub: true } });


  /* ---------- Argent : le flux se dessine ---------- */
  ["#l1", "#l2"].forEach(function (id) { var p = $(id), l = p.getTotalLength(); gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); });
  gsap.set(["#flow .node", "#lab1", "#lab2"], { opacity: 0, y: 20 });
  gsap.timeline({ scrollTrigger: { trigger: "#flow", start: "top 75%", once: true } })
    .to("#flow .node.me", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" })
    .to("#l1", { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "-=0.2")
    .to("#lab1", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
    .to("#flow .node.kba", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "-=0.2")
    .to("#l2", { strokeDashoffset: 0, duration: 0.8, ease: "power2.inOut" }, "-=0.1")
    .to("#lab2", { opacity: 1, y: 0, duration: 0.5 }, "-=0.4")
    .to("#flow .node.tr", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "-=0.2")
    .to("#bad", { opacity: 1, y: 0, duration: 0.6, ease: "back.out(1.7)" }, "+=0.2");

  /* ---------- Parallaxes ---------- */
  gsap.to("#heroMap", { yPercent: -16, scale: 1.06, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-content", { y: -100, opacity: 0.2, ease: "none", scrollTrigger: { trigger: "#hero", start: "center center", end: "bottom top", scrub: true } });
  gsap.from(".mega", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* ---------- Préchargement puis entrée du héros ---------- */
  var lp = $$("#loaderSvg path"), counter = { v: 0 };
  gsap.set(".hero-title .mask > span", { yPercent: 115 });
  gsap.set("[data-hero-in]", { opacity: 0, y: 30 });
  var intro = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (lp.length === 4) {
    gsap.set(lp[1], { clipPath: "inset(0 100% 0 0)" }); gsap.set(lp[2], { opacity: 0 });
    gsap.set([lp[0], lp[3]], { opacity: 0, scale: 0.6, transformOrigin: "50% 50%" });
    intro.to(lp[1], { clipPath: "inset(0 0% 0 0)", duration: 1.1, ease: "power4.inOut" }, 0.1)
      .to(lp[2], { opacity: 1, duration: 0.3 }, 0.9)
      .to([lp[0], lp[3]], { opacity: 1, scale: 1, duration: 1.1, stagger: 0.08 }, 0.55);
  }
  intro.to(counter, { v: 100, duration: 1.7, ease: "power2.inOut", onUpdate: function () { $("#loaderCount").textContent = String(Math.round(counter.v)).padStart(2, "0"); } }, 0)
    .to("#loaderBar", { scaleX: 1, duration: 1.7, ease: "power2.inOut" }, 0)
    .to(".loader-logo", { scale: 0.9, opacity: 0, duration: 0.6, ease: "power3.in" }, 1.85)
    .to(loader, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, 2.1)
    .add(function () { document.body.classList.remove("is-loading"); lenis.start(); loader.style.pointerEvents = "none"; }, 2.5)
    .to(".hero-title .mask > span", { yPercent: 0, duration: 1.4, stagger: 0.1 }, 2.45)
    .to("[data-hero-in]", { opacity: 1, y: 0, duration: 1.2, stagger: 0.08 }, 2.75)
    .to(mapState, { wave: 1, duration: 3.2, ease: "power2.out" }, 2.3)
    .to(portEls, { opacity: 1, duration: 0.6, stagger: 0.12 }, 3.1)
    .to(ship, { opacity: 1, duration: 0.4 }, 3.3)
    .add(function () {
      var o = { p: 0 };
      gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
        .fromTo(o, { p: 0 }, { p: 1, duration: 11, ease: "sine.inOut", onUpdate: function () { setShip(o.p); } })
        .to(ship, { opacity: 0, duration: 0.6 }, "+=0.4")
        .set(ship, { opacity: 1 });
    }, 3.3);

  gsap.ticker.add(function (t) { mapState.t = t; drawDots(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); buildCarousel(); });
})();
