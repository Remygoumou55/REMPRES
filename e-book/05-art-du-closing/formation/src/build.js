// Formation « Ne laisse plus partir tes clients » — générateur PowerPoint.
// Usage : NODE_PATH=<dossier node_modules avec pptxgenjs> node build.js ep00 ep01 ep02 [sortie.pptx]
// Chaque fichier epNN.js exporte { num, titre, slides: [...] } ; chaque slide a un type et des notes (le texte à dire).
const path = require("path");
const pptxgen = require("pptxgenjs");
const SK = "/root/.claude/skills/synced/a923f9dd-87ff-460d-bb5f-e4f47a397861_747559a3-a194-4d92-8c3e-89efafca49bb/pptx/scripts/apply_theme.js";

const THEME = {
  name: "Ne laisse plus partir tes clients",
  headFontFace: "Cambria", bodyFontFace: "Calibri",
  colors: { dk1: "1E1E1E", lt1: "FFFFFF", dk2: "123B2F", lt2: "FAF6EC",
    accent1: "123B2F", accent2: "E9C46A", accent3: "B08A3E", accent4: "D9534F", accent5: "2E7D5B", accent6: "6B7280",
    hlink: "2E7D5B", folHlink: "B08A3E" },
};
const HEX = { vert: "123B2F", or: "E9C46A", bronze: "B08A3E", creme: "FAF6EC", rouge: "D9534F", vertclair: "2E7D5B", gris: "6B7280", blanc: "FFFFFF", encre: "1E1E1E" };

const args = process.argv.slice(2);
const out = args.find(a => a.endsWith(".pptx")) || "formation.pptx";
const eps = args.filter(a => !a.endsWith(".pptx")).map(e => require(path.resolve(__dirname, e + ".js")));
const IMG = f => path.join(__dirname, f);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Formation — Ne laisse plus partir tes clients";
pres.author = "Collection Playbooks";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;
const FOOT = "Ne laisse plus partir tes clients · Formation";

pres.defineSlideMaster({ title: "SOMBRE", background: { color: HEX.vert },
  objects: [{ text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: HEX.or } } }],
  slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.or } });
pres.defineSlideMaster({ title: "CLAIR", background: { color: HEX.blanc },
  objects: [
    { text: { text: FOOT, options: { x: 0.6, y: 7.0, w: 8, h: 0.3, fontSize: 10, color: HEX.gris } } },
    { placeholder: { options: { name: "title", type: "title", x: 0.6, y: 0.35, w: 12.1, h: 0.9, fontSize: 32, bold: true, color: HEX.vert, fontFace: "Cambria", valign: "middle", align: "left", margin: 0 }, text: "" } },
  ],
  slideNumber: { x: 12.3, y: 7.0, w: 0.5, h: 0.3, fontSize: 10, color: HEX.gris } });

// petit bandeau « ÉPISODE NN » au-dessus du titre
function kicker(s, ep, txt, dark) {
  s.addText(`ÉPISODE ${String(ep.num).padStart(2, "0")}${txt ? "  ·  " + txt : ""}`,
    { isTextBox: true, x: 0.6, y: 0.08, w: 10, h: 0.3, fontSize: 11, bold: true, charSpacing: 3, color: dark ? HEX.or : HEX.bronze, margin: 0 });
}
function card(s, x, y, w, h, fill) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.12, fill: { color: fill || HEX.creme }, line: { color: fill || HEX.creme } });
}
function rich(t) { // **gras** -> runs
  const parts = String(t).split(/(\*\*[^*]+\*\*)/).filter(Boolean);
  return parts.map(p => p.startsWith("**") ? { text: p.slice(2, -2), options: { bold: true } } : { text: p });
}

