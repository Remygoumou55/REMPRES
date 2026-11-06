// Moteur de motion design piloté par le temps (rendu image par image).
// Chaque élément .el porte data-in / data-out (secondes, relatives à sa partie) et data-a (animation).
// Les parties : <section data-part="h1|h2|h3|body">. Le corps commence à H secondes.
(function () {
  const clamp = (x) => Math.min(Math.max(x, 0), 1);
  const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
  const back = (x) => { x = clamp(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const fmt = (v, dec, sep) => {
    const s = v.toFixed(dec).replace('.', ',');
    const [i, d] = s.split(',');
    return i.replace(/\B(?=(\d{3})+(?!\d))/g, sep ?? ' ') + (d ? ',' + d : '');
  };
  window.SETUP = { H: 0, hook: 'h1' };
  window.render = function (t) {
    const { H, hook } = window.SETUP;
    document.querySelectorAll('section[data-part]').forEach((sec) => {
      const part = sec.dataset.part;
      const on = part === 'body' || part === hook;
      sec.style.display = on ? 'block' : 'none';
      if (!on) return;
      const lt = part === 'body' ? t - H : t;
      sec.querySelectorAll('[data-in]').forEach((el) => {
        const tin = parseFloat(el.dataset.in) - 0.12, tout = el.dataset.out !== undefined ? parseFloat(el.dataset.out) : 1e9;
        const d = Math.min(parseFloat(el.dataset.d || '0.45'), 0.5);
        const a = el.dataset.a || 'rise';
        const p = (lt - tin) / d;
        const o = lt < tin ? 0 : Math.min(ease(p), 1 - ease((lt - (tout - 0.35)) / 0.35));
        if (lt < tin - 0.01 || lt > tout + 0.01) { el.style.visibility = 'hidden'; return; }
        el.style.visibility = 'visible';
        let tr = '';
        switch (a) {
          case 'rise': tr = `translateY(${(1 - ease(p)) * 60}px)`; break;
          case 'drop': tr = `translateY(${-(1 - ease(p)) * 60}px)`; break;
          case 'left': tr = `translateX(${-(1 - ease(p)) * 120}px)`; break;
          case 'right': tr = `translateX(${(1 - ease(p)) * 120}px)`; break;
          case 'pop': tr = `scale(${0.6 + 0.4 * back(p)})`; break;
          case 'slam': tr = `scale(${1 + 1.4 * (1 - ease(p))})`; break;
          case 'zoom': tr = `scale(${0.85 + 0.15 * ease(p)})`; break;
          case 'fade': tr = ''; break;
          case 'grow': tr = `scaleX(${ease(p)})`; el.style.opacity = 1; el.style.transform = tr; return;
          case 'kb': { const k = clamp((lt - tin) / Math.max(tout - tin, 0.1)); tr = `scale(${1.04 + 0.10 * k})`; break; }
          case 'shake': { const s = Math.sin(lt * 37) * 6 * (1 - clamp(p - 1)); tr = `translate(${s}px, ${Math.cos(lt * 29) * 4}px) rotate(${Math.sin(lt * 21) * 1.5}deg)`; break; }
        }
        if (el.dataset.rot) tr += ` rotate(${el.dataset.rot}deg)`;
        if (el.dataset.y0 !== undefined) {
          const k = ease((lt - parseFloat(el.dataset.ys)) / parseFloat(el.dataset.yd));
          tr += ` translateY(${parseFloat(el.dataset.y0) + (parseFloat(el.dataset.y1) - parseFloat(el.dataset.y0)) * k}px)`;
        }
        if (el.dataset.from !== undefined) {
          const k = ease((lt - tin) / parseFloat(el.dataset.cd || '1'));
          const v = parseFloat(el.dataset.from) + (parseFloat(el.dataset.to) - parseFloat(el.dataset.from)) * k;
          el.textContent = (el.dataset.pre || '') + fmt(v, parseInt(el.dataset.dec || '0'), el.dataset.sep) + (el.dataset.post || '');
        }
        el.style.opacity = a === 'kb' ? Math.min(1, o * 1.0 + (lt > tin ? 0.0 : 0)) : o;
        el.style.transform = tr;
      });
    });
    // Sous-titres
    const cap = document.getElementById('cap');
    let txt = '', op = 0;
    for (const [part, a, b, s] of window.CAPS) {
      if (part !== 'body' && part !== hook) continue;
      const off = part === 'body' ? H : 0;
      const A = a + off, B = b + off;
      if (t >= A - 0.05 && t <= B + 0.25) { txt = s; op = Math.min(ease((t - A + 0.05) / 0.2), 1 - ease((t - B - 0.05) / 0.2)); }
    }
    cap.innerHTML = txt ? `<span>${txt}</span>` : '';
    cap.style.opacity = op;
  };
})();
