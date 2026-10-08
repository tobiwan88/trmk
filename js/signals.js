// ============================================================
// SIGNALS.JS — interactive canvases for the homepage
// Ported from the "Signals" CV presentation. Each canvas is a
// small "stage" that only animates while it is on screen.
// Colours come from the CSS tokens in css/homepage.css, so the
// day (paper) and night (scope) themes both work.
// Text comes from translations.<lang>.home.live (js/translations.js).
// ============================================================
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, u) => a + (b - a) * u;
  const hex2 = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const rgba = (h, a) => { const c = hex2(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; };
  const mix = (a, b, u) => { const A = hex2(a), B = hex2(b); return `rgb(${Math.round(lerp(A[0], B[0], u))},${Math.round(lerp(A[1], B[1], u))},${Math.round(lerp(A[2], B[2], u))})`; };

  // -------- theme colours --------
  const C = {};
  let G = 1; // glow strength: 1 at night, 0 on paper
  let MONO = 'JetBrains Mono, monospace';
  let DISP = 'Bricolage Grotesque, sans-serif';
  const themeHooks = [];
  function readTheme() {
    const cs = getComputedStyle(document.body);
    const v = n => cs.getPropertyValue(n).trim();
    Object.assign(C, { night: v('--night'), panel: v('--panel'), rule: v('--hair'), paper: v('--paper'), dim: v('--dim'), phos: v('--phos'), moss: v('--moss') });
    G = parseFloat(v('--glow')) || 0;
    MONO = v('--font-mono') || MONO;
    DISP = v('--display') || DISP;
    themeHooks.forEach(f => f());
  }
  readTheme();
  new MutationObserver(readTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const glow = (ctx, px) => { ctx.shadowColor = C.phos; ctx.shadowBlur = px * G; };

  // -------- i18n helpers --------
  const lang = () => (document.documentElement.lang === 'de' ? 'de' : 'en');
  function T(key, vars) {
    const pick = l => (typeof translations !== 'undefined' && translations[l] && translations[l].home && translations[l].home.live) ? translations[l].home.live[key] : undefined;
    let s = pick(lang()) || pick('en') || key;
    if (vars) for (const k in vars) s = s.split(`{${k}}`).join(vars[k]);
    return s;
  }
  const textHooks = [];
  const onText = f => { textHooks.push(f); f(); };
  // i18n.js applies translations on DOMContentLoaded; re-render after it, and on every switch
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => textHooks.forEach(f => f()), 0));
  document.addEventListener('i18n:change', () => textHooks.forEach(f => f()));
  const nf = (n, d = 0) => n.toLocaleString(lang() === 'de' ? 'de-DE' : 'en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });

  // -------- audio (opt-in) --------
  let AC = null, soundOn = false;
  function ensureAudio() { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; } }
  function tone(f, dur = .2, type = 'sine', vol = .08, when = 0, f2 = null) {
    if (!soundOn || !AC) return;
    const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .05);
  }
  function click(vol = .15) {
    if (!soundOn || !AC) return;
    const len = Math.floor(AC.sampleRate * .03), b = AC.createBuffer(1, len, AC.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    const s = AC.createBufferSource(), g = AC.createGain(); g.gain.value = vol; s.buffer = b; s.connect(g).connect(AC.destination); s.start();
  }
  function pathTone(fn, dur, when, vol = .045, scale = .5) {
    if (!soundOn || !AC) return;
    const t = AC.currentTime + when, o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine';
    for (let i = 0; i <= 24; i++) { const u = i / 24; o.frequency.setValueAtTime(fn(u) * scale, t + u * dur); }
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .03); g.gain.setValueAtTime(vol, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur + .05);
  }
  const sndNav = $('#sound-toggle'), sndHero = $('#hero-sound');
  function setSound(on) {
    soundOn = on;
    if (on) ensureAudio(); else stopWhistle();
    sndNav.setAttribute('aria-pressed', String(on));
    sndNav.querySelector('i').className = on ? 'fa fa-volume-high' : 'fa fa-volume-xmark';
    renderSoundLabel();
  }
  function renderSoundLabel() {
    const tr = typeof translations !== 'undefined' && translations[lang()] && translations[lang()].home;
    if (tr) sndHero.textContent = soundOn ? tr.hero.withoutSound : tr.hero.withSound;
  }
  onText(renderSoundLabel);
  sndNav.addEventListener('click', () => { setSound(!soundOn); if (soundOn) tone(660, .15, 'sine', .05); });
  sndHero.addEventListener('click', () => { setSound(!soundOn); if (soundOn) { tone(523, .25, 'sine', .05); tone(784, .35, 'sine', .04, .1); } });

  // -------- stage engine --------
  const stages = [];
  const vis = new IntersectionObserver(es => es.forEach(e => {
    const s = e.target._stage; if (!s) return;
    s.visible = e.isIntersecting;
    if (e.isIntersecting && s.onVisible) s.onVisible();
  }), { threshold: .05 });
  function stage(canvas, opts, ptrEl) {
    if (!canvas) return null;
    const s = Object.assign({ cv: canvas, ctx: canvas.getContext('2d'), w: 1, h: 1, visible: false, px: -1, py: -1 }, opts);
    canvas._stage = s;
    const fit = () => {
      const r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      s.w = Math.max(1, r.width); s.h = Math.max(1, r.height);
      canvas.width = Math.round(s.w * d); canvas.height = Math.round(s.h * d);
      s.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (s.resize) s.resize();
      try { s.draw(0, performance.now() / 1000); } catch (e) { /* first frame before data */ }
    };
    new ResizeObserver(fit).observe(canvas);
    vis.observe(canvas);
    const el = ptrEl || canvas;
    el.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); s.px = e.clientX - r.left; s.py = e.clientY - r.top; if (s.onMove) s.onMove(); });
    el.addEventListener('pointerleave', () => { s.px = -1; s.py = -1; if (s.onLeave) s.onLeave(); });
    if (s.onTap) canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); s.onTap(e.clientX - r.left, e.clientY - r.top); });
    stages.push(s);
    return s;
  }
  // redraw static frames after a theme switch (matters with reduced motion / offscreen)
  themeHooks.push(() => stages.forEach(s => { if (s.resize) s.resize(); try { s.draw(0, performance.now() / 1000); } catch (e) { /* ignore */ } }));
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    const t = now / 1000;
    if (!document.hidden) for (const s of stages) if (s.visible) s.draw(dt, t);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  const mono = (ctx, size = 11, color = C.dim) => { ctx.font = `${size}px ${MONO}`; ctx.fillStyle = color; };

  /* ---------- 00 hero scope ---------- */
  const heroHud = $('#hero-hud');
  stage($('#cv-hero'), {
    A: 40, k: .018,
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = rgba(C.paper, .045); ctx.lineWidth = 1; const g = 64;
      for (let x = (w % g) / 2; x < w; x += g) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, h); ctx.stroke(); }
      for (let y = (h % g) / 2; y < h; y += g) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(w, y + .5); ctx.stroke(); }
      let tA, tk;
      if (this.px >= 0) { tA = 8 + (1 - this.py / h) * Math.min(70, h * .09); tk = .005 + (this.px / w) * .05; }
      else { tA = 42 + (RM ? 0 : Math.sin(t * .6) * 16); tk = .018; }
      this.A += (tA - this.A) * Math.min(1, dt * 4); this.k += (tk - this.k) * Math.min(1, dt * 3);
      const mid = h - clamp(h * .14, 90, 130), tt = RM ? 0 : t;
      for (const [lw, al, bl] of [[6, .12, 30], [2, 1, 12]]) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const env = Math.pow(Math.sin(Math.PI * x / w), .7);
          const y = mid + this.A * env * (.8 * Math.sin(x * this.k - tt * 3) + .2 * Math.sin(x * this.k * 3.1 - tt * 5.3));
          x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
        }
        ctx.strokeStyle = rgba(C.phos, al); ctx.lineWidth = lw; glow(ctx, bl); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      if (heroHud) heroHud.textContent = `FREQ ×${(this.k / .018).toFixed(2)} · AMP ${Math.round(this.A)} PX`;
    }
  }, $('#home'));

  /* ---------- 01a EnOcean switch ---------- */
  const en = { press: 0, pulses: [], glow: 0, sent: 0, sparks: [] };
  const enStat = $('#e-stat');
  const enText = () => { enStat.innerHTML = T('enStat', { n: en.sent }); };
  onText(enText);
  function pressSwitch() {
    en.press = 1; en.pulses.push({ r: 0, hit: false }); en.sent++;
    for (let i = 0; i < 12; i++) en.sparks.push({ a: Math.random() * Math.PI * 2, l: 1, s: .6 + Math.random() * .8 });
    enText(); click(.2); tone(2600, .09, 'square', .025, .03, 3400);
  }
  $('#e-press').addEventListener('click', pressSwitch);
  stage($('#cv-enocean'), {
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      const sx = w * .24, sy = h * .58, lx = w * .76, ly = h * .42, dist = Math.hypot(lx - sx, ly - sy);
      const pw = clamp(w * .15, 46, 112), ph = pw * 1.4, bR = clamp(w * .055, 14, 40);
      ctx.strokeStyle = rgba(C.paper, .08); ctx.beginPath(); ctx.moveTo(0, h * .88); ctx.lineTo(w, h * .88); ctx.stroke();
      if (en.sent === 0 && !RM) { const u = (t % 2) / 2; ctx.strokeStyle = rgba(C.phos, (1 - u) * .5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx, sy, pw * .7 + u * pw * .6, 0, Math.PI * 2); ctx.stroke(); }
      for (const p of en.pulses) {
        p.r += dt * w * .6; const a = clamp(1 - p.r / (dist * 1.35), 0, 1);
        for (let k = 0; k < 3; k++) { const rr = p.r - k * 14; if (rr <= 0) continue; ctx.strokeStyle = rgba(C.phos, a * (1 - k * .3)); ctx.lineWidth = 2 - k * .5; ctx.beginPath(); ctx.arc(sx, sy, rr, -Math.PI * .45, Math.PI * .25); ctx.stroke(); }
        if (!p.hit && p.r >= dist) { p.hit = true; en.glow = 1; tone(1046, .5, 'sine', .05); tone(1568, .6, 'sine', .025, .05); }
      }
      if (RM) en.pulses.forEach(p => { if (!p.hit) { p.hit = true; en.glow = 1; } });
      en.pulses = en.pulses.filter(p => p.r < dist * 1.35 && !(RM && p.hit));
      ctx.fillStyle = rgba(C.paper, .07); ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(sx - pw / 2, sy - ph / 2, pw, ph, 8); ctx.fill(); ctx.stroke();
      const rw = pw * .62, rh = ph * .66, tilt = en.press * 7;
      ctx.fillStyle = rgba(C.paper, .12); ctx.beginPath(); ctx.roundRect(sx - rw / 2, sy - rh / 2, rw, rh, 5); ctx.fill();
      ctx.fillStyle = rgba(C.paper, .2 + en.press * .25); ctx.beginPath(); ctx.roundRect(sx - rw / 2, sy - rh / 2 + tilt, rw, rh / 2 - tilt, 5); ctx.fill();
      ctx.fillStyle = en.press > .05 ? C.phos : rgba(C.paper, .25); glow(ctx, en.press * 16); ctx.beginPath(); ctx.arc(sx, sy - ph / 2 + 12, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      for (const s of en.sparks) { s.l -= dt * 2.2; const r1 = pw * .5 + (1 - s.l) * 30 * s.s, r2 = r1 + 10 * s.s; ctx.strokeStyle = rgba(C.phos, Math.max(0, s.l)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx + Math.cos(s.a) * r1, sy + Math.sin(s.a) * r1); ctx.lineTo(sx + Math.cos(s.a) * r2, sy + Math.sin(s.a) * r2); ctx.stroke(); }
      en.sparks = en.sparks.filter(s => s.l > 0);
      ctx.strokeStyle = C.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lx, 0); ctx.lineTo(lx, ly - bR - 14); ctx.stroke();
      ctx.fillStyle = C.rule; ctx.fillRect(lx - bR * .45, ly - bR - 16, bR * .9, 16);
      if (en.glow > 0) { const gr = ctx.createRadialGradient(lx, ly, bR * .5, lx, ly, bR * 6); gr.addColorStop(0, rgba(C.phos, .45 * en.glow)); gr.addColorStop(1, rgba(C.phos, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(lx, ly, bR * 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = en.glow > 0 ? rgba(C.phos, .25 + .75 * en.glow) : rgba(C.paper, .08); ctx.strokeStyle = en.glow > 0 ? C.phos : C.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(lx, ly, bR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      mono(ctx, 10.5); ctx.textAlign = 'center'; ctx.fillText(T('cSwitch'), sx, Math.min(h - 8, sy + ph / 2 + 20)); ctx.fillText(T('cReceiver'), lx, ly + bR + 20); ctx.textAlign = 'left';
      en.glow = Math.max(0, en.glow - dt * .5); en.press = Math.max(0, en.press - dt * 3);
    },
    onTap(x, y) { const sx = this.w * .24, sy = this.h * .58; if (Math.hypot(x - sx, y - sy) < clamp(this.w * .15, 46, 112)) pressSwitch(); }
  });

  /* ---------- 01b KONUX rails ---------- */
  const kx = { x: null, prev: [], axles: 0, trains: 0, idle: 2.2, buf: new Float32Array(400) };
  const kStat = $('#k-stat');
  const kText = () => { kStat.innerHTML = T('kStat', { a: kx.axles, t: kx.trains }); };
  onText(kText);
  function sendTrain() { if (kx.x === null) { kx.x = -10; kx.prev = []; kx.idle = 0; } }
  $('#k-send').addEventListener('click', sendTrain);
  stage($('#cv-konux'), {
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      const railY = h * .44, sx = w * .55, carL = clamp(w * .2, 64, 170), gap = 6, cars = 4, carH = carL * .3, speed = w * .3;
      const offs = []; for (let c = 0; c < cars; c++) { const b = c * (carL + gap); for (const f of [.12, .26, .74, .88]) offs.push(b + f * carL); }
      const trainLen = cars * (carL + gap);
      if (kx.x === null && !RM) { kx.idle += dt; if (kx.idle > 3.2) sendTrain(); }
      if (kx.x !== null) kx.x += dt * speed * (RM ? 3 : 1);
      for (let x = 8; x < w; x += 24) { ctx.fillStyle = C.rule; ctx.fillRect(x, railY + 3, 13, 7); }
      ctx.fillStyle = C.dim; ctx.fillRect(0, railY - 3, w, 4);
      let amp = 0;
      if (kx.x !== null) {
        offs.forEach((o, i) => {
          const ax = kx.x - o, d = Math.abs(ax - sx);
          if (d < 28) amp += 1 - d / 28;
          const p = kx.prev[i];
          if (p !== undefined && p < sx && ax >= sx) { kx.axles++; tone(62, .16, 'sine', .14); kText(); }
          kx.prev[i] = ax;
        });
        for (let c = 0; c < cars; c++) {
          const x2 = kx.x - c * (carL + gap), x1 = x2 - carL, top = railY - 8 - carH;
          ctx.fillStyle = rgba(C.paper, .88); ctx.beginPath();
          if (c === 0) { ctx.moveTo(x1, top); ctx.lineTo(x2 - carH * .6, top); ctx.lineTo(x2, railY - 8 - carH * .25); ctx.lineTo(x2, railY - 10); ctx.lineTo(x1, railY - 10); }
          else ctx.rect(x1, top, carL, carH - 2);
          ctx.fill(); ctx.fillStyle = C.panel;
          for (let k = 0; k < 4; k++) { const wx = x1 + carL * .1 + k * carL * .2; ctx.fillRect(wx, top + carH * .2, carL * .13, carH * .3); }
          ctx.fillStyle = C.phos; ctx.fillRect(x1, railY - 14, carL, 2);
        }
        offs.forEach(o => { const ax = kx.x - o; ctx.fillStyle = C.panel; ctx.strokeStyle = C.dim; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(ax, railY - 6, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
        if (kx.x - trainLen > w + 20) { kx.x = null; kx.trains++; kText(); }
      }
      ctx.fillStyle = C.panel; ctx.strokeStyle = C.phos; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.roundRect(sx - 15, railY + 13, 30, 18, 3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = rgba(C.phos, .25 + Math.min(1, amp) * .75); glow(ctx, amp * 14); ctx.beginPath(); ctx.arc(sx, railY + 22, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      mono(ctx, 10.5); ctx.textAlign = 'center'; ctx.fillText(T('cSensor'), sx, railY + 46); ctx.textAlign = 'left';
      const n = Math.min(kx.buf.length, Math.floor(w / 3));
      if (!(RM && kx.x === null)) { kx.buf.copyWithin(0, 1); kx.buf[kx.buf.length - 1] = .05 + Math.random() * .05 + Math.min(1.2, amp) * .85 * (.55 + .45 * Math.random()); }
      const top = h * .68, bot = h * .95, mid = (top + bot) / 2, half = (bot - top) / 2;
      ctx.strokeStyle = rgba(C.paper, .06); ctx.beginPath(); ctx.moveTo(0, mid + .5); ctx.lineTo(w, mid + .5); ctx.stroke();
      ctx.strokeStyle = C.phos; ctx.lineWidth = 1.6; ctx.beginPath();
      for (let i = 0; i < n; i++) { const v = kx.buf[kx.buf.length - n + i] * half; const x = i * 3 + 1.5; ctx.moveTo(x, mid - v); ctx.lineTo(x, mid + v); }
      ctx.stroke();
      mono(ctx, 10.5); ctx.fillText(T('cVibration'), 10, top - 8); ctx.textAlign = 'right'; ctx.fillText(T('cTime'), w - 10, top - 8); ctx.textAlign = 'left';
    }
  });

  /* ---------- 01c Hula Earth spectrogram ---------- */
  const TYPES = [u => 2400 + 2600 * u, u => 4200 + 700 * Math.sin(u * Math.PI * 14), u => 6200 - 3000 * u * u, u => u < .45 ? 3100 : u < .55 ? 3600 : 4300, u => 3000 + 1800 * Math.sin(u * Math.PI), u => 5200 + 900 * Math.sin(u * Math.PI * 6) - 1200 * u];
  const hu = { calls: [], labels: [], count: 0, acc: 0, userF: null, lastCall: 0, pal: [] };
  const hStat = $('#h-stat');
  const hText = () => { hStat.innerHTML = T('hStat', { n: hu.count }); };
  onText(hText);
  function buildPalette() {
    hu.pal = [];
    const st = [[0, C.panel], [.3, C.moss], [.7, C.phos], [1, C.paper]];
    for (let i = 0; i < 48; i++) {
      const u = i / 47; let k = 0; while (k < st.length - 2 && u > st[k + 1][0]) k++;
      const [a, ca] = st[k], [b, cb] = st[k + 1];
      hu.pal.push(mix(ca, cb, (u - a) / (b - a)));
    }
  }
  buildPalette();
  themeHooks.push(buildPalette);
  function addCall(when, silent) {
    const fn = TYPES[Math.floor(Math.random() * TYPES.length)], dur = .35 + Math.random() * .8;
    let pk = 0; for (let i = 0; i <= 20; i++) pk = Math.max(pk, fn(i / 20));
    hu.calls.push({ t0: performance.now() / 1000 + when, dur, fn, peak: pk, done: false });
    if (!silent) pathTone(fn, dur, when);
  }
  $('#h-chorus').addEventListener('click', () => { let at = .15; for (let i = 0; i < 10; i++) { addCall(at, false); at += .3 + Math.random() * .55; } });
  let wOsc = null, wGain = null;
  function stopWhistle() { if (wOsc && AC) { wGain.gain.setTargetAtTime(0, AC.currentTime, .05); const o = wOsc; setTimeout(() => { try { o.stop(); } catch (e) { /* already stopped */ } }, 300); wOsc = null; } }
  stage($('#cv-hula'), {
    resize() {
      this.off = document.createElement('canvas'); this.off.width = Math.round(this.w); this.off.height = Math.round(this.h);
      this.ofx = this.off.getContext('2d'); this.ofx.fillStyle = C.panel; this.ofx.fillRect(0, 0, this.off.width, this.off.height);
      this.aT = 30; this.aB = this.h - 22;
    },
    fy(f) { return this.aB - f / 10000 * (this.aB - this.aT); },
    onMove() {
      if (this.px < 0) return;
      const f = clamp((this.aB - this.py) / (this.aB - this.aT) * 10000, 400, 9600); hu.userF = f;
      if (soundOn && AC) {
        if (!wOsc) { wOsc = AC.createOscillator(); wGain = AC.createGain(); wOsc.type = 'sine'; wGain.gain.value = 0; wOsc.connect(wGain).connect(AC.destination); wOsc.start(); wGain.gain.setTargetAtTime(.035, AC.currentTime, .05); }
        wOsc.frequency.setTargetAtTime(f * .5, AC.currentTime, .03);
      }
    },
    onLeave() { hu.userF = null; stopWhistle(); },
    draw(dt, t) {
      const { ctx, w, h } = this; if (!this.ofx) return;
      const W = this.off.width, H = this.off.height;
      if (!RM && t - hu.lastCall > 4.5 && hu.calls.length === 0) { hu.lastCall = t; addCall(.1, true); }
      if (hu.calls.length) hu.lastCall = t;
      hu.acc += dt * (RM && !hu.calls.length && hu.userF === null ? 0 : 90);
      let steps = Math.floor(hu.acc / 2); hu.acc -= steps * 2; steps = Math.min(steps, 6);
      const o = this.ofx;
      for (let s = 0; s < steps; s++) {
        o.drawImage(this.off, -2, 0); o.fillStyle = C.panel; o.fillRect(W - 2, 0, 2, H);
        const act = hu.calls.filter(c => t >= c.t0 && t <= c.t0 + c.dur);
        for (let y = this.aT; y < this.aB; y += 2) {
          const f = (this.aB - y) / (this.aB - this.aT) * 10000;
          let n = (.04 + .32 * Math.exp(-f / 650)) * Math.random();
          for (const c of act) { const u = (t - c.t0) / c.dur, fc = c.fn(u), env = Math.sin(Math.PI * u); n += env * (Math.exp(-(((f - fc) / 130) ** 2)) * 1.1 + Math.exp(-(((f - 2 * fc) / 150) ** 2)) * .3); }
          if (hu.userF !== null) n += Math.exp(-(((f - hu.userF) / 120) ** 2)) * .95;
          if (n < .05) continue;
          o.fillStyle = hu.pal[Math.min(47, Math.floor(n * 47))]; o.fillRect(W - 2, y, 2, 2);
        }
        for (const l of hu.labels) l.x -= 2;
      }
      for (const c of hu.calls) if (!c.done && t > c.t0 + c.dur) { c.done = true; hu.count++; hText(); const ly = this.fy(c.peak) - 8; if (!hu.labels.some(l => l.x > W - 120 && Math.abs(l.y - ly) < 16)) hu.labels.push({ x: W - 4, y: ly, text: `${T('cCall')} · ${(c.peak / 1000).toFixed(1)} kHz` }); }
      hu.calls = hu.calls.filter(c => !c.done); hu.labels = hu.labels.filter(l => l.x > -160);
      ctx.clearRect(0, 0, w, h); ctx.drawImage(this.off, 0, 0, w, h);
      for (const l of hu.labels) { ctx.strokeStyle = rgba(C.phos, .8); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(l.x, l.y + 4); ctx.lineTo(l.x, l.y + 14); ctx.stroke(); mono(ctx, 10.5, C.phos); ctx.textAlign = 'right'; ctx.fillText(l.text, l.x - 4, l.y + 4); ctx.textAlign = 'left'; }
      mono(ctx, 10.5);
      for (const f of [10000, 5000, 0]) { const y = this.fy(f); ctx.fillText(f ? f / 1000 + ' kHz' : '0', 10, f === 10000 ? y + 12 : y - 4); }
      ctx.textAlign = 'right'; ctx.fillText(T('cTime'), w - 10, h - 6); ctx.textAlign = 'left';
    }
  });

  /* ---------- 02 power budget ---------- */
  const TX_MA = 8, TX_MS = 4, CELL_MAH = 225;
  const P = { sleep: $('#p-sleep'), int: $('#p-int') };
  const pv = {};
  function calc() {
    pv.sleep = +P.sleep.value; pv.int = +P.int.value;
    pv.avg = pv.sleep + TX_MA * TX_MS / pv.int; // mA·ms/s = µA
    pv.years = CELL_MAH * 1000 / pv.avg / 8760;
    $('#o-sleep').textContent = nf(pv.sleep, pv.sleep % 1 ? 1 : 0) + ' µA';
    $('#o-int').textContent = pv.int >= 120 ? nf(pv.int / 60, (pv.int / 60) % 1 ? 1 : 0) + ' min' : pv.int + ' s';
    const y = pv.years;
    $('#p-years').innerHTML = (y >= 100 ? '100+' : y >= 10 ? nf(y, 1) : y >= 1 ? nf(y, 2) : nf(y * 365)) + `<small>${y >= 1 ? T('years') : T('days')}</small>`;
    const avg = pv.avg < 1000 ? `${nf(pv.avg, pv.avg < 10 ? 2 : 1)} µA` : `${nf(pv.avg / 1000, 2)} mA`;
    $('#p-note').innerHTML = T('budgetNote', { avg });
  }
  Object.values(P).forEach(i => i.addEventListener('input', calc));
  onText(calc);
  stage($('#cv-power'), {
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      const L = 60, R = 16, Tp = 40, B = 26, lo = -1, hi = 5;
      const yv = v => Tp + (1 - (Math.log10(v) - lo) / (hi - lo)) * (h - Tp - B);
      const labs = ['0.1 µA', '1 µA', '10 µA', '100 µA', '1 mA', '10 mA', '100 mA'];
      for (let i = 0; i <= 6; i++) { const y = yv(Math.pow(10, lo + i)); ctx.strokeStyle = rgba(C.paper, .07); ctx.beginPath(); ctx.moveTo(L, y + .5); ctx.lineTo(w - R, y + .5); ctx.stroke(); mono(ctx, 10.5); ctx.textAlign = 'right'; ctx.fillText(labs[i], L - 8, y + 4); }
      ctx.textAlign = 'left';
      const segW = (w - L - R) / 3, off = RM ? 0 : ((t * segW * .12) % segW), sw = Math.max(2.5, TX_MS / 1000 / pv.int * segW * 40);
      const ys = yv(pv.sleep), yt = yv(TX_MA * 1000);
      ctx.save(); ctx.beginPath(); ctx.rect(L, 0, w - L - R, h); ctx.clip();
      ctx.beginPath(); ctx.moveTo(L - segW, ys);
      for (let i = -1; i < 5; i++) { const x = L + i * segW - off + segW * .5; ctx.lineTo(x, ys); ctx.lineTo(x, yt); ctx.lineTo(x + sw, yt); ctx.lineTo(x + sw, ys); }
      ctx.lineTo(w + segW, ys);
      ctx.strokeStyle = C.phos; ctx.lineWidth = 2; glow(ctx, 10); ctx.stroke(); ctx.shadowBlur = 0;
      ctx.lineTo(w + segW, h - B); ctx.lineTo(L - segW, h - B); ctx.closePath(); ctx.fillStyle = rgba(C.phos, .08); ctx.fill();
      const ya = yv(pv.avg); ctx.setLineDash([5, 6]); ctx.strokeStyle = C.moss; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(L, ya); ctx.lineTo(w - R, ya); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      mono(ctx, 11, C.moss); ctx.textAlign = 'right'; ctx.fillText(T('cAverage'), w - R - 4, ya - 8);
      mono(ctx, 11, C.phos); ctx.fillText(T('cRadio'), w - R - 4, yt - 8);
      mono(ctx, 11, C.dim); ctx.fillText(T('cSleep'), w - R - 4, ys + 16); ctx.textAlign = 'left';
      mono(ctx, 10.5); ctx.fillText(T('cSpike'), L, h - 8);
    }
  });

  /* ---------- 03a bouldering ---------- */
  const HOLDS = [[.5, .9], [.3, .75], [.63, .72], [.45, .6], [.78, .56], [.22, .5], [.56, .45], [.37, .34], [.72, .32], [.18, .22], [.5, .22], [.84, .16], [.56, .08]];
  const START = 0, TOPH = HOLDS.length - 1;
  const shapes = HOLDS.map((_, i) => Array.from({ length: 7 }, (_, k) => .75 + .35 * Math.abs(Math.sin(i * 12.9898 + k * 78.233))));
  const cl = { route: [], done: false, flash: 0, bad: -1, doneT: 0, msg: ['climbStart'] };
  const cStat = $('#c-stat');
  const say = (key, vars) => { cl.msg = [key, vars]; cStat.innerHTML = T(key, vars); };
  onText(() => say(...cl.msg));
  $('#c-reset').addEventListener('click', () => { cl.route = []; cl.done = false; say('climbStart'); });
  stage($('#cv-climb'), {
    pos(i) { return [HOLDS[i][0] * this.w, (.14 + HOLDS[i][1] * .78) * this.h]; },
    reach() { return .2 * this.h + .05 * this.w; },
    onTap(x, y) {
      const hr = clamp(this.w * .05, 18, 30); let idx = -1, bd = 1e9;
      HOLDS.forEach((_, i) => { const [hx, hy] = this.pos(i); const d = Math.hypot(x - hx, y - hy); if (d < hr && d < bd) { bd = d; idx = i; } });
      if (idx < 0 || cl.done) return;
      if (!cl.route.length) {
        if (idx !== START) { say('climbNotStart'); cl.bad = idx; cl.flash = 1; tone(150, .15, 'square', .03); return; }
        cl.route.push(idx); tone(330, .12, 'triangle', .08); say('climbOn'); return;
      }
      const lastI = cl.route[cl.route.length - 1];
      if (idx === lastI && cl.route.length > 1) { cl.route.pop(); say('climbBack'); return; }
      if (cl.route.includes(idx)) return;
      const [a, b] = this.pos(lastI), [c, d] = this.pos(idx);
      if (Math.hypot(c - a, d - b) > this.reach()) { cl.bad = idx; cl.flash = 1; say('climbFar'); tone(150, .15, 'square', .03); return; }
      cl.route.push(idx); tone(330 + cl.route.length * 55, .12, 'triangle', .08);
      if (idx === TOPH) { cl.done = true; cl.doneT = performance.now() / 1000; say('climbTop', { n: cl.route.length - 1 }); [523, 659, 784].forEach((f, i) => tone(f, .4, 'sine', .06, i * .09)); }
      else say('climbMove', { n: cl.route.length - 1 });
    },
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      const ox = this.px >= 0 ? (this.px - w / 2) * .02 : 0, oy = this.py >= 0 ? (this.py - h / 2) * .02 : 0;
      ctx.fillStyle = rgba(C.paper, .08);
      for (let x = 18; x < w; x += 32) for (let y = 18; y < h; y += 32) { ctx.beginPath(); ctx.arc(x + ox, y + oy, 1.5, 0, Math.PI * 2); ctx.fill(); }
      const hrBase = clamp(w * .026, 8, 15);
      if (cl.route.length && !cl.done) { const [a, b] = this.pos(cl.route[cl.route.length - 1]); ctx.setLineDash([4, 7]); ctx.strokeStyle = rgba(C.moss, .5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a, b, this.reach(), 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      if (cl.route.length > 1) { ctx.strokeStyle = rgba(C.paper, .75); ctx.lineWidth = 2; ctx.beginPath(); cl.route.forEach((i, k) => { const [a, b] = this.pos(i); k ? ctx.lineTo(a, b) : ctx.moveTo(a, b); }); ctx.stroke(); }
      cl.flash = Math.max(0, cl.flash - dt * 2.5);
      HOLDS.forEach((_, i) => {
        const [hx, hy] = this.pos(i), r = hrBase * (i === START || i === TOPH ? 1.25 : 1), on = cl.route.includes(i);
        ctx.beginPath(); shapes[i].forEach((m, k) => { const a = k / 7 * Math.PI * 2 + i; const xx = hx + Math.cos(a) * r * m, yy = hy + Math.sin(a) * r * m * .85; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }); ctx.closePath();
        ctx.fillStyle = on ? C.phos : i === cl.bad && cl.flash > 0 ? rgba('#e8735a', .5 + cl.flash * .5) : rgba(C.moss, .85);
        glow(ctx, on ? 14 : 0); ctx.fill(); ctx.shadowBlur = 0;
        if (i === START || i === TOPH) { ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5; ctx.stroke(); mono(ctx, 10, C.paper); ctx.textAlign = 'center'; ctx.fillText(i === START ? 'START' : 'TOP', hx, i === START ? hy + r + 14 : hy - r - 6); ctx.textAlign = 'left'; }
      });
      if (cl.route.length) { const [a, b] = this.pos(cl.route[cl.route.length - 1]); const bob = RM ? 0 : Math.sin(t * 3) * 1.5; ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(a + hrBase * .9, b - hrBase * .9 + bob, 5, 0, Math.PI * 2); ctx.fill(); }
      if (cl.done && !RM) { const u = ((t - cl.doneT) % 1.6) / 1.6; const [a, b] = this.pos(TOPH); ctx.strokeStyle = rgba(C.phos, 1 - u); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(a, b, 10 + u * 50, 0, Math.PI * 2); ctx.stroke(); }
    }
  });

  /* ---------- 03b bike ---------- */
  const KM = 14;
  const elev = u => 620 + 880 * (u - Math.sin(2 * Math.PI * u) / (2 * Math.PI)) + 22 * Math.sin(u * 21) + 10 * Math.sin(u * 53 + 1);
  const bPos = $('#b-pos'); let riding = false;
  function bikeStat() {
    const u = bPos.value / 1000;
    const g = (elev(Math.min(1, u + .004)) - elev(Math.max(0, u - .004))) / (.008 * KM * 1000) * 100;
    $('#o-pos').textContent = nf(u * KM, 1) + ' km';
    $('#b-stat').innerHTML = T('bikeStat', { e: nf(Math.round(elev(u))), g: nf(g, 1) });
  }
  bPos.addEventListener('input', () => { riding = false; bikeStat(); });
  onText(bikeStat);
  $('#b-ride').addEventListener('click', () => { if (+bPos.value >= 1000) bPos.value = 0; riding = true; tone(392, .2, 'triangle', .05); });
  stage($('#cv-bike'), {
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      const L = 52, R = 14, Tp = 40, B = 36, emin = 500, emax = 1600;
      const X = u => L + u * (w - L - R), Y = e => Tp + (1 - (e - emin) / (emax - emin)) * (h - Tp - B);
      if (riding) { const v = +bPos.value + dt * 1000 / (RM ? 3 : 9); bPos.value = Math.min(1000, v); bikeStat(); if (v >= 1000) { riding = false; [523, 659, 784, 1046].forEach((f, i) => tone(f, .35, 'sine', .05, i * .1)); } }
      const u0 = bPos.value / 1000;
      mono(ctx, 10);
      for (const e of [600, 1000, 1400]) { const y = Y(e); ctx.strokeStyle = rgba(C.paper, .07); ctx.beginPath(); ctx.moveTo(L, y + .5); ctx.lineTo(w - R, y + .5); ctx.stroke(); ctx.textAlign = 'right'; ctx.fillText(nf(e) + ' m', L - 6, y + 4); }
      ctx.textAlign = 'center'; for (let k = 0; k <= KM; k += (w < 380 ? 7 : 2)) ctx.fillText(k + ' km', X(k / KM), h - B + 20); ctx.textAlign = 'left';
      const N = 200;
      const path = (to) => { ctx.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N * to; i ? ctx.lineTo(X(u), Y(elev(u))) : ctx.moveTo(X(u), Y(elev(u))); } };
      path(1); ctx.lineTo(X(1), h - B); ctx.lineTo(X(0), h - B); ctx.closePath();
      const gr = ctx.createLinearGradient(0, Tp, 0, h - B); gr.addColorStop(0, rgba(C.moss, .3)); gr.addColorStop(1, rgba(C.moss, .02)); ctx.fillStyle = gr; ctx.fill();
      path(1); ctx.strokeStyle = rgba(C.paper, .35); ctx.lineWidth = 1.5; ctx.stroke();
      path(Math.max(.001, u0)); ctx.strokeStyle = C.phos; ctx.lineWidth = 3; glow(ctx, 10); ctx.stroke(); ctx.shadowBlur = 0;
      const cx = X(u0), cy = Y(elev(u0));
      ctx.fillStyle = rgba(C.phos, .2); ctx.beginPath(); ctx.arc(cx, cy, 13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.phos; ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      const wy = cy - 20, sp = RM ? 0 : t * (riding ? 14 : 0); ctx.strokeStyle = C.paper; ctx.lineWidth = 1.5;
      for (const dx of [-8, 8]) { ctx.beginPath(); ctx.arc(cx + dx, wy, 5.5, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + dx, wy); ctx.lineTo(cx + dx + Math.cos(sp) * 5.5, wy + Math.sin(sp) * 5.5); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(cx - 8, wy); ctx.lineTo(cx - 2, wy - 8); ctx.lineTo(cx + 6, wy - 8); ctx.lineTo(cx + 8, wy); ctx.moveTo(cx - 2, wy - 8); ctx.lineTo(cx + 1, wy); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 3, wy - 19, 3, 0, Math.PI * 2); ctx.fillStyle = C.paper; ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 3, wy - 16); ctx.lineTo(cx - 1, wy - 9); ctx.lineTo(cx + 6, wy - 10); ctx.stroke();
      mono(ctx, 10.5, C.dim); ctx.textAlign = 'right'; ctx.fillText(T('cSummit'), w - R, Y(1580)); ctx.textAlign = 'left';
    }
  });

  /* ---------- 03c pizza ---------- */
  const pz = { tops: [], bake: 0, baking: false, count: 0 };
  const NUM = { cheese: 9, tomato: 6, mushroom: 6, basil: 5 };
  const pzText = () => { $('#pz-stat').innerHTML = T('pizzaStat', { n: pz.count }); };
  onText(pzText);
  $$('[data-top]').forEach(b => b.addEventListener('click', () => {
    const ty = b.dataset.top, now = performance.now() / 1000;
    for (let i = 0; i < NUM[ty]; i++) { const r = Math.sqrt(Math.random()) * .74, a = Math.random() * Math.PI * 2; pz.tops.push({ ty, x: Math.cos(a) * r, y: Math.sin(a) * r, rot: Math.random() * 6.28, born: now + i * .04, s: .85 + Math.random() * .3 }); }
    pz.count += NUM[ty];
    pz.tops.sort((p, q) => (p.ty === 'cheese' ? 0 : 1) - (q.ty === 'cheese' ? 0 : 1));
    pzText();
    for (let i = 0; i < 3; i++) tone(500 + Math.random() * 300, .06, 'triangle', .03, i * .05);
  }));
  $('#z-bake').addEventListener('click', () => { if (pz.bake < 1) { pz.baking = true; tone(110, 1.2, 'sawtooth', .015); } });
  $('#z-clear').addEventListener('click', () => { pz.tops = []; pz.bake = 0; pz.baking = false; pz.count = 0; pzText(); });
  const ease = u => { u = clamp(u, 0, 1); const c = 1.7; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
  stage($('#cv-pizza'), {
    draw(dt, t) {
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      if (pz.baking) { pz.bake = Math.min(1, pz.bake + dt / (RM ? .6 : 2.6)); if (pz.bake >= 1) { pz.baking = false; tone(1318, .5, 'sine', .06); tone(1760, .6, 'sine', .03, .08); } }
      const R = Math.min(w, h) * .36, cx = w / 2, cy = h / 2, b = pz.bake;
      if (pz.baking || b > 0) { const gr = ctx.createRadialGradient(cx, cy, R, cx, cy, R * 1.6); gr.addColorStop(0, rgba(C.phos, .18 * (pz.baking ? 1 : b * .5))); gr.addColorStop(1, rgba(C.phos, 0)); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, cy, R * 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, cy + R * .08, R * 1.02, R * .98, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = mix('#ead6aa', '#c98a3f', b); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
      if (b > .5) { ctx.fillStyle = `rgba(70,40,20,${(b - .5) * .9})`; for (let i = 0; i < 14; i++) { const a = i * 2.39, rr = R * (.9 + .06 * Math.sin(i * 7)); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, R * .025, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = mix('#c64a2e', '#9e3522', b); ctx.beginPath(); ctx.arc(cx, cy, R * .84, 0, Math.PI * 2); ctx.fill();
      for (const p of pz.tops) {
        const sc = (RM ? 1 : ease((t - p.born) * 5)) * p.s; if (sc <= 0) continue;
        ctx.save(); ctx.translate(cx + p.x * R, cy + p.y * R); ctx.rotate(p.rot); ctx.scale(sc, sc);
        if (p.ty === 'cheese') { const sp = 1 + b * .4; ctx.fillStyle = mix('#f4ecda', '#efd28c', b * .7); ctx.beginPath(); ctx.ellipse(0, 0, R * .11 * sp, R * .085 * sp, 0, 0, Math.PI * 2); ctx.fill(); }
        else if (p.ty === 'tomato') { ctx.fillStyle = mix('#d8432a', '#b8331f', b); ctx.beginPath(); ctx.arc(0, 0, R * .1, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#ec8a6c'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = '#f5c9a4'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * 1.57) * R * .045, Math.sin(k * 1.57) * R * .045, R * .018, R * .01, k * 1.57, 0, Math.PI * 2); ctx.fill(); } }
        else if (p.ty === 'mushroom') { ctx.fillStyle = mix('#e3cfae', '#c9a878', b); ctx.beginPath(); ctx.ellipse(0, -R * .01, R * .07, R * .05, 0, Math.PI, 0); ctx.lineTo(R * .025, R * .05); ctx.lineTo(-R * .025, R * .05); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#9c7d55'; ctx.lineWidth = 1.2; ctx.stroke(); }
        else if (p.ty === 'basil') { ctx.fillStyle = mix('#3f8f4b', '#2c6a35', b); ctx.beginPath(); ctx.ellipse(0, 0, R * .08, R * .038, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7cc086'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-R * .07, 0); ctx.lineTo(R * .07, 0); ctx.stroke(); }
        ctx.restore();
      }
      if (b >= 1 && !RM) { ctx.strokeStyle = rgba(C.paper, .3); ctx.lineWidth = 2; for (let k = 0; k < 3; k++) { const bx = cx + (k - 1) * R * .35, ph = (t * .6 + k * .33) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); for (let s = 0; s <= 16; s++) { const yy = cy - R * .95 - ph * R * .3 - s * 3; const xx = bx + Math.sin(s * .5 + t * 2 + k) * 6; s ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); } ctx.globalAlpha = 1; }
      mono(ctx, 10.5, b >= 1 ? C.phos : C.dim); ctx.textAlign = 'center';
      if (!pz.tops.length && b === 0) ctx.fillText(T('cPizzaEmpty'), cx, h - 10);
      else if (b >= 1) ctx.fillText(T('cPizzaReady'), cx, h - 10);
      ctx.textAlign = 'left';
    }
  });

  /* ---------- 06 finale particles ---------- */
  const fin = stage($('#cv-end'), {
    parts: [], played: false,
    rebuild() {
      const { w, h } = this; if (w < 10) return;
      const o = document.createElement('canvas'); o.width = Math.round(w); o.height = Math.round(h);
      const x = o.getContext('2d');
      const fs = Math.min(w * .3, h * .78);
      x.font = `780 ${fs}px ${DISP}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
      x.fillText('trmk', w / 2, h / 2 + fs * .04);
      const d = x.getImageData(0, 0, o.width, o.height).data, step = Math.max(4, Math.round(w / 190)), tg = [];
      for (let yy = 0; yy < o.height; yy += step) for (let xx = 0; xx < o.width; xx += step) if (d[(yy * o.width + xx) * 4 + 3] > 128) tg.push([xx, yy]);
      const cols = ['phos', 'phos', 'phos', 'moss', 'paper'];
      this.parts = tg.slice(0, 2200).map((p, i) => { const old = this.parts[i]; return { x: old ? old.x : Math.random() * w, y: old ? old.y : Math.random() * h, vx: 0, vy: 0, tx: p[0], ty: p[1], c: cols[i % cols.length], ph: Math.random() * 6.28 }; });
      if (RM) this.parts.forEach(p => { p.x = p.tx; p.y = p.ty; });
    },
    resize() { this.rebuild(); },
    onVisible() { if (!this.played && soundOn) { this.played = true; [392, 494, 587, 784].forEach((f, i) => tone(f, 1.6, 'sine', .035, i * .12)); } },
    draw(dt, t) {
      const { ctx, w, h } = this;
      ctx.fillStyle = rgba(C.panel, RM ? 1 : .35); ctx.fillRect(0, 0, w, h);
      const px = this.px, py = this.py;
      for (const p of this.parts) {
        const tx = p.tx + (RM ? 0 : Math.sin(t * 1.2 + p.ph) * 1.2), ty = p.ty + (RM ? 0 : Math.cos(t * 1.1 + p.ph) * 1.2);
        p.vx += (tx - p.x) * .045; p.vy += (ty - p.y) * .045;
        if (px >= 0) { const dx = p.x - px, dy = p.y - py, d2 = dx * dx + dy * dy; if (d2 < 9000) { const f = (9000 - d2) / 9000 * 4.5, dd = Math.sqrt(d2) || 1; p.vx += dx / dd * f; p.vy += dy / dd * f; } }
        p.vx *= .84; p.vy *= .84; p.x += p.vx; p.y += p.vy;
        ctx.fillStyle = C[p.c]; ctx.fillRect(p.x, p.y, 2.2, 2.2);
      }
      mono(ctx, 10.5); ctx.fillText(T('cFinale'), 12, h - 12);
    }
  });
  if (fin && document.fonts && document.fonts.ready) document.fonts.ready.then(() => fin.rebuild());

  /* ---------- footer battery joke ---------- */
  const t0 = performance.now();
  const battery = $('#battery');
  function batteryText() {
    const hours = (performance.now() - t0) / 3.6e6;
    const uah = (pv.avg || 2) * hours;
    const pct = 100 - uah / (CELL_MAH * 1000) * 100;
    battery.innerHTML = T('battery', { uah: nf(uah, uah < 1 ? 3 : 2), pct: nf(pct, 6) });
  }
  onText(batteryText);
  setInterval(batteryText, 1000);
})();
