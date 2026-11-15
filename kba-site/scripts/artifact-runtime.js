// Petit moteur de la page autonome : navigation par ancre, galerie, filtres du catalogue, formulaire WhatsApp.
(function () {
  var sections = Array.prototype.slice.call(document.querySelectorAll("section[data-route]"));
  var nav = document.getElementById("kba-mobile-nav");
  var waNumber = (function () {
    var a = document.querySelector('a[href^="https://wa.me/"]');
    var m = a && a.getAttribute("href").match(/wa\.me\/(\d+)/);
    return m ? m[1] : "";
  })();

  function show() {
    var id = (location.hash || "").replace("#", "") || "accueil";
    var found = sections.some(function (s) { return s.getAttribute("data-route") === id; });
    if (!found) id = "accueil";
    sections.forEach(function (s) {
      var on = s.getAttribute("data-route") === id;
      s.hidden = !on;
      if (on && s.getAttribute("data-title")) document.title = s.getAttribute("data-title");
    });
    if (nav) nav.classList.remove("open");
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", show);
  show();

  // Menu mobile
  var burger = document.querySelector('header button[aria-label="Ouvrir le menu"]');
  if (burger && nav) burger.addEventListener("click", function () { nav.classList.toggle("open"); });

  // Galeries photo des fiches voiture
  document.querySelectorAll("[data-gallery]").forEach(function (g) {
    var root = g.parentElement;
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-photo]"));
    var photos = thumbs.map(function (b) { return b.getAttribute("data-photo"); });
    var img = g.querySelector("[data-gallery-main]");
    var count = g.querySelector("[data-gallery-count]");
    var i = 0;
    function set(k) {
      i = (k + photos.length) % photos.length;
      if (img) { img.src = photos[i]; img.removeAttribute("srcset"); }
      if (count) count.textContent = i + 1 + " / " + photos.length;
      thumbs.forEach(function (t, n) {
        t.classList.toggle("border-blue-600", n === i);
        t.classList.toggle("border-transparent", n !== i);
        t.classList.toggle("opacity-70", n !== i);
      });
    }
    thumbs.forEach(function (t, n) { t.addEventListener("click", function () { set(n); }); });
    var p = g.querySelector("[data-gallery-prev]"), nx = g.querySelector("[data-gallery-next]");
    if (p) p.addEventListener("click", function () { set(i - 1); });
    if (nx) nx.addEventListener("click", function () { set(i + 1); });
  });

  // Catalogue : onglets, filtres, recherche, tri
  var cat = document.querySelector('section[data-route="voitures"]');
  if (cat) {
    var grid = cat.querySelector("[data-grid]");
    var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll("[data-car]")) : [];
    var tabs = Array.prototype.slice.call(cat.querySelectorAll("[data-tab]"));
    var q = cat.querySelector("[data-search-input]");
    var sortSel = cat.querySelector("[data-sort]");
    var countEl = cat.querySelector("[data-count]");
    var tab = "all";
    function f(label) { var el = cat.querySelector('[data-filter="' + label + '"]'); return el ? el.value : ""; }
    var on = "border-navy-900 bg-navy-900 text-white".split(" "), off = "border-line bg-white text-muted".split(" ");
    function apply() {
      var s = (q && q.value || "").trim().toLowerCase();
      var brand = f("Marque"), fuel = f("Carburant"), box = f("Boîte"), maxP = f("Budget max. (rendu port)"), minY = f("Année min."), maxK = f("Km max.");
      var list = cards.filter(function (c) {
        var d = c.dataset;
        return (tab === "all" || d.body === tab) && (!s || d.search.indexOf(s) >= 0) && (!brand || d.brand === brand) && (!fuel || d.fuel === fuel) &&
          (!box || d.gearbox === box) && (!maxP || +d.price <= +maxP) && (!minY || +d.year >= +minY) && (!maxK || +d.km <= +maxK);
      });
      var key = sortSel ? sortSel.value : "recent";
      var by = {
        recent: function (a, b) { return b.dataset.added.localeCompare(a.dataset.added); },
        priceAsc: function (a, b) { return a.dataset.price - b.dataset.price; },
        priceDesc: function (a, b) { return b.dataset.price - a.dataset.price; },
        kmAsc: function (a, b) { return a.dataset.km - b.dataset.km; },
        yearDesc: function (a, b) { return b.dataset.year - a.dataset.year; },
      }[key];
      cards.forEach(function (c) { c.style.display = "none"; });
      list.sort(by).forEach(function (c) { c.style.display = ""; grid.appendChild(c); });
      if (countEl) countEl.textContent = list.length;
    }
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        tab = t.getAttribute("data-tab");
        tabs.forEach(function (x) {
          var a = x === t; x.setAttribute("aria-selected", a);
          on.forEach(function (c) { x.classList.toggle(c, a); });
          off.forEach(function (c) { x.classList.toggle(c, !a); });
        });
        apply();
      });
    });
    cat.querySelectorAll("select, input").forEach(function (el) { el.addEventListener("input", apply); el.addEventListener("change", apply); });
    var toggle = Array.prototype.slice.call(cat.querySelectorAll("button")).filter(function (b) { return /Filtres/.test(b.textContent); })[0];
    var panel = cat.querySelector('[data-filter="Marque"]');
    panel = panel && panel.closest("div.grid");
    if (toggle && panel) toggle.addEventListener("click", function () { panel.classList.toggle("hidden"); });
  }

  // Formulaire « Trouvez-la pour moi » : compose le message et propose le lien WhatsApp
  var form = document.querySelector("[data-findcar]");
  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (n) { var el = form.querySelector('[name="' + n + '"]'); return el ? el.value.trim() : ""; };
    var lines = [
      "Bonjour KBA, je cherche une voiture :",
      "• Marque / modèle : " + (v("brand") + " " + v("model")).trim(),
      v("yearMin") && "• Année minimum : " + v("yearMin"),
      v("budget") && "• Budget total : " + v("budget"),
      "• Carburant : " + v("fuel") + " · Boîte : " + v("gearbox"),
      "• Livraison : " + v("country") + (v("city") ? " (" + v("city") + ")" : ""),
      v("link") && "• Annonce : " + v("link"),
      v("note") && "• Précisions : " + v("note"),
      "Mon nom : " + v("name"),
    ].filter(Boolean).join("\n");
    var box = form.querySelector("#kba-wa-result");
    if (!box) { box = document.createElement("div"); box.id = "kba-wa-result"; box.className = "sm:col-span-2 rounded-md border border-line bg-paper p-4 text-[14px]"; form.appendChild(box); }
    var a = document.createElement("a");
    a.href = "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(lines);
    a.target = "_blank"; a.rel = "noopener";
    a.className = "btn-whatsapp mt-2 w-full";
    a.textContent = "Ouvrir WhatsApp avec ma demande";
    box.innerHTML = '<p class="font-semibold text-ink">Votre demande est prête.</p>';
    box.appendChild(a);
  });
})();
