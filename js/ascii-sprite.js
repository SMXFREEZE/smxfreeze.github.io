// Animated Pokémon sprites (Gen V, via PokeAPI/sprites) and logo marks, redrawn as type.
// Each frame is sampled once into glyph + colour cells, then drawn with fillText.
import { prefersReducedMotion } from "./spring.js";

const RAMP = " .:-=+*#%@";
const CELL_ASPECT = 0.6; // glyph width / height for DM Mono

let manifestPromise;
const loadManifest = () =>
  (manifestPromise ??= fetch("./img/sprites/sprites.json").then((r) => r.json()));

const loadImage = (src) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = src;
});

function classify(r, g, b) {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (d) {
    if (max === r / 255) h = ((g - b) / 255 / d) % 6;
    else if (max === g / 255) h = (b - r) / 255 / d + 2;
    else h = (r - g) / 255 / d + 4;
    h = (h * 60 + 360) % 360;
  }
  if (l < 0.2) return 0;                         // outline: ink
  if (s > 0.32) {
    if (h >= 150 && h <= 265) return 3;          // wings, water: teal
    if (h > 40 && h < 75) return 2;              // flame tip: yellow
    if (h <= 40 || h >= 300) return 1;           // body: orange
  }
  return l > 0.72 ? 4 : 0;                       // cream belly, highlights: soft ink
}

export class AsciiSprite {
  constructor(canvas, { name, cols = 48, mode = "ink" } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.name = name;
    this.cols = cols;
    this.mode = mode;
    this.frame = 0;
    this.elapsed = 0;
    this.playing = false;
    this.visible = false;
    this.reduced = prefersReducedMotion();
    this.fit = canvas.hasAttribute("data-fit");
    this.palettes = null;
  }

  async load() {
    const manifest = await loadManifest();
    const spec = manifest[this.name];
    if (!spec) throw new Error(`No sprite ${this.name}`);
    const strip = await loadImage(`./img/sprites/${this.name}-strip.png`);
    this.spec = spec;
    const sx = spec.w / this.cols;
    const sy = sx / CELL_ASPECT;
    this.rows = Math.max(1, Math.round(spec.h / sy));
    // Sample every frame once.
    const work = document.createElement("canvas");
    work.width = spec.w;
    work.height = spec.h;
    const wg = work.getContext("2d", { willReadFrequently: true });
    this.frames = [];
    for (let f = 0; f < spec.frames; f++) {
      wg.clearRect(0, 0, spec.w, spec.h);
      wg.drawImage(strip, f * spec.w, 0, spec.w, spec.h, 0, 0, spec.w, spec.h);
      const data = wg.getImageData(0, 0, spec.w, spec.h).data;
      const glyphs = new Uint8Array(this.cols * this.rows);
      const tones = new Uint8Array(this.cols * this.rows);
      const levels = new Uint8Array(this.cols * this.rows);
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const x0 = Math.floor(col * sx), x1 = Math.max(x0 + 1, Math.floor((col + 1) * sx));
          const y0 = Math.floor(row * sy), y1 = Math.min(spec.h, Math.max(y0 + 1, Math.floor((row + 1) * sy)));
          let r = 0, g = 0, b = 0, a = 0, n = 0;
          for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
              const i = (y * spec.w + x) * 4;
              const alpha = data[i + 3] / 255;
              r += data[i] * alpha; g += data[i + 1] * alpha; b += data[i + 2] * alpha; a += alpha; n++;
            }
          }
          const cover = a / n;
          const idx = row * this.cols + col;
          if (cover < 0.3) continue;
          r /= a; g /= a; b /= a;
          const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
          const density = Math.max(0.14, Math.min(1, (0.96 - lum) / 0.78));
          glyphs[idx] = Math.max(1, Math.round(Math.pow(density, 1.05) * (RAMP.length - 1)));
          tones[idx] = classify(r, g, b);
          // Four ink strengths, like a grey photograph printed in type.
          levels[idx] = lum < 0.25 ? 3 : lum < 0.5 ? 2 : lum < 0.75 ? 1 : 0;
        }
      }
      this.frames.push({ glyphs, tones, levels });
    }
    this.readPalette();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
    new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.play(); else this.pause();
    }).observe(this.canvas);
    return this;
  }

  readPalette() {
    const css = getComputedStyle(document.documentElement);
    const v = (name) => css.getPropertyValue(name).trim();
    const ink = v("--ink"), soft = v("--ink-soft"), primary = v("--primary");
    // Printed like the reference's photos: one ink, with the palest areas held back.
    this.palettes = {
      ink: [ink, ink, ink, ink, soft],
      accent: [primary, primary, primary, primary, soft]
    };
    this.draw();
  }

  setMode(mode) {
    this.mode = mode;
    this.draw();
  }

  resize() {
    if (!this.spec) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = this.canvas.parentElement;
    const cs = getComputedStyle(parent);
    const availW = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const availH = parent.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    if (availW <= 0) return;
    let cellW = availW / this.cols;
    // Inside a frame, fit both ways so the sprite is never cropped.
    if (this.fit && availH > 0) cellW = Math.min(cellW, (availH * CELL_ASPECT) / this.rows);
    this.cellW = cellW;
    this.cellH = cellW / CELL_ASPECT;
    const cssW = this.cellW * this.cols;
    const cssH = this.cellH * this.rows;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
    this.canvas.width = Math.round(cssW * dpr);
    this.canvas.height = Math.round(cssH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.draw();
  }

  draw() {
    if (!this.frames || !this.cellW) return;
    const { ctx, cols, cellW, cellH } = this;
    const { glyphs, tones, levels } = this.frames[this.frame];
    const palette = (this.palettes && this.palettes[this.mode]) || this.palettes?.ink;
    if (!palette) return;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.font = `400 ${cellH * 0.9}px "DM Mono", ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const strength = [0.3, 0.5, 0.72, 0.92];
    // One fillStyle per tone, one alpha per strength.
    for (let tone = 0; tone < palette.length; tone++) {
      ctx.fillStyle = palette[tone];
      for (let level = 0; level < 4; level++) {
        ctx.globalAlpha = strength[level];
        for (let i = 0; i < glyphs.length; i++) {
          if (!glyphs[i] || tones[i] !== tone || levels[i] !== level) continue;
          const col = i % cols;
          const row = (i - col) / cols;
          ctx.fillText(RAMP[glyphs[i]], col * cellW + cellW / 2, row * cellH + cellH * 0.55);
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  play() {
    if (this.playing || this.reduced || !this.frames) return;
    this.playing = true;
    let last = performance.now();
    const tick = (now) => {
      if (!this.playing) return;
      this.elapsed += now - last;
      last = now;
      const duration = this.spec.durations[this.frame] || 90;
      if (this.elapsed >= duration) {
        this.elapsed -= duration;
        this.frame = (this.frame + 1) % this.frames.length;
        this.draw();
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
  }
}
