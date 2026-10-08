// ============================================================
// CV.JS — cv.html
// Links the career timeline to the role cards: hovering or
// focusing a bar highlights its card, and the reverse.
// Clicking a bar is a plain #anchor link (works without JS).
// ============================================================
(() => {
  const segs = [...document.querySelectorAll('.tl-seg[data-job]')];
  const pair = id => [document.getElementById(id), ...segs.filter(s => s.dataset.job === id)];
  const set = (id, on) => pair(id).forEach(el => el && el.classList.toggle('hot', on));

  segs.forEach(seg => {
    const id = seg.dataset.job;
    ['pointerenter', 'focus'].forEach(ev => seg.addEventListener(ev, () => set(id, true)));
    ['pointerleave', 'blur'].forEach(ev => seg.addEventListener(ev, () => set(id, false)));
  });

  [...new Set(segs.map(s => s.dataset.job))].forEach(id => {
    const card = document.getElementById(id);
    if (!card) return;
    card.addEventListener('pointerenter', () => set(id, true));
    card.addEventListener('pointerleave', () => set(id, false));
  });
})();
