// Base-set holo cards: tilt + foil + glare driven by springs.
// Same idea as simeydotme's pokemon-cards-css (pointer -> CSS variables, blend modes),
// written from scratch. The foil is clipped to the art window like a 1999 holo.
import { Spring, prefersReducedMotion } from "./spring.js";

const MAX_TILT = 13; // degrees

function sparkleTexture() {
  // Procedural glitter so no third-party texture ships with the site.
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d");
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 520; i++) {
    const x = rand() * 256, y = rand() * 256, r = rand() < 0.08 ? 1.6 : 0.7;
    g.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.65})`;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    if (r > 1) {
      g.fillRect(x - 4, y - 0.35, 8, 0.7);
      g.fillRect(x - 0.35, y - 4, 0.7, 8);
    }
  }
  return c.toDataURL("image/png");
}

class HoloCard {
  constructor(el, reduced) {
    this.el = el;
    this.reduced = reduced;
    this.rx = new Spring(0, { damping: 1, response: 0.32 });
    this.ry = new Spring(0, { damping: 1, response: 0.32 });
    this.px = new Spring(50, { damping: 1, response: 0.32 });
    this.py = new Spring(50, { damping: 1, response: 0.32 });
    this.lift = new Spring(0, { damping: 1, response: 0.3 });
    this.press = new Spring(1, { damping: 1, response: 0.2 });
    this.active = false;
    this.raf = 0;
    this.last = 0;

    el.addEventListener("pointerenter", (e) => this.enter(e));
    el.addEventListener("pointermove", (e) => this.move(e));
    el.addEventListener("pointerleave", () => this.leave());
    el.addEventListener("pointercancel", () => this.leave());
    el.addEventListener("pointerdown", (e) => { this.press.target = 0.985; this.move(e, true); this.kick(); });
    el.addEventListener("pointerup", () => { this.press.target = 1; if (this.touch) this.leave(); this.kick(); });
  }

  enter(e) {
    this.touch = e.pointerType !== "mouse";
    this.active = true;
    this.lift.target = 1;
    this.move(e);
  }

  move(e, force = false) {
    if (!this.active && !force) return;
    if (force) { this.active = true; this.lift.target = 1; this.touch = e.pointerType !== "mouse"; }
    const r = this.el.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const y = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    const k = this.reduced ? 0.35 : 1;
    this.ry.target = (x - 0.5) * 2 * MAX_TILT * k;
    this.rx.target = -(y - 0.5) * 2 * MAX_TILT * k;
    this.px.target = x * 100;
    this.py.target = y * 100;
    this.kick();
  }

  leave() {
    this.active = false;
    this.lift.target = 0;
    this.rx.target = 0;
    this.ry.target = 0;
    this.px.target = 50;
    this.py.target = 50;
    this.kick();
  }

  // Scroll shimmer for phones: the foil catches light as the card travels.
  scrollTo(progress) {
    if (this.active) return;
    this.py.target = 20 + progress * 60;
    this.px.target = 35 + progress * 30;
    this.rx.target = (0.5 - progress) * 8;
    this.lift.target = 0.55;
    this.kick();
  }

  kick() {
    if (this.raf) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  frame(now) {
    this.raf = 0;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    const springs = [this.rx, this.ry, this.px, this.py, this.lift, this.press];
    springs.forEach((s) => s.step(dt));
    const s = this.el.style;
    const fromCenter = Math.min(1, Math.hypot(this.px.value - 50, this.py.value - 50) / 50);
    s.setProperty("--rx", `${this.rx.value.toFixed(2)}deg`);
    s.setProperty("--ry", `${this.ry.value.toFixed(2)}deg`);
    s.setProperty("--px", `${this.px.value.toFixed(2)}%`);
    s.setProperty("--py", `${this.py.value.toFixed(2)}%`);
    // Foil background moves less than the pointer, like light sliding across a surface.
    s.setProperty("--bx", `${(37 + (this.px.value / 100) * 26).toFixed(2)}%`);
    s.setProperty("--by", `${(33 + (this.py.value / 100) * 34).toFixed(2)}%`);
    s.setProperty("--lift", this.lift.value.toFixed(3));
    s.setProperty("--from-center", fromCenter.toFixed(3));
    s.setProperty("--press", this.press.value.toFixed(4));
    s.setProperty("--sx", `${(-this.ry.value * 0.07).toFixed(2)}rem`);
    if (!springs.every((sp) => sp.settled)) this.kick();
  }
}

export function mountHoloCards(selector = "[data-holo]") {
  const els = [...document.querySelectorAll(selector)];
  if (!els.length) return;
  document.documentElement.style.setProperty("--sparkle", `url(${sparkleTexture()})`);
  const reduced = prefersReducedMotion();
  const cards = els.map((el) => new HoloCard(el, reduced));

  // Phones have no hover: let scroll position drive the foil while a card is on screen.
  const coarse = window.matchMedia("(hover: none)").matches;
  if (!coarse || reduced) return;
  const onScreen = new Set();
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const card = cards[els.indexOf(entry.target)];
      if (entry.isIntersecting) onScreen.add(card); else onScreen.delete(card);
    });
  });
  els.forEach((el) => io.observe(el));
  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const vh = window.innerHeight;
      onScreen.forEach((card) => {
        const r = card.el.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        card.scrollTo(progress);
      });
    });
  }, { passive: true });
}
