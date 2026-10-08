// ============================================================
// BLOG.JS — generated blog pages (templates/*.html)
// 1. Reading progress: the amber line under the nav on posts.
// 2. Post lists: show each article's title/link in the visitor's
//    language when a translation exists (English without JS).
// ============================================================
(() => {
  // -------- reading progress --------
  const bar = document.getElementById('read-progress');
  const body = document.querySelector('.blog-post-content');
  if (bar && body) {
    const update = () => {
      const r = body.getBoundingClientRect();
      const total = r.height - innerHeight * .6;
      const done = total > 0 ? (innerHeight * .4 - r.top) / total : 1;
      bar.style.transform = `scaleX(${Math.max(0, Math.min(1, done))})`;
    };
    addEventListener('scroll', update, { passive: true });
    addEventListener('resize', update);
    update();
  }

  // -------- language-aware post lists --------
  const items = [...document.querySelectorAll('[data-swap]')];
  if (!items.length) return;
  function swap() {
    const lang = document.documentElement.lang === 'de' ? 'de' : 'en';
    items.forEach(el => {
      const d = el.dataset;
      const pick = k => d[k + lang.charAt(0).toUpperCase() + lang.slice(1)] || d[k + 'En'] || d[k + 'De'];
      const title = pick('title'), href = pick('href'), desc = pick('desc');
      if (title) el.querySelectorAll('.swap-title').forEach(t => { t.textContent = title; });
      if (href) el.querySelectorAll('.swap-link').forEach(a => { a.href = href; });
      if (desc) el.querySelectorAll('.swap-desc').forEach(p => { p.textContent = desc; });
    });
  }
  document.addEventListener('DOMContentLoaded', () => setTimeout(swap, 0));
  document.addEventListener('i18n:change', swap);
})();
