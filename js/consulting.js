// ============================================================
// CONSULTING.JS — interactive pieces on freelancing.html
// 1. "Cost of a change": rule of thumb, ×1 at concept to ×1000 in the field
// 2. Radio map: typical range vs data rate for common IoT radios
// Colours come from the Live Scope tokens (css/homepage.css),
// text from translations.<lang>.consulting (js/translations.js).
// ============================================================
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => { const c = hex2(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };

  // -------- theme --------
  const C = {};
  let G = 1, MONO = 'JetBrains Mono, monospace';
  function readTheme() {
    const cs = getComputedStyle(document.body), v = n => cs.getPropertyValue(n).trim();
    Object.assign(C, { panel: v('--panel'), rule: v('--hair'), paper: v('--paper'), dim: v('--dim'), phos: v('--phos'), moss: v('--moss') });
    G = parseFloat(v('--glow')) || 0;
    MONO = v('--font-mono') || MONO;
    stages.forEach(s => s.draw(0, performance.now() / 1000));
  }
  const glow = (ctx, px) => { ctx.shadowColor = C.phos; ctx.shadowBlur = px * G; };
  const mono = (ctx, size = 11, color = C.dim) => { ctx.font = `${size}px ${MONO}`; ctx.fillStyle = color; };

  // -------- i18n --------
  const lang = () => (document.documentElement.lang === 'de' ? 'de' : 'en');
  const tr = () => (typeof translations !== 'undefined' && translations[lang()] && translations[lang()].consulting) || {};
  const trEn = () => (typeof translations !== 'undefined' && translations.en.consulting) || {};
  const pick = (path) => { const get = o => path.split('.').reduce((x, k) => (x == null ? x : x[k]), o); const v = get(tr()); return v === undefined ? get(trEn()) : v; };
  const hooks = [];
  const onText = f => { hooks.push(f); f(); };
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => hooks.forEach(f => f()), 0));
  document.addEventListener('i18n:change', () => hooks.forEach(f => f()));

  // -------- tiny stage engine (animates only while visible) --------
  const stages = [];
  const vis = new IntersectionObserver(es => es.forEach(e => { if (e.target._s) e.target._s.visible = e.isIntersecting; }), { threshold: .05 });
  function stage(canvas, s) {
    if (!canvas) return null;
    Object.assign(s, { ctx: canvas.getContext('2d'), w: 1, h: 1, visible: false });
    canvas._s = s;
    new ResizeObserver(() => {
      const r = canvas.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
      s.w = Math.max(1, r.width); s.h = Math.max(1, r.height);
      canvas.width = Math.round(s.w * d); canvas.height = Math.round(s.h * d);
      s.ctx.setTransform(d, 0, 0, d, 0, 0);
      s.draw(0, performance.now() / 1000);
    }).observe(canvas);
    vis.observe(canvas);
    if (s.onTap) canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); s.onTap(e.clientX - r.left, e.clientY - r.top); });
    stages.push(s);
    return s;
  }
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) stages.forEach(s => { if (s.visible) s.draw(dt, now / 1000); });
    requestAnimationFrame(loop);
  })(last);

  /* ---------- 1. Cost of a change ---------- */
  const PHASES = 6;
  const costIn = $('#cost-pos');
  let costU = +costIn.value / 100; // eased position 0..PHASES-1
  function costText() {
    const p = +costIn.value / 100, i = Math.round(p);
    const names = pick('cost.phases') || [], notes = pick('cost.notes') || [];
    $('#cost-phase').textContent = names[i] || '';
    const mult = Math.pow(10, p * 3 / (PHASES - 1));
    const shown = mult < 10 ? mult.toFixed(1).replace(/\.0$/, '') : Math.round(mult).toLocaleString(lang() === 'de' ? 'de-DE' : 'en-GB');
    $('#cost-x').innerHTML = `×${shown}<small>${pick('cost.unit') || 'cost'}</small>`;
    $('#cost-note').textContent = notes[i] || '';
  }
  costIn.addEventListener('input', costText);
  onText(costText);
  stage($('#cv-cost'), {
    onTap(x) {
      const L = 54, R = 18;
      costIn.value = Math.round(clamp((x - L) / (this.w - L - R), 0, 1) * 500);
      costText();
    },
    draw(dt) {
      const { ctx, w, h } = this; if (!C.phos) return;
      ctx.clearRect(0, 0, w, h);
      const L = 54, R = 18, T = 44, B = 46;
      const target = +costIn.value / 100;
      costU += (target - costU) * (RM ? 1 : Math.min(1, dt * 8 || 1));
      const X = u => L + u / (PHASES - 1) * (w - L - R);
      const Y = m => T + (1 - Math.log10(m) / 3) * (h - T - B); // ×1 .. ×1000
      const mAt = u => Math.pow(10, u * 3 / (PHASES - 1));
      // grid
      for (const m of [1, 10, 100, 1000]) {
        const y = Y(m); ctx.strokeStyle = rgba(C.paper, .07); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(L, y + .5); ctx.lineTo(w - R, y + .5); ctx.stroke();
        mono(ctx, 10.5); ctx.textAlign = 'right'; ctx.fillText('×' + m.toLocaleString('en-GB'), L - 8, y + 4);
      }
      const names = pick('cost.phasesShort') || [];
      for (let i = 0; i < PHASES; i++) {
        const x = X(i); ctx.strokeStyle = rgba(C.paper, .05); ctx.beginPath(); ctx.moveTo(x + .5, T); ctx.lineTo(x + .5, h - B); ctx.stroke();
        mono(ctx, 10, Math.round(costU) === i ? C.paper : C.dim); ctx.textAlign = 'center';
        ctx.fillText(names[i] || '', clamp(x, L + 22, w - R - 22), h - B + 20);
      }
      ctx.textAlign = 'left';
      // curve: full (dim) and up to the marker (signal)
      const curve = (to) => { ctx.beginPath(); for (let k = 0; k <= 100; k++) { const u = k / 100 * to; k ? ctx.lineTo(X(u), Y(mAt(u))) : ctx.moveTo(X(u), Y(mAt(u))); } };
      curve(PHASES - 1); ctx.strokeStyle = rgba(C.paper, .25); ctx.lineWidth = 1.5; ctx.setLineDash([4, 6]); ctx.stroke(); ctx.setLineDash([]);
      curve(Math.max(.001, costU));
      ctx.lineTo(X(costU), h - B); ctx.lineTo(X(0), h - B); ctx.closePath(); ctx.fillStyle = rgba(C.phos, .1); ctx.fill();
      curve(Math.max(.001, costU)); ctx.strokeStyle = C.phos; ctx.lineWidth = 3; glow(ctx, 12); ctx.stroke(); ctx.shadowBlur = 0;
      // marker
      const mx = X(costU), my = Y(mAt(costU));
      ctx.fillStyle = rgba(C.phos, .2); ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.phos; ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, Math.PI * 2); ctx.fill();
      // "advice is cheap here" band
      ctx.fillStyle = rgba(C.moss, .12); ctx.fillRect(X(0), T, X(1) - X(0), h - T - B);
      mono(ctx, 10.5, C.moss); ctx.fillText(pick('cost.band') || '', X(0) + 8, T + 16);
    }
  });

  /* ---------- 2. Radio map ---------- */
  // Rough envelopes (metres, bit/s). Rules of thumb only; walls, antennas and networks decide.
  const RADIOS = {
    enocean: { name: 'EnOcean', r: [10, 300], b: [125e3, 125e3] },
    ble:     { name: 'BLE',     r: [10, 100], b: [125e3, 2e6] },
    zigbee:  { name: 'Zigbee',  r: [10, 100], b: [250e3, 250e3] },
    thread:  { name: 'Thread',  r: [10, 100], b: [250e3, 250e3] },
    lora:    { name: 'LoRa',    r: [2e3, 15e3], b: [300, 50e3] },
    nbiot:   { name: 'NB-IoT',  r: [1e3, 15e3], b: [20e3, 150e3] },
    ltem:    { name: 'LTE-M',   r: [1e3, 10e3], b: [100e3, 1e6] }
  };
  let sel = 'ble';
  let flash = 1;
  function radioText() {
    const d = (pick('radio.data') || {})[sel] || {};
    $('#r-name').textContent = RADIOS[sel].name;
    $('#r-range').textContent = d.range || '';
    $('#r-rate').textContent = d.rate || '';
    $('#r-power').textContent = d.power || '';
    $('#r-good').textContent = d.good || '';
    $('#r-watch').textContent = d.watch || '';
    $$('[data-radio]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.radio === sel)));
  }
  function choose(k) { sel = k; flash = 1; radioText(); }
  $$('[data-radio]').forEach(b => b.addEventListener('click', () => choose(b.dataset.radio)));
  onText(radioText);
  const fmtM = m => (m >= 1000 ? m / 1000 + ' km' : m + ' m');
  const fmtB = b => (b >= 1e6 ? b / 1e6 + ' Mbit/s' : b >= 1e3 ? b / 1e3 + ' kbit/s' : b + ' bit/s');
  stage($('#cv-radio'), {
    boxes: {},
    onTap(x, y) {
      // pick the smallest box under the pointer
      let best = null, area = Infinity;
      for (const k in this.boxes) { const [x1, y1, x2, y2] = this.boxes[k]; if (x >= x1 && x <= x2 && y >= y1 && y <= y2 && (x2 - x1) * (y2 - y1) < area) { best = k; area = (x2 - x1) * (y2 - y1); } }
      if (best) choose(best);
    },
    draw(dt, t) {
      const { ctx, w, h } = this; if (!C.phos) return;
      ctx.clearRect(0, 0, w, h);
      const L = 70, R = 18, T = 40, B = 40;
      const r0 = 0, r1 = Math.log10(30e3);       // 1 m .. 30 km
      const b0 = Math.log10(100), b1 = Math.log10(4e6); // 100 bit/s .. 4 Mbit/s
      const X = m => L + (Math.log10(m) - r0) / (r1 - r0) * (w - L - R);
      const Y = b => T + (1 - (Math.log10(b) - b0) / (b1 - b0)) * (h - T - B);
      mono(ctx, 10);
      for (const m of [1, 10, 100, 1e3, 1e4]) { const x = X(m); ctx.strokeStyle = rgba(C.paper, .06); ctx.beginPath(); ctx.moveTo(x + .5, T); ctx.lineTo(x + .5, h - B); ctx.stroke(); ctx.textAlign = 'center'; ctx.fillText(fmtM(m), x, h - B + 18); }
      for (const b of [1e3, 1e4, 1e5, 1e6]) { const y = Y(b); ctx.strokeStyle = rgba(C.paper, .06); ctx.beginPath(); ctx.moveTo(L, y + .5); ctx.lineTo(w - R, y + .5); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(fmtB(b), L - 8, y + 4); }
      ctx.textAlign = 'left';
      mono(ctx, 10, C.dim); ctx.fillText(pick('radio.axisX') || '', L, h - 8);
      flash = Math.max(0, flash - dt * 1.5);
      // draw others first, selected last
      const keys = Object.keys(RADIOS).sort((a, b) => (a === sel) - (b === sel));
      const placed = [];
      for (const k of keys) {
        const R0 = RADIOS[k], on = k === sel;
        let x1 = X(R0.r[0]), x2 = X(R0.r[1]), y1 = Y(R0.b[1]), y2 = Y(R0.b[0]);
        // single-rate radios are thin bars; Zigbee/Thread share an envelope, so nudge them apart
        const bar = y2 - y1 < 14;
        if (bar) { const c = (y1 + y2) / 2 + (k === 'zigbee' ? -12 : k === 'thread' ? 2 : 14); y1 = c - 5; y2 = c + 5; }
        this.boxes[k] = [x1, y1, x2, y2];
        ctx.fillStyle = on ? rgba(C.phos, .22 + flash * .2) : rgba(C.moss, .14);
        ctx.strokeStyle = on ? C.phos : rgba(C.moss, .6);
        ctx.lineWidth = on ? 2 : 1;
        if (on) glow(ctx, 12);
        ctx.beginPath(); ctx.roundRect(x1, y1, x2 - x1, y2 - y1, 4); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        // label, kept clear of earlier labels
        mono(ctx, on ? 12 : 10.5, on ? C.paper : C.dim);
        if (bar) { ctx.fillText(R0.name, x2 + 6, (y1 + y2) / 2 + 4); continue; }
        let ly = y1 - 6;
        while (placed.some(p => Math.abs(p[0] - x1) < 64 && Math.abs(p[1] - ly) < 13)) ly -= 13;
        placed.push([x1, ly]);
        ctx.fillText(R0.name, x1, ly);
      }
      if (!RM) { const u = (t % 2.4) / 2.4, [x1, y1] = this.boxes[sel]; ctx.strokeStyle = rgba(C.phos, (1 - u) * .6); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x1, y1, 4 + u * 18, 0, Math.PI * 2); ctx.stroke(); }
    }
  });

  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(readTheme);
})();
