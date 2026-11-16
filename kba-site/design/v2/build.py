"""Assemble index.html (variante 2) à partir de index.src.html : icônes et logo en ligne.
Les textes sont dans assets/i18n.js (3 langues) et injectés par assets/app.js."""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
src = (ROOT / "index.src.html").read_text()

ICONS = {
    "WA": '<svg class="wa-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 20.5l1.3-4A8.5 8.5 0 1 1 8 19.6z"/><path d="M9 9.2c.2 1.9 1.9 3.9 4 4.7l1.2-1.1 1.8.8-.4 1.6c-3.6.2-7-3.3-7-6.9l1.6-.4.8 1.8z" fill="currentColor" stroke="none"/></svg>',
    "ARROW": '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    "ARROW_L": '<svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    "MOON": '<svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>',
    "SUN": '<svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
}

# Logo du préchargement : lettres en currentColor pour suivre le thème
logo = (ROOT / "assets/kba-symbole-sombre.svg").read_text()
logo = re.sub(r' width="\d+" height="\d+"', "", logo, count=1).replace("<svg ", '<svg id="loaderSvg" aria-hidden="true" ', 1)
logo = logo.replace('fill="#FFFFFF"', 'fill="currentColor"')

out = src.replace("{{LOGO}}", logo)
for k, v in ICONS.items():
    out = out.replace("{{" + k + "}}", v)
assert "{{" not in out, re.findall(r"\{\{\w+\}\}", out)
# Une page par onglet : même gabarit, seules les sections de la page sont affichées (data-page)
PAGES = {"index": "home", "catalogue": "arrivages", "parcours": "parcours", "prix": "prix", "verifiez": "verifiez", "pays": "pays", "questions": "questions"}
for name, page in PAGES.items():
    html = out.replace('<body class="is-loading">', '<body class="is-loading" data-page="%s">' % page, 1)
    if page != "home":
        html = html.replace('<a href="%s.html" data-i18n' % name, '<a class="on" href="%s.html" data-i18n' % name, 1)
    (ROOT / (name + ".html")).write_text(html)
print("7 pages :", len(out) // 1024, "Ko chacune")
