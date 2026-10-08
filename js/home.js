// ============================================================
// HOME.JS — page chrome for index.html
// Theme toggle, mobile menu, scroll progress + spy, photo
// lightbox, viewfinder tile, blog links per language,
// Impressum toggle, Munich clock.
// The interactive canvases live in js/signals.js.
// ============================================================
(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.lang === 'de' ? 'de' : 'en');

  // -------- Theme toggle --------
  const themeToggle = $('#theme-toggle');
  const themeMeta = $('meta[name="theme-color"]');
  function applyTheme(theme) {
    themeToggle.querySelector('i').className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#12111d' : '#f2ede2';
  }
  applyTheme(document.documentElement.getAttribute('data-theme'));
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    applyTheme(next);
  });

  // -------- Hamburger menu --------
  const hamburger = $('#nav-hamburger');
  const navLinks = $('#nav-links');
  const closeMenu = () => { navLinks.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); };
  hamburger.addEventListener('click', () => {
    hamburger.setAttribute('aria-expanded', navLinks.classList.toggle('open'));
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('click', e => {
    if (!$('.site-nav').contains(e.target) && navLinks.classList.contains('open')) closeMenu();
  });

  // -------- Smooth in-page scroll --------
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
  });

  // -------- Scroll progress line + scroll-to-top --------
  const progress = $('#scope-progress');
  const scrollTopBtn = $('#scroll-top');
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    scrollTopBtn.classList.toggle('visible', scrollY > 600);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  scrollTopBtn.addEventListener('click', () => scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' }));

  // -------- Scroll-spy for nav --------
  const navItems = $$('.nav-links a[href^="#"]');
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navItems.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${id}`));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('#about, #budget, #life, #photo, #log').forEach(s => spy.observe(s));

  // -------- Photos: strip, viewfinder tile, lightbox --------
  const photos = $$('.strip .ph img');
  // Hide frames whose file is missing (e.g. local checkout without pictures/)
  photos.forEach(img => img.addEventListener('error', () => img.closest('.ph').remove(), { once: true }));
  const livePhotos = () => photos.filter(img => img.isConnected);

  const lb = $('#lightbox');
  const lbi = $('#lightbox-img');
  const lbDesc = $('#lightbox-desc');
  let lbIndex = 0;
  let lastFocus = null;

  function showPhoto(i) {
    const list = livePhotos();
    if (!list.length) return;
    lbIndex = (i + list.length) % list.length;
    lbi.src = list[lbIndex].src;
    lbi.alt = list[lbIndex].alt;
    lbDesc.textContent = list[lbIndex].alt || 'Photo';
  }
  function openLightbox(i) {
    if (!livePhotos().length) return;
    lastFocus = document.activeElement;
    showPhoto(i);
    lb.classList.add('open');
    lb.setAttribute('aria-describedby', 'lightbox-desc');
    $('#lightbox-close').focus();
  }
  function closeLightbox() {
    lb.classList.remove('open');
    lb.removeAttribute('aria-describedby');
    if (lastFocus) lastFocus.focus();
  }

  $$('.strip .ph').forEach(ph => {
    const open = () => openLightbox(livePhotos().indexOf(ph.querySelector('img')));
    ph.addEventListener('click', open);
    ph.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  });
  $('#lightbox-close').addEventListener('click', closeLightbox);
  $('#lightbox-prev').addEventListener('click', () => showPhoto(lbIndex - 1));
  $('#lightbox-next').addEventListener('click', () => showPhoto(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPhoto(lbIndex - 1);
    if (e.key === 'ArrowRight') showPhoto(lbIndex + 1);
  });

  // Viewfinder tile: cycles through the archive, opens the frame it shows
  const finder = $('#finder');
  const finderCap = $('#finder-cap');
  let finderIndex = 3; // start on the Dolomites
  const finderImgs = [];
  function finderShow(i) {
    const list = livePhotos();
    if (!list.length) { finderCap.textContent = ''; return; }
    finderIndex = (i + list.length) % list.length;
    let img = finderImgs[finderIndex];
    if (!img) {
      img = document.createElement('img');
      img.src = list[finderIndex].src;
      img.alt = '';
      img.decoding = 'async';
      img.addEventListener('error', () => img.remove(), { once: true });
      finder.insertBefore(img, finder.firstChild);
      finderImgs[finderIndex] = img;
    }
    finderImgs.forEach(x => x && x.classList.toggle('on', x === img));
    finderCap.textContent = list[finderIndex].alt;
  }
  const finderOpen = () => openLightbox(finderIndex);
  finder.addEventListener('click', finderOpen);
  finder.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finderOpen(); } });
  // Wait a tick so missing photos have a chance to drop out first
  setTimeout(() => {
    finderShow(finderIndex);
    if (!RM) setInterval(() => { if (!document.hidden) finderShow(finderIndex + 1); }, 4200);
  }, 600);

  // -------- Blog links follow the page language --------
  function blogLinks() {
    $$('[data-post]').forEach(a => { a.href = `./blog/${a.dataset.post}-${lang()}.html`; });
  }
  document.addEventListener('i18n:change', blogLinks);
  document.addEventListener('DOMContentLoaded', () => setTimeout(blogLinks, 0));

  // -------- Impressum toggle --------
  $('#impressum-toggle').addEventListener('click', function () {
    const content = $('#impressum-content');
    const open = content.classList.toggle('open');
    this.setAttribute('aria-expanded', open);
    content.setAttribute('aria-hidden', !open);
    this.textContent = open ? 'Impressum ↑' : 'Impressum ↓';
  });

  // -------- Local Munich time --------
  function updateTime() {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
    }).formatToParts(new Date());
    const get = t => (parts.find(p => p.type === t) || {}).value || '';
    $('#localtime').textContent = `${get('hour')}:${get('minute')}`;
    const tz = get('timeZoneName');
    $('#timezone').textContent = tz === 'GMT+2' ? 'CEST' : tz === 'GMT+1' ? 'CET' : tz;
  }
  updateTime();
  setInterval(updateTime, 30000);
})();
