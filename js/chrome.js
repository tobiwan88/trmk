// ============================================================
// CHROME.JS — shared nav behaviour for content pages
// (freelancing.html, cv.html): theme toggle, mobile menu,
// smooth in-page scroll. The homepage has its own js/home.js.
// ============================================================
(() => {
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // -------- Theme toggle --------
  const themeToggle = document.getElementById('theme-toggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function applyTheme(theme) {
    if (!themeToggle) return;
    themeToggle.querySelector('i').className = theme === 'dark' ? 'fa fa-sun' : 'fa fa-moon';
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#12111d' : '#f2ede2';
  }
  applyTheme(document.documentElement.getAttribute('data-theme'));
  if (themeToggle) themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    applyTheme(next);
  });

  // -------- Hamburger menu --------
  const hamburger = document.getElementById('nav-hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger && navLinks) {
    const closeMenu = () => { navLinks.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); };
    hamburger.addEventListener('click', () => hamburger.setAttribute('aria-expanded', navLinks.classList.toggle('open')));
    navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
      const nav = document.querySelector('.site-nav');
      if (nav && !nav.contains(e.target) && navLinks.classList.contains('open')) closeMenu();
    });
  }

  // -------- Smooth in-page scroll --------
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
  });
})();