const R = {
  cover(s, ep, d) {
    kicker(s, ep, "", true);
    s.addText(d.titre || ep.titre, { isTextBox: true, x: 0.6, y: 1.5, w: 6.6, h: 2.4, fontFace: "Cambria", fontSize: 44, bold: true, color: HEX.blanc, valign: "top", margin: 0 });
    s.addText(rich(d.sous || ""), { isTextBox: true, x: 0.6, y: 4.1, w: 6.4, h: 1.6, fontSize: 24, color: HEX.or, italic: true, valign: "top", margin: 0 });
    if (d.duree) s.addText(d.duree, { isTextBox: true, x: 0.6, y: 6.2, w: 6, h: 0.4, fontSize: 13, color: HEX.creme, margin: 0 });
    if (d.img) s.addImage({ path: IMG(d.img), x: 7.6, y: 1.0, w: 5.2, h: d.imgH || 3.47, sizing: { type: "contain", w: 5.2, h: d.imgH || 3.47 } });
  },
  objectifs(s, ep, d) {
    kicker(s, ep, "AU PROGRAMME");
    s.addText(d.titre || "Dans cet épisode, tu vas apprendre", { placeholder: "title" });
    d.items.forEach((t, i) => {
      const y = 1.6 + i * 1.35;
      card(s, 0.6, y, 12.1, 1.1);
      s.addShape(pres.shapes.OVAL, { x: 0.85, y: y + 0.2, w: 0.7, h: 0.7, fill: { color: HEX.vert }, line: { color: HEX.vert } });
      s.addText(String(i + 1), { isTextBox: true, x: 0.85, y: y + 0.2, w: 0.7, h: 0.7, align: "center", valign: "middle", fontSize: 22, bold: true, color: HEX.or, margin: 0 });
      s.addText(rich(t), { isTextBox: true, x: 1.85, y, w: 10.6, h: 1.1, fontSize: 22, color: HEX.encre, valign: "middle", margin: 0 });
    });
  },
  idee(s, ep, d) {
    kicker(s, ep, d.kicker);
    s.addText(d.titre, { placeholder: "title" });
    if (d.intro) s.addText(rich(d.intro), { isTextBox: true, x: 0.6, y: 1.3, w: 12.1, h: 0.8, fontSize: 20, color: HEX.encre, margin: 0, valign: "top" });
    const n = d.cartes.length, gap = 0.3, w = (12.1 - gap * (n - 1)) / n, y = d.intro ? 2.3 : 1.6, h = 6.6 - y;
    d.cartes.forEach((c, i) => {
      const x = 0.6 + i * (w + gap);
      card(s, x, y, w, h, c.fond === "vert" ? HEX.vert : HEX.creme);
      const dark = c.fond === "vert";
      s.addText(c.icone || String(i + 1), { isTextBox: true, x: x + 0.3, y: y + 0.25, w: w - 0.6, h: 0.7, fontSize: 30, bold: true, color: dark ? HEX.or : HEX.bronze, margin: 0 });
      s.addText(c.t, { isTextBox: true, x: x + 0.3, y: y + 1.0, w: w - 0.6, h: 0.9, fontSize: 22, bold: true, fontFace: "Cambria", color: dark ? HEX.blanc : HEX.vert, valign: "top", margin: 0 });
      s.addText(rich(c.txt), { isTextBox: true, x: x + 0.3, y: y + 1.95, w: w - 0.6, h: h - 2.2, fontSize: 21, color: dark ? HEX.creme : HEX.encre, valign: "top", margin: 0 });
    });
  },
  image(s, ep, d) {
    kicker(s, ep, d.kicker);
    s.addText(d.titre, { placeholder: "title" });
    s.addImage({ path: IMG(d.img), x: 0.6, y: 1.5, w: 7.2, h: 4.8, sizing: { type: "contain", w: 7.2, h: 4.8 } });
    s.addText(d.lignes.map((t, i) => ({ text: rich(t).map(r => r.text).join(""), options: { bullet: { code: "25CF" }, breakLine: i < d.lignes.length - 1, paraSpaceAfter: 14 } })),
      { isTextBox: true, x: 8.2, y: 1.6, w: 4.5, h: 4.7, fontSize: 22, color: HEX.encre, valign: "top", margin: 0 });
  },
  compare(s, ep, d) {
    kicker(s, ep, d.kicker);
    s.addText(d.titre, { placeholder: "title" });
    const cols = [d.gauche, d.droite];
    cols.forEach((c, i) => {
      const x = 0.6 + i * 6.2, good = i === 1;
      card(s, x, 1.5, 5.9, 5.1, good ? HEX.vert : HEX.creme);
      s.addText((good ? "✓  " : "✗  ") + c.t, { isTextBox: true, x: x + 0.35, y: 1.7, w: 5.2, h: 0.7, fontSize: 24, bold: true, fontFace: "Cambria", color: good ? HEX.or : HEX.rouge, margin: 0 });
      s.addText(c.lignes.map((t, k) => ({ text: t, options: { bullet: true, breakLine: k < c.lignes.length - 1, paraSpaceAfter: 12 } })),
        { isTextBox: true, x: x + 0.35, y: 2.55, w: 5.2, h: 3.9, fontSize: 22, color: good ? HEX.blanc : HEX.encre, valign: "top", margin: 0 });
    });
  },
  tableau(s, ep, d) {
    kicker(s, ep, d.kicker);
    s.addText(d.titre, { placeholder: "title" });
    const rows = [d.entetes.map(h => ({ text: h, options: { bold: true, color: HEX.or, fill: { color: HEX.vert } } }))]
      .concat(d.lignes.map((l, i) => l.map((c, j) => ({ text: c, options: { bold: j === 0, color: j === 0 ? HEX.vert : HEX.encre, fill: { color: i % 2 ? HEX.blanc : HEX.creme } } }))));
    s.addTable(rows, { x: 0.6, y: 1.45, w: 12.1, colW: d.colW, fontSize: d.taille || 20, fontFace: "Calibri", valign: "middle", rowH: Math.min(0.95, 5.1 / (d.lignes.length + 1)), border: { type: "solid", pt: 0.5, color: "E3DCC8" }, margin: 0.08 });
  },
  quiz(s, ep, d) {
    kicker(s, ep, "À TOI DE JOUER");
    s.addText(d.titre || "Toi, tu dirais quoi ?", { placeholder: "title" });
    s.addText(rich(d.situation), { isTextBox: true, x: 0.6, y: 1.3, w: 12.1, h: 1.0, fontSize: 20, italic: true, color: HEX.encre, margin: 0, valign: "top" });
    d.choix.forEach((c, i) => {
      const y = 2.5 + i * 1.35;
      card(s, 0.6, y, 12.1, 1.15);
      s.addText(String.fromCharCode(65 + i), { isTextBox: true, x: 0.85, y, w: 0.7, h: 1.15, fontSize: 30, bold: true, color: HEX.bronze, valign: "middle", margin: 0 });
      s.addText(c, { isTextBox: true, x: 1.6, y, w: 10.9, h: 1.15, fontSize: 21, color: HEX.encre, valign: "middle", margin: 0 });
    });
  },
  reponse(s, ep, d) {
    kicker(s, ep, "LA BONNE RÉPONSE");
    s.addText(`La bonne réponse : ${d.lettre}`, { placeholder: "title" });
    card(s, 0.6, 1.45, 12.1, 1.5, HEX.vert);
    s.addText(rich(d.pourquoi), { isTextBox: true, x: 0.9, y: 1.45, w: 11.5, h: 1.5, fontSize: 22, color: HEX.blanc, valign: "middle", margin: 0 });
    d.non.forEach((t, i) => {
      const y = 3.2 + i * 1.15;
      s.addText([{ text: "✗  ", options: { color: HEX.rouge, bold: true } }].concat(rich(t)), { isTextBox: true, x: 0.6, y, w: 12.1, h: 1.0, fontSize: 21, color: HEX.encre, valign: "middle", margin: 0 });
    });
    if (d.action) s.addText([{ text: "👉 La bonne action : ", options: { bold: true, color: HEX.vert } }].concat(rich(d.action)),
      { isTextBox: true, x: 0.6, y: 5.6, w: 12.1, h: 1.0, fontSize: 21, color: HEX.encre, valign: "middle", margin: 0 });
  },
  phrase(s, ep, d) {
    kicker(s, ep, d.kicker || "LA PHRASE À RETENIR", true);
    s.addText("«", { isTextBox: true, x: 0.6, y: 0.9, w: 1.5, h: 1.5, fontSize: 110, color: HEX.or, fontFace: "Cambria", margin: 0 });
    s.addText(d.texte, { isTextBox: true, x: 1.4, y: 2.0, w: 10.6, h: 3.2, fontSize: 34, fontFace: "Cambria", italic: true, color: HEX.blanc, valign: "middle", margin: 0 });
    if (d.auteur) s.addText(d.auteur, { isTextBox: true, x: 1.4, y: 5.4, w: 10.6, h: 0.6, fontSize: 18, color: HEX.or, margin: 0 });
  },
  exercice(s, ep, d) {
    kicker(s, ep, "EXERCICE EN DIRECT");
    s.addText(d.titre || "À toi de jouer", { placeholder: "title" });
    card(s, 0.6, 1.5, 12.1, 3.3);
    s.addText(d.consignes.map((t, i) => ({ text: rich(t).map(r => r.text).join(""), options: { bullet: { type: "number" }, breakLine: i < d.consignes.length - 1, paraSpaceAfter: 12 } })),
      { isTextBox: true, x: 0.95, y: 1.7, w: 11.4, h: 2.9, fontSize: 26, color: HEX.encre, valign: "top", margin: 0 });
    card(s, 0.6, 5.05, 12.1, 1.55, HEX.vert);
    s.addText([{ text: "💬 Dans le chat : ", options: { bold: true, color: HEX.or } }, { text: d.chat, options: { color: HEX.blanc } }],
      { isTextBox: true, x: 0.95, y: 5.05, w: 11.4, h: 1.55, fontSize: 21, valign: "middle", margin: 0 });
  },
  recap(s, ep, d) {
    kicker(s, ep, "À RETENIR");
    s.addText(d.titre || "Ce qu'il faut retenir", { placeholder: "title" });
    s.addText(d.points.map((t, i) => ({ text: "☐  " + t, options: { breakLine: i < d.points.length - 1, paraSpaceAfter: 14 } })),
      { isTextBox: true, x: 0.6, y: 1.5, w: 7.6, h: 4.9, fontSize: 24, color: HEX.encre, valign: "top", margin: 0 });
    card(s, 8.6, 1.5, 4.1, 4.9, HEX.vert);
    s.addText("PROCHAIN ÉPISODE", { isTextBox: true, x: 8.9, y: 1.75, w: 3.6, h: 0.4, fontSize: 13, bold: true, charSpacing: 2, color: HEX.or, margin: 0 });
    s.addText(d.suite, { isTextBox: true, x: 8.9, y: 2.3, w: 3.6, h: 2.2, fontSize: 22, bold: true, fontFace: "Cambria", color: HEX.blanc, valign: "top", margin: 0 });
    if (d.devoir) {
      s.addText("TON DEVOIR", { isTextBox: true, x: 8.9, y: 4.5, w: 3.6, h: 0.35, fontSize: 13, bold: true, charSpacing: 2, color: HEX.or, margin: 0 });
      s.addText(d.devoir, { isTextBox: true, x: 8.9, y: 4.9, w: 3.6, h: 1.4, fontSize: 17, color: HEX.creme, valign: "top", margin: 0 });
    }
  },
};
const DARK = new Set(["cover", "phrase"]);

(async () => {
  for (const ep of eps) {
    const sec = `Épisode ${String(ep.num).padStart(2, "0")} — ${ep.titre}`;
    pres.addSection({ title: sec });
    for (const d of ep.slides) {
      const s = pres.addSlide({ masterName: DARK.has(d.type) ? "SOMBRE" : "CLAIR", sectionTitle: sec });
      R[d.type](s, ep, d);
      s.addNotes(d.notes.trim());
    }
  }
  await pres.writeFile({ fileName: out });
  await require(SK).applyTheme(out, THEME);
  console.log("ok", out);
})();
