/* KBA · variante 2 — moteur d'animation et d'interface.
   GSAP + ScrollTrigger pour le motion design, Lenis pour le défilement fluide. */
(function () {
  "use strict";

  var WA_NUMBER = "224000000000"; // TODO : numéro WhatsApp Business définitif
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fmt = function (n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); };
  var wa = function (msg) { return "https://wa.me/" + WA_NUMBER + "?text=" + encodeURIComponent(msg); };
  var GNF = 8650;

  /* ---------- Liens WhatsApp ---------- */
  $$("[data-wa]").forEach(function (a) { a.href = wa(a.getAttribute("data-wa")); });

  /* ---------- Données : voitures d'exemple ---------- */
  var IMG = "assets/img/";
  var cars = [
    { ref: "KBA-0001", type: "compacte", brand: "Toyota", model: "Corolla Hatchback", version: "SE", year: 2019, km: 78400, fuel: "Essence", box: "Automatique", engine: "2.0 L · 168 ch", seats: 5, status: "dispo", price: [12900, 1450, 140], customs: [3200, 4100], photos: ["05-profil-droit.jpg", "02-arriere.jpg", "01-arriere-3-4-droit.jpg", "03-arriere-3-4-gauche.jpg", "06-avant-droit.jpg", "07-vue-dessus.jpg"], equip: ["Freinage d'urgence automatique", "Maintien dans la voie", "Régulateur adaptatif", "Écran 8 pouces, Apple CarPlay", "Caméra de recul", "Phares LED"], defects: ["Bas du pare-chocs avant à refixer", "Micro-rayures sur le hayon"] },
    { ref: "KBA-0002", type: "suv", brand: "Hyundai", model: "Tucson", version: "2.0 Modern", year: 2019, km: 82000, fuel: "Essence", box: "Automatique", engine: "2.0 L · 155 ch", seats: 5, status: "dispo", price: [13800, 1550, 150], customs: [3400, 4400], photos: [], equip: ["Caméra de recul", "Radars de stationnement", "Écran tactile", "Climatisation automatique"], defects: ["Rayure légère sur le pare-chocs arrière"] },
    { ref: "KBA-0004", type: "suv", brand: "Hyundai", model: "Santa Fe", version: "2.2 CRDi 7 places", year: 2018, km: 104000, fuel: "Diesel", box: "Automatique", engine: "2.2 L diesel · 200 ch", seats: 7, status: "dispo", price: [16900, 1650, 180], customs: [4200, 5400], photos: [], equip: ["7 places", "4 roues motrices", "Sièges cuir chauffants", "Hayon électrique"], defects: ["Éclat sur le pare-brise"] },
    { ref: "KBA-0003", type: "suv", brand: "Kia", model: "Sportage", version: "2.0 Prestige", year: 2018, km: 96500, fuel: "Essence", box: "Automatique", engine: "2.0 L · 155 ch", seats: 5, status: "res", price: [12200, 1550, 140], customs: [3000, 3900], photos: [], equip: ["Sièges en cuir", "Toit ouvrant", "Caméra de recul"], defects: ["Usure du siège conducteur"] },
    { ref: "KBA-0005", type: "berline", brand: "Hyundai", model: "Avante", version: "1.6 Smart", year: 2019, km: 71000, fuel: "Essence", box: "Automatique", engine: "1.6 L · 123 ch", seats: 5, status: "dispo", price: [9300, 1450, 110], customs: [2300, 3000], photos: [], equip: ["Idéale taxi / VTC", "Bluetooth", "Caméra de recul", "Régulateur"], defects: ["Petite bosse portière arrière gauche"] },
    { ref: "KBA-0007", type: "utilitaire", brand: "Hyundai", model: "Porter II", version: "2.5 CRDi plateau", year: 2017, km: 128000, fuel: "Diesel", box: "Manuelle", engine: "2.5 L diesel · 133 ch", seats: 3, status: "dispo", price: [9800, 1700, 120], customs: [2400, 3200], photos: [], equip: ["Charge utile ≈ 1 tonne", "Plateau ridelles", "Climatisation"], defects: ["Rouille légère sur le plateau"] },
    { ref: "KBA-0008", type: "minibus", brand: "Hyundai", model: "Grand Starex", version: "12 places", year: 2017, km: 135000, fuel: "Diesel", box: "Automatique", engine: "2.5 L diesel · 175 ch", seats: 12, status: "dispo", price: [14200, 1900, 160], customs: [3500, 4600], photos: [], equip: ["12 places", "Clim avant et arrière", "Portes coulissantes"], defects: ["Usure des sièges de 3e rangée"] },
    { ref: "KBA-0006", type: "citadine", brand: "Kia", model: "Morning", version: "1.0 Luxury", year: 2020, km: 48000, fuel: "Essence", box: "Automatique", engine: "1.0 L · 76 ch", seats: 5, status: "route", price: [6900, 1350, 90], customs: [1700, 2300], photos: [], equip: ["Très économique", "Climatisation", "Bluetooth"], defects: ["Aucun défaut visible signalé"] },
  ];
  var types = { all: "Toutes", suv: "SUV", berline: "Berlines", compacte: "Compactes", citadine: "Citadines", utilitaire: "Utilitaires", minibus: "Minibus" };
  var statusTxt = { dispo: "Disponible en Corée", res: "Réservée", route: "En route" };
  var total = function (c) { return c.price[0] + c.price[1] + c.price[2]; };

  /* Silhouettes de profil, tracées à la main (240 × 100) */
  var SIL = {
    suv: "M14 72V54c0-7 5-11 14-12l36-3 20-19c3-3 7-4 12-4h76c8 0 13 3 17 8l13 16c13 2 22 6 24 14v18",
    compacte: "M14 72V56c0-6 5-10 14-11l38-4 24-17c4-3 8-4 13-4h56c9 0 15 4 20 11l12 15c14 2 25 7 27 14v12",
    berline: "M10 72V58c0-6 6-10 16-11l46-4 26-17c4-3 9-4 14-4h44c9 0 15 3 20 9l15 14c22 2 36 6 38 14v13",
    citadine: "M30 72V56c0-7 5-11 13-12l26-3 20-18c3-3 7-4 11-4h44c8 0 13 3 17 9l11 15c11 2 17 6 18 13v16",
    utilitaire: "M10 72V24c0-6 4-9 10-9h46c6 0 9 3 10 8l4 21v28 M80 44h150v28",
    minibus: "M12 72V32c0-10 8-16 20-16h170c12 0 19 6 22 16l6 20v20",
  };
  var WHEELS = { suv: [62, 182], compacte: [60, 182], berline: [58, 190], citadine: [70, 170], utilitaire: [44, 196], minibus: [52, 192] };
  function silhouette(type) {
    var w = WHEELS[type] || [60, 182];
    var wheel = function (x) { return '<circle cx="' + x + '" cy="74" r="15" fill="none" stroke="currentColor" stroke-width="1.6"/><circle class="wheel" cx="' + x + '" cy="74" r="5" fill="currentColor"/>'; };
    return '<svg class="car-sil" viewBox="0 0 240 92" fill="none" aria-hidden="true"><path d="' + (SIL[type] || SIL.suv) + '" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 89.5h240" stroke="currentColor" stroke-opacity=".25"/>' + wheel(w[0]) + wheel(w[1]) + "</svg>";
  }

  function poster(c, big) {
    return '<div class="car-lines"></div><div class="car-year"' + (big ? ' style="font-size:200px;top:40px"' : "") + ">" + c.year + '</div><div class="car-poster"' + (big ? ' style="bottom:56px"' : "") + '><span class="label">' + c.brand + " · " + c.version + "</span><b" + (big ? ' style="font-size:56px"' : "") + ">" + c.model + '</b></div><span class="car-pending label">Photos du parc en cours de réception</span>';
  }
  function carCard(c, i) {
    var media = c.photos.length
      ? '<img src="' + IMG + c.photos[0] + '" alt="' + c.brand + " " + c.model + '" loading="lazy">'
      : poster(c);
    var cls = c.status === "res" ? " res" : c.status === "route" ? " route" : "";
    return '<button class="car rv" data-i="' + i + '" data-type="' + c.type + '" data-cursor="Ouvrir">' +
      '<div class="car-media">' + media + '<div class="car-badges"><span class="badge label' + cls + '"><i></i>' + statusTxt[c.status] + '</span><span class="badge ex label">Exemple</span></div><span class="car-view label">Dossier</span></div>' +
      '<div class="car-body"><div class="car-ref label"><span>' + c.ref + "</span><span>" + types[c.type] + "</span></div>" +
      '<div class="car-name">' + c.brand + " " + c.model + " <span>" + c.version + "</span></div>" +
      '<div class="car-spec">' + c.year + " · " + fmt(c.km) + " km · " + c.fuel + " · " + c.box + "</div>" +
      '<div class="car-price"><div><span class="label" style="color:var(--muted-dark)">Total rendu Conakry</span><strong>' + fmt(total(c)) + " $</strong><small>≈ " + fmt(Math.round(total(c) * GNF / 1e5) * 1e5) + " GNF</small></div>" +
      '<span class="car-ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>Dossier vérifié</span></div></div></button>';
  }

  var grid = $("#cars");
  grid.innerHTML = cars.map(carCard).join("");
  var counts = cars.reduce(function (m, c) { m[c.type] = (m[c.type] || 0) + 1; return m; }, {});
  $("#filters").innerHTML = Object.keys(types).filter(function (k) { return k === "all" || counts[k]; }).map(function (k) {
    return '<button class="chip' + (k === "all" ? " on" : "") + '" data-f="' + k + '">' + types[k] + "<sup>" + (k === "all" ? cars.length : counts[k]) + "</sup></button>";
  }).join("");
  $$("#filters .chip").forEach(function (b) {
    b.addEventListener("click", function () {
      $$("#filters .chip").forEach(function (x) { x.classList.toggle("on", x === b); });
      var f = b.getAttribute("data-f");
      var cards = $$("#cars .car");
      var show = cards.filter(function (c) { return f === "all" || c.getAttribute("data-type") === f; });
      if (REDUCED || !window.gsap) { cards.forEach(function (c) { c.style.display = show.indexOf(c) >= 0 ? "" : "none"; }); return; }
      gsap.to(cards, { opacity: 0, y: 16, duration: 0.25, ease: "power2.in", onComplete: function () {
        cards.forEach(function (c) { c.style.display = show.indexOf(c) >= 0 ? "" : "none"; });
        gsap.fromTo(show, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: "expo.out" });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      } });
    });
  });

  /* ---------- Fiche voiture (tiroir) ---------- */
  var drawer = $("#drawer"), panel = $("#drawerPanel"), bg = $("#drawerBg"), lenis = null, gi = 0, cur = null;
  function gallery(c) {
    if (!c.photos.length) return '<div class="dw-gal" style="position:relative">' + poster(c, true) + "</div>";
    return '<div class="dw-gal"><img id="dwImg" src="' + IMG + c.photos[0] + '" alt="' + c.brand + " " + c.model + '"><button class="dw-nav p" data-d="-1" aria-label="Photo précédente">‹</button><button class="dw-nav n" data-d="1" aria-label="Photo suivante">›</button><span class="dw-count label" id="dwCount">1 / ' + c.photos.length + '</span></div>' +
      '<div class="dw-thumbs">' + c.photos.map(function (p, k) { return '<button data-k="' + k + '" class="' + (k ? "" : "on") + '" aria-label="Photo ' + (k + 1) + '"><img src="' + IMG + p + '" alt=""></button>'; }).join("") + "</div>";
  }
  function setPhoto(k) {
    if (!cur || !cur.photos.length) return;
    gi = (k + cur.photos.length) % cur.photos.length;
    var img = $("#dwImg");
    if (window.gsap && !REDUCED) gsap.fromTo(img, { opacity: 0.2, scale: 1.04 }, { opacity: 1, scale: 1, duration: 0.6, ease: "expo.out" });
    img.src = IMG + cur.photos[gi];
    $("#dwCount").textContent = gi + 1 + " / " + cur.photos.length;
    $$(".dw-thumbs button").forEach(function (b, n) { b.classList.toggle("on", n === gi); });
  }
  function openCar(i) {
    var c = (cur = cars[i]); gi = 0;
    var t = total(c), half = Math.round(c.price[0] / 2);
    $("#dwRef").textContent = c.ref + " · " + statusTxt[c.status];
    $("#drawerBody").innerHTML = gallery(c) +
      '<h3 class="display dw-title">' + c.brand + "<br>" + c.model + "</h3>" +
      '<div class="dw-sub">' + c.version + " · " + c.year + " · " + fmt(c.km) + " km · " + c.fuel + " · " + c.box + "</div>" +
      '<div class="dw-price"><div class="dw-price-top"><span class="label" style="color:var(--muted)">Prix total rendu port de Conakry</span><strong>' + fmt(t) + ' $</strong><span style="color:var(--muted);font-size:14px">≈ ' + fmt(Math.round(t * GNF / 1e5) * 1e5) + " GNF</span></div>" +
      '<div class="dw-rows"><div><span>Voiture, en Corée</span><span>' + fmt(c.price[0]) + " $</span></div><div><span>Transport maritime</span><span>" + fmt(c.price[1]) + " $</span></div><div><span>Assurance transport</span><span>" + fmt(c.price[2]) + ' $</span></div><div class="sep"><span>Douane + port (estimation)</span><span>' + fmt(c.customs[0]) + " – " + fmt(c.customs[1]) + " $</span></div></div>" +
      '<div class="dw-pay"><b>Paiement en 2 fois, à l\'entreprise qui vend.</b><br>1. Acompte ' + fmt(half) + " $, après la vidéo à votre nom<br>2. Solde " + fmt(t - half) + " $, après vérification du B/L<br>3. Douane au transitaire, à l'arrivée</div></div>" +
      '<div class="dw-actions"><a class="btn btn-wa" target="_blank" rel="noopener" href="' + wa("Bonjour KBA, je suis intéressé(e) par la " + c.brand + " " + c.model + " " + c.year + " (réf. " + c.ref + "). Est-elle toujours disponible ?") + '">Réserver sur WhatsApp</a>' +
      '<a class="btn btn-dark" target="_blank" rel="noopener" href="' + wa("Bonjour KBA, pouvez-vous m'envoyer une vidéo à mon nom de la " + c.brand + " " + c.model + " (réf. " + c.ref + ") ? Mon nom : ") + '">Demander une vidéo à mon nom</a></div>' +
      '<div class="dw-grid"><div><span>Moteur</span>' + c.engine + "</div><div><span>Places</span>" + c.seats + "</div><div><span>Boîte</span>" + c.box + "</div><div><span>Volant</span>À gauche</div></div>" +
      '<div class="dw-h label">Équipements</div><ul class="dw-list">' + c.equip.map(function (e) { return "<li>✓ " + e + "</li>"; }).join("") + "</ul>" +
      '<div class="dw-h label">Défauts signalés</div><ul class="dw-list">' + c.defects.map(function (e) { return '<li><span style="color:var(--amber)">▲</span> ' + e + "</li>"; }).join("") + "</ul>" +
      '<div class="dw-note"><b>Voiture d\'exemple.</b> Cette fiche montre comment chaque voiture est présentée. Le dossier complet (carte grise, inspection, CarHistory, vidéo) est envoyé sur WhatsApp avant tout paiement.</div>';
    $$(".dw-nav").forEach(function (b) { b.addEventListener("click", function () { setPhoto(gi + +b.getAttribute("data-d")); }); });
    $$(".dw-thumbs button").forEach(function (b) { b.addEventListener("click", function () { setPhoto(+b.getAttribute("data-k")); }); });
    drawer.style.visibility = "visible"; drawer.setAttribute("aria-hidden", "false"); panel.scrollTop = 0;
    if (lenis) lenis.stop();
    if (window.gsap && !REDUCED) {
      gsap.to(bg, { opacity: 1, duration: 0.5 });
      gsap.fromTo(panel, { xPercent: 100 }, { xPercent: 0, duration: 0.8, ease: "expo.out" });
      gsap.from("#drawerBody > *", { y: 30, opacity: 0, duration: 0.8, stagger: 0.04, ease: "expo.out", delay: 0.15 });
    } else { bg.style.opacity = 1; panel.style.transform = "none"; }
    $("#drawerX").focus();
  }
  function closeCar() {
    var done = function () { drawer.style.visibility = "hidden"; drawer.setAttribute("aria-hidden", "true"); if (lenis) lenis.start(); };
    if (window.gsap && !REDUCED) { gsap.to(bg, { opacity: 0, duration: 0.4 }); gsap.to(panel, { xPercent: 100, duration: 0.6, ease: "expo.in", onComplete: done }); } else done();
  }
  $$("#cars .car").forEach(function (b) { b.addEventListener("click", function () { openCar(+b.getAttribute("data-i")); }); });
  $("#drawerX").addEventListener("click", closeCar);
  bg.addEventListener("click", closeCar);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && drawer.style.visibility === "visible") closeCar(); if (cur && drawer.style.visibility === "visible" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) setPhoto(gi + (e.key === "ArrowRight" ? 1 : -1)); });

  /* ---------- FAQ ---------- */
  $$(".qa").forEach(function (qa) {
    var btn = $(".qa-q", qa), ans = $(".qa-a", qa);
    btn.addEventListener("click", function () {
      var open = !qa.classList.contains("open");
      qa.classList.toggle("open", open); btn.setAttribute("aria-expanded", open);
      if (window.gsap && !REDUCED) gsap.to(ans, { height: open ? "auto" : 0, duration: 0.6, ease: "expo.out", onComplete: function () { if (window.ScrollTrigger) ScrollTrigger.refresh(); } });
      else ans.style.height = open ? "auto" : "0";
    });
  });

  /* ---------- Formulaire sur mesure ---------- */
  $("#findForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var f = e.target, v = function (n) { return (f.elements[n].value || "").trim(); };
    var msg = ["Bonjour KBA, je cherche une voiture :", "• " + (v("brand") + " " + v("model")).trim(), v("year") && "• Année minimum : " + v("year"), v("budget") && "• Budget total : " + v("budget"), "• Livraison : " + v("country"), "Mon nom : " + v("name")].filter(Boolean).join("\n");
    $("#formLink").href = wa(msg);
    var out = $("#formOut"); out.classList.add("on");
    if (window.gsap && !REDUCED) gsap.from(out, { y: 16, opacity: 0, duration: 0.6, ease: "expo.out" });
  });

  /* ---------- Carte : points + route ---------- */
  var M = window.KBA_MAP, canvas = $("#mapDots"), ctx = canvas.getContext("2d"), svg = $("#mapSvg");
  var origin = M.ports.incheon, maxD = 1450;
  var dots = M.dots.map(function (p) { var dx = p[0] - origin[0], dy = p[1] - origin[1]; return [p[0], p[1], Math.sqrt(dx * dx + dy * dy), Math.random()]; });
  var mapState = { wave: REDUCED ? 1 : 0, t: 0 };
  function drawDots() {
    ctx.clearRect(0, 0, 1600, 860);
    var r = mapState.wave * maxD;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i], k = r - d[2];
      if (k < 0) continue;
      var fresh = k < 90 ? 1 - k / 90 : 0;
      var tw = 0.55 + 0.45 * Math.sin(mapState.t * 1.4 + d[3] * 12);
      ctx.fillStyle = fresh > 0 ? "rgba(141,178,255," + (0.35 + fresh * 0.65) + ")" : "rgba(80,118,178," + (0.42 + tw * 0.25) + ")";
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
  el("path", { d: M.route, fill: "none", stroke: "rgba(141,178,255,.14)", "stroke-width": "1.5", "stroke-dasharray": "2 7" });
  var routeGlow = el("path", { d: M.route, fill: "none", stroke: "#3d7bff", "stroke-width": "6", opacity: ".35", filter: "url(#glow)" });
  var route = el("path", { d: M.route, fill: "none", stroke: "url(#rg)", "stroke-width": "2.4", "stroke-linecap": "round" });
  var L = route.getTotalLength();
  [route, routeGlow].forEach(function (p) { p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
  var portsDef = [["incheon", "Incheon · KR", 14, -14, "start", false], ["singapour", "Singapour", 12, 22, "start", true], ["cap", "Le Cap", 14, 20, "start", true], ["conakry", "Conakry · GN", -14, -12, "end", false], ["dakar", "Dakar", -12, -6, "end", true], ["abidjan", "Abidjan", 6, 22, "middle", true], ["cotonou", "Cotonou", 12, -8, "start", true]];
  var portEls = portsDef.map(function (p) {
    var xy = M.ports[p[0]], g = el("g", { opacity: REDUCED ? 1 : 0 });
    if (!p[5]) el("circle", { cx: xy[0], cy: xy[1], r: 14, fill: "rgba(61,123,255,.18)" }, g);
    el("circle", { cx: xy[0], cy: xy[1], r: p[5] ? 3.2 : 5, fill: "#fff" }, g);
    var t = el("text", { x: xy[0] + p[2], y: xy[1] + p[3], "text-anchor": p[4], class: "port-tag" + (p[5] ? " dim" : "") }, g); t.textContent = p[1];
    return g;
  });
  var ship = el("g", { opacity: 0 });
  el("circle", { r: 18, fill: "rgba(61,123,255,.22)" }, ship);
  el("circle", { r: 7, fill: "#fff" }, ship);
  el("circle", { r: 3, fill: "#3d7bff" }, ship);
  var legs = [["Port d'Incheon", 0], ["Mer de Chine", 0.12], ["Singapour", 0.24], ["Océan Indien", 0.34], ["Large de Madagascar", 0.52], ["Cap de Bonne-Espérance", 0.66], ["Golfe de Guinée", 0.84], ["Port de Conakry", 0.985]];
  var legMarks = [0, 0.24, 0.66, 0.985];
  var trackDay = $("#trackDay"), trackLeg = $("#trackLeg"), trackBar = $("#trackBar"), legSpans = $$(".track-steps span");
  function setShip(p) {
    var pt = route.getPointAtLength(L * p);
    ship.setAttribute("transform", "translate(" + pt.x + "," + pt.y + ")");
    route.style.strokeDashoffset = L * (1 - p); routeGlow.style.strokeDashoffset = L * (1 - p);
    trackDay.textContent = "J+" + String(Math.round(p * 38)).padStart(2, "0");
    trackBar.style.transform = "scaleX(" + p + ")";
    var leg = legs[0][0]; legs.forEach(function (l) { if (p >= l[1]) leg = l[0]; }); if (trackLeg.textContent !== leg) trackLeg.textContent = leg;
    legSpans.forEach(function (s, i) { s.classList.toggle("on", p >= legMarks[i]); });
  }
  drawDots();
  if (REDUCED) { setShip(1); ship.setAttribute("opacity", 1); }

  /* ---------- Si pas de GSAP : on s'arrête là, tout reste visible ---------- */
  var loader = $("#loader");
  if (!window.gsap || REDUCED) {
    loader.style.display = "none"; document.body.classList.remove("is-loading");
    $$(".rv").forEach(function (e) { e.style.opacity = 1; e.style.transform = "none"; });
    $$("#manifesto .w").forEach(function (e) { e.style.opacity = 1; });
    $("#fab").style.transform = "scale(1)";
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Défilement fluide ---------- */
  lenis = new Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.stop();
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href"); var t = id === "#top" ? 0 : $(id);
      if (t === null) return; e.preventDefault(); closeMenu(); lenis.scrollTo(t, { offset: id === "#top" ? 0 : -20, duration: 1.6 });
    });
  });

  /* ---------- Découpage des titres en mots ---------- */
  function splitWords(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    var inners = [];
    nodes.forEach(function (n) {
      var parts = n.textContent.split(/(\s+)/), frag = document.createDocumentFragment();
      parts.forEach(function (w) {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(w)); return; }
        var o = document.createElement("span"); o.className = "mask"; o.style.display = "inline-block"; o.style.verticalAlign = "top";
        var i = document.createElement("span"); i.textContent = w; o.appendChild(i); frag.appendChild(o); inners.push(i);
      });
      n.parentNode.replaceChild(frag, n);
    });
    return inners;
  }
  $$("[data-split]").forEach(function (h) {
    var words = splitWords(h);
    gsap.set(words, { yPercent: 115 });
    ScrollTrigger.create({ trigger: h, start: "top 85%", once: true, onEnter: function () { gsap.to(words, { yPercent: 0, duration: 1.2, stagger: 0.05, ease: "expo.out" }); } });
  });

  /* ---------- Manifeste : mots éclairés au défilement ---------- */
  var man = $("#manifesto");
  var hlWords = ["preuve", "nom,", "officiel", "coréen,", "bateau", "nom."];
  man.innerHTML = man.textContent.split(/\s+/).map(function (w, i, arr) {
    var hl = i > arr.length * 0.42 && hlWords.indexOf(w) >= 0;
    return '<span class="w' + (hl ? " hl" : "") + '">' + w + "</span>";
  }).join(" ");
  gsap.to("#manifesto .w", { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: man, start: "top 78%", end: "bottom 42%", scrub: 0.6 } });

  /* ---------- Apparitions ---------- */
  gsap.set(".rv", { opacity: 0, y: 40 });
  ScrollTrigger.batch(".rv", { start: "top 88%", once: true, onEnter: function (b) { gsap.to(b, { opacity: 1, y: 0, duration: 1.1, stagger: 0.08, ease: "expo.out", overwrite: true }); } });

  /* ---------- Compteurs ---------- */
  $$("[data-count]").forEach(function (e) {
    var to = +e.getAttribute("data-count"), o = { v: 0 }, f = e.hasAttribute("data-fmt");
    ScrollTrigger.create({ trigger: e, start: "top 90%", once: true, onEnter: function () { gsap.to(o, { v: to, duration: to > 100 ? 1.8 : 1.2, ease: "expo.out", onUpdate: function () { e.textContent = f ? fmt(o.v) : Math.round(o.v); } }); } });
  });

  /* ---------- Bandeaux défilants (vitesse et inclinaison selon le défilement) ---------- */
  $$(".mq-row").forEach(function (row) {
    var dir = +row.getAttribute("data-dir"), x = 0, w = row.scrollWidth / 3;
    if (dir > 0) x = -w;
    gsap.ticker.add(function () {
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

  /* ---------- Boutons magnétiques et curseur ---------- */
  if (window.matchMedia("(hover: hover)").matches) {
    $$("[data-magnetic]").forEach(function (b) {
      var xT = gsap.quickTo(b, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" }), yT = gsap.quickTo(b, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      b.addEventListener("mousemove", function (e) { var r = b.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * 0.28); yT((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener("mouseleave", function () { xT(0); yT(0); });
    });
    var cur2 = $("#cursor"), cx = gsap.quickTo(cur2, "x", { duration: 0.35, ease: "power3" }), cy = gsap.quickTo(cur2, "y", { duration: 0.35, ease: "power3" });
    window.addEventListener("mousemove", function (e) { cx(e.clientX); cy(e.clientY); cur2.style.opacity = 1; });
    $$("a, button").forEach(function (a) {
      a.addEventListener("mouseenter", function () { cur2.style.width = cur2.style.height = "42px"; cur2.style.margin = "-21px 0 0 -21px"; });
      a.addEventListener("mouseleave", function () { cur2.style.width = cur2.style.height = "10px"; cur2.style.margin = "-5px 0 0 -5px"; });
    });
  }

  /* ---------- Parcours horizontal épinglé ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", function () {
    var track = $("#journeyTrack");
    var dist = function () { return track.scrollWidth - window.innerWidth; };
    var tl = gsap.timeline({ scrollTrigger: { trigger: "#parcours", start: "top top", end: function () { return "+=" + dist(); }, pin: "#journeyPin", scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 } });
    tl.to(track, { x: function () { return -dist(); }, ease: "none" }, 0)
      .to("#railFill", { scaleX: 1, ease: "none" }, 0)
      .to("#railDot", { left: "100%", ease: "none" }, 0);
    $$(".step").forEach(function (s) {
      gsap.from(s.querySelector(".step-n"), { yPercent: 40, opacity: 0.2, ease: "none", scrollTrigger: { trigger: s, containerAnimation: tl, start: "left 95%", end: "left 55%", scrub: true } });
    });
  });

  /* ---------- Dossier : les vérifications se cochent ---------- */
  var checks = $$("#checks li");
  $$(".d-step").forEach(function (s, i) {
    ScrollTrigger.create({ trigger: s, start: "top 62%", end: "bottom 40%", onToggle: function (self) { s.classList.toggle("on", self.isActive); }, onEnter: function () { for (var k = 0; k <= i; k++) { checks[k].classList.add("on"); checks[k].querySelector(".st").textContent = "Vérifié"; } }, onLeaveBack: function () { checks[i].classList.remove("on"); checks[i].querySelector(".st").textContent = "En cours"; } });
  });
  gsap.to("#filePhoto", { scale: 1, ease: "none", scrollTrigger: { trigger: "#dossier", start: "top bottom", end: "bottom top", scrub: true } });

  /* ---------- Prix : la barre se construit ---------- */
  gsap.set("#bar > div", { scaleX: 0 });
  ScrollTrigger.create({ trigger: "#bar", start: "top 80%", once: true, onEnter: function () { gsap.to("#bar > div", { scaleX: 1, duration: 1.3, stagger: 0.18, ease: "expo.out" }); } });

  /* ---------- Argent : les flux se dessinent ---------- */
  ["#l1", "#l2", "#l3"].forEach(function (id) { var p = $(id), l = p.getTotalLength(); if (id !== "#l3") gsap.set(p, { strokeDasharray: l, strokeDashoffset: l }); else gsap.set(p, { opacity: 0 }); });
  gsap.set("#flow .node", { opacity: 0, y: 20 });
  gsap.set("#bad .x", { strokeDasharray: 260, strokeDashoffset: 260 });
  var ftl = gsap.timeline({ scrollTrigger: { trigger: "#flow", start: "top 72%", once: true } });
  ftl.to("#flow .node.me", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" })
    .to(["#l1", "#l2"], { strokeDashoffset: 0, duration: 1.3, ease: "power2.inOut", stagger: 0.15 }, "-=0.2")
    .to("#flow .node:not(.me):not(.kba):not(.bad)", { opacity: 1, y: 0, duration: 0.8, stagger: 0.15, ease: "expo.out" }, "-=0.6")
    .to("#l3", { opacity: 1, duration: 0.4 })
    .to("#flow .node.kba", { opacity: 1, y: 0, duration: 0.7, ease: "expo.out" }, "-=0.2")
    .to("#bad", { opacity: 1, y: 0, duration: 0.6 }, "+=0.1")
    .to("#bad .x", { strokeDashoffset: 0, duration: 0.6, ease: "power2.out" });

  /* ---------- Parallaxe du héros ---------- */
  gsap.to("#heroMap", { yPercent: -18, scale: 1.08, ease: "none", scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-content", { y: -120, opacity: 0.2, ease: "none", scrollTrigger: { trigger: "#hero", start: "center center", end: "bottom top", scrub: true } });
  gsap.from(".mega", { yPercent: 40, ease: "none", scrollTrigger: { trigger: ".foot", start: "top bottom", end: "bottom bottom", scrub: true } });

  /* ---------- Préchargement puis entrée du héros ---------- */
  var lsvg = $("#loaderSvg"), lp = lsvg ? $$("path", lsvg) : [];
  gsap.set(".hero-title .mask > span", { yPercent: 115 });
  gsap.set("[data-hero-in]", { opacity: 0, y: 30 });
  var counter = { v: 0 };
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
    .add(startVoyage, 3.3);

  function startVoyage() {
    var o = { p: 0 };
    gsap.timeline({ repeat: -1, repeatDelay: 1.6 })
      .fromTo(o, { p: 0 }, { p: 1, duration: 11, ease: "sine.inOut", onUpdate: function () { setShip(o.p); } })
      .to(ship, { opacity: 0, duration: 0.6 }, "+=0.4")
      .set(ship, { opacity: 1 });
  }
  gsap.ticker.add(function (t) { mapState.t = t; drawDots(); });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
