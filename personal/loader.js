// The loader's 00–100 count, driven by the loader's own progress (see loader_patch in
// tools/personalize.py), and faded out the moment the mark starts to open onto the hero.
const count = document.querySelector('.home-loader__count');
if (count) {
  let shown = -1;
  addEventListener('sef:loader', ({ detail }) => {
    const v = Math.round(Math.min(1, detail.load) * 100);
    if (v !== shown) { shown = v; count.textContent = String(v).padStart(2, '0'); }
    if (detail.cut > 0.02) count.classList.add('is-done');
  });
}
