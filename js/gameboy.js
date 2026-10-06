// Hero: a DMG-01 Game Boy drawn as ASCII glyphs.
// Model: Snokke/game-boy-challenge (MIT), see img/gameboy/CREDITS.md.
// The plastic is type; the screen stays real pixels in Charizard's Super Game Boy palette.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Spring, VelocityTracker, project, rubberband, prefersReducedMotion } from "./spring.js";

const MODEL_SCALE = 4;           // model units -> roughly centimetres (DMG-01 is 9 x 14.8 cm)
const H = 14.8;
const W = 9;
const DEX = [
  { file: "charizard", no: "006", name: "CHARIZARD" },
  { file: "squirtle", no: "007", name: "SQUIRTLE" },
  { file: "pikachu", no: "025", name: "PIKACHU" },
  { file: "alakazam", no: "065", name: "ALAKAZAM" },
  { file: "porygon", no: "137", name: "PORYGON" }
];

const BUTTON_NAMES = {
  "button-start": "start",
  "button-select": "select",
  "button-a": "a",
  "button-b": "b",
  "button-cross-up": "up",
  "button-cross-down": "down",
  "button-cross-left": "left",
  "button-cross-right": "right"
};

/* ---------- the little screen ---------- */

class Screen {
  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.width = 160;
    this.canvas.height = 144;
    this.ctx = this.canvas.getContext("2d", { willReadFrequently: true });
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.sprites = [];
    this.index = 0;
    this.bootStart = performance.now();
    this.mode = "boot";
  }

  async load() {
    await Promise.all(DEX.map((mon, i) => new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.sprites[i] = img; resolve(); };
      img.onerror = resolve;
      img.src = `./img/sprites/${mon.file}-gen1.png`;
    })));
  }

  // Step through the Pokédex. During the "start" beat the Pokémon shows for a moment, then PRESS START returns.
  show(step) {
    if (this.mode === "boot") { this.skipBoot(); return; }
    this.index = (this.index + step + DEX.length) % DEX.length;
    this.peekUntil = performance.now() + 2600;
    this.flashUntil = 0;
    this.dirty = true;
  }

  next() { this.show(1); }
  prev() { this.show(-1); }

  // A short full-screen message, e.g. after START.
  flash(lines, ms = 1400) {
    this.mode = "title";
    this.flashLines = lines;
    this.flashUntil = performance.now() + ms;
    this.dirty = true;
  }

  get pending() { return Boolean(this.flashUntil || this.peekUntil); }

  skipBoot() { this.mode = "title"; this.dirty = true; }

  // "title" shows the Pokémon; "start" is the last beat of the scroll story.
  setScene(scene) {
    if (scene === this.scene) return;
    this.scene = scene;
    if (this.mode !== "boot") this.dirty = true;
  }

  update(now) {
    const g = this.ctx;
    if (this.mode === "boot") {
      // The DMG boot: a logo slides down from the top, then settles.
      const t = (now - this.bootStart) / 1000;
      const drop = Math.min(1, Math.max(0, (t - 0.35) / 1.5));
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 160, 144);
      g.fillStyle = "#000";
      g.font = '16px "Press Start 2P", monospace';
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("SEF", 80, -12 + drop * 76);
      if (drop >= 1) {
        g.font = '8px "Press Start 2P", monospace';
        g.fillText("PORTFOLIO", 80, 84);
      }
      if (t > 2.9) { this.mode = "title"; this.dirty = true; }
      this.quantize();
      return;
    }
    if (this.flashUntil && now >= this.flashUntil) { this.flashUntil = 0; this.dirty = true; }
    if (this.peekUntil && now >= this.peekUntil) { this.peekUntil = 0; this.dirty = true; }
    if (!this.dirty) return;
    this.dirty = false;
    if (this.flashUntil) {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 160, 144);
      g.fillStyle = "#000";
      g.textAlign = "center";
      g.textBaseline = "middle";
      const [big, small] = this.flashLines;
      g.font = '16px "Press Start 2P", monospace';
      g.fillText(big, 80, 64);
      if (small) {
        g.font = '8px "Press Start 2P", monospace';
        g.fillText(small, 80, 92);
      }
      this.quantize();
      return;
    }
    if (this.scene === "start" && !this.peekUntil) {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 160, 144);
      g.fillStyle = "#000";
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.font = '8px "Press Start 2P", monospace';
      g.fillText("SAMI EL-FIGHA", 80, 30);
      g.fillRect(24, 42, 112, 1);
      g.font = '16px "Press Start 2P", monospace';
      g.fillText("PRESS", 80, 70);
      g.fillText("START", 80, 92);
      g.font = '8px "Press Start 2P", monospace';
      g.fillText("ML HW SW", 80, 122);
      this.quantize();
      return;
    }
    const mon = DEX[this.index];
    const sprite = this.sprites[this.index];
    g.fillStyle = "#fff";
    g.fillRect(0, 0, 160, 144);
    g.fillStyle = "#000";
    g.textAlign = "center";
    g.textBaseline = "top";
    g.font = '8px "Press Start 2P", monospace';
    g.fillText("SAMI EL-FIGHA", 80, 8);
    g.fillRect(8, 20, 144, 1);
    if (sprite) {
      const s = sprite.width <= 40 ? 2 : 1.5;
      const w = Math.round(sprite.width * s), h = Math.round(sprite.height * s);
      g.imageSmoothingEnabled = false;
      g.drawImage(sprite, Math.round(80 - w / 2), Math.round(76 - h / 2), w, h);
    }
    g.textAlign = "left";
    g.fillText(`No.${mon.no}`, 10, 118);
    g.textAlign = "right";
    g.fillText(mon.name, 150, 118);
    g.fillRect(8, 132, 144, 1);
    this.quantize();
  }

  // Snap to the four LCD shades (1 = lightest).
  quantize() {
    const g = this.ctx;
    const img = g.getImageData(0, 0, 160, 144);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const l = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
      const v = l > 0.82 ? 1 : l > 0.58 ? 0.66 : l > 0.3 ? 0.33 : 0;
      d[i] = d[i + 1] = d[i + 2] = v * 255;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    this.texture.needsUpdate = true;
  }
}

/* ---------- glyph atlas ---------- */

// Code punctuation, light to heavy.
const RAMP_SOURCE = " .,'-_:;=<>+/|()?*[]{}#%08@";
const EDGE_GLYPHS = ["-", "/", "|", "\\"];

function buildAtlas(cellW, cellH, levels = 14) {
  const measure = document.createElement("canvas");
  measure.width = cellW;
  measure.height = cellH;
  const mg = measure.getContext("2d", { willReadFrequently: true });
  const font = `400 ${Math.round(cellH * 0.92)}px "DM Mono", ui-monospace, monospace`;
  const draw = (g, ch, x) => {
    g.font = font;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#fff";
    g.fillText(ch, x + cellW / 2, cellH / 2 + cellH * 0.04);
  };
  const scored = [...RAMP_SOURCE].map((ch) => {
    mg.clearRect(0, 0, cellW, cellH);
    draw(mg, ch, 0);
    const d = mg.getImageData(0, 0, cellW, cellH).data;
    let sum = 0;
    for (let i = 3; i < d.length; i += 4) sum += d[i];
    return { ch, ink: sum };
  }).sort((a, b) => a.ink - b.ink);
  const max = scored[scored.length - 1].ink || 1;
  const ramp = [" "];
  for (let i = 1; i < levels; i++) {
    const want = (i / (levels - 1)) * max;
    let best = scored[1];
    for (const s of scored) if (s.ch !== " " && Math.abs(s.ink - want) < Math.abs(best.ink - want)) best = s;
    if (!ramp.includes(best.ch)) ramp.push(best.ch);
  }
  const glyphs = [...ramp, ...EDGE_GLYPHS];
  const atlas = document.createElement("canvas");
  atlas.width = cellW * glyphs.length;
  atlas.height = cellH;
  const ag = atlas.getContext("2d");
  glyphs.forEach((ch, i) => draw(ag, ch, i * cellW));
  const tex = new THREE.CanvasTexture(atlas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  return { texture: tex, count: glyphs.length, rampCount: ramp.length };
}

const asciiFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D tScene;
  uniform sampler2D tGlyphs;
  uniform vec2 uResolution;
  uniform vec2 uCell;
  uniform float uGlyphCount;
  uniform float uRampCount;
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform vec3 uAccent2;
  uniform vec3 uLcd0;
  uniform vec3 uLcd1;
  uniform vec3 uLcd2;
  uniform vec3 uLcd3;
  uniform float uReveal;
  uniform float uWhite;
  uniform float uBlack;
  uniform float uGamma;
  uniform float uEdge;
  uniform float uHighlight;

  vec4 tap(vec2 px) { return texture2D(tScene, px / uResolution); }

  vec4 cellColor(vec2 cell) {
    vec2 base = cell * uCell;
    vec2 q = uCell * 0.25;
    return 0.25 * (tap(base + q) + tap(base + vec2(3.0 * q.x, q.y)) + tap(base + vec2(q.x, 3.0 * q.y)) + tap(base + 3.0 * q));
  }

  float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

  float signal(vec2 cell) {
    vec4 c = cellColor(cell);
    vec3 col = c.rgb / max(c.a, 0.001);
    return c.a * (0.35 + 0.65 * pow(luma(col), 0.4545));
  }

  bool isLcd(vec4 p) { return p.a > 0.9 && p.r < 0.03 && p.b > 0.85; }

  void main() {
    vec2 frag = gl_FragCoord.xy;
    vec4 px = tap(frag);

    // The LCD is the one real thing on the device: keep it as pixels.
    if (isLcd(px)) {
      float v = px.g;
      vec3 lcd = v > 0.83 ? uLcd0 : v > 0.5 ? uLcd1 : v > 0.16 ? uLcd2 : uLcd3;
      gl_FragColor = vec4(lcd, 1.0) * uReveal;
      return;
    }

    vec2 cell = floor(frag / uCell);
    vec4 c = cellColor(cell);
    if (c.a < 0.06) { gl_FragColor = vec4(0.0); return; }
    vec3 col = c.rgb / max(c.a, 0.001);
    float l = pow(luma(col), 0.4545);
    float maxc = max(col.r, max(col.g, col.b));
    float minc = min(col.r, min(col.g, col.b));
    float sat = (maxc - minc) / (maxc + 0.0001);

    // Sobel across the cell grid: strong edges are drawn with directional strokes.
    float s00 = signal(cell + vec2(-1.0, -1.0));
    float s10 = signal(cell + vec2(0.0, -1.0));
    float s20 = signal(cell + vec2(1.0, -1.0));
    float s01 = signal(cell + vec2(-1.0, 0.0));
    float s21 = signal(cell + vec2(1.0, 0.0));
    float s02 = signal(cell + vec2(-1.0, 1.0));
    float s12 = signal(cell + vec2(0.0, 1.0));
    float s22 = signal(cell + vec2(1.0, 1.0));
    float gx = (s20 + 2.0 * s21 + s22) - (s00 + 2.0 * s01 + s02);
    float gy = (s02 + 2.0 * s12 + s22) - (s00 + 2.0 * s10 + s20);
    float mag = length(vec2(gx, gy));

    float glyph;
    if (mag > uEdge) {
      float a = mod(atan(gy, gx) + 1.5707963 + 3.14159265, 3.14159265);
      glyph = uRampCount + mod(floor(a / 0.78539816 + 0.5), 4.0);
    } else {
      // Levels, like an engraving: lit plastic is a light stipple, the bezel a mid tone,
      // only the D-pad and shadows go dense. Printed colour never drops below mid.
      float density = pow(clamp((uWhite - l) / (uWhite - uBlack), 0.0, 1.0), uGamma);
      if (sat > 0.4) density = max(density, 0.42);
      glyph = clamp(floor(density * (uRampCount - 1.0) + 0.5), 1.0, uRampCount - 1.0);
    }

    vec2 inCell = fract(frag / uCell);
    float ink = texture2D(tGlyphs, vec2((glyph + inCell.x) / uGlyphCount, inCell.y)).a;

    vec3 tone = uInk;
    if (sat > 0.4 && col.r >= maxc - 0.0001) tone = uAccent;          // printing, A/B caps
    else if (sat > 0.35 && col.b >= maxc - 0.0001) tone = uAccent2;   // teal stripe
    else if (l > uHighlight) tone = uAccent;                           // hot highlights glow

    float alpha = ink * smoothstep(0.06, 0.3, c.a) * uReveal;
    gl_FragColor = vec4(tone * alpha, alpha);
  }
`;

/* ---------- model ---------- */

async function loadModel(screenTexture) {
  const loader = new GLTFLoader();
  const texLoader = new THREE.TextureLoader();
  const [gltf, baked] = await Promise.all([
    loader.loadAsync("./img/gameboy/game-boy.glb"),
    texLoader.loadAsync("./img/gameboy/baked-sef.jpg")
  ]);
  baked.flipY = false;
  baked.colorSpace = THREE.SRGBColorSpace;
  baked.anisotropy = 4;
  const shell = new THREE.MeshLambertMaterial({ map: baked });
  const lcd = new THREE.ShaderMaterial({
    uniforms: { map: { value: screenTexture } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    // Tag the LCD (r = 0, b = 1) so the ASCII pass keeps it as pixels.
    fragmentShader: "uniform sampler2D map; varying vec2 vUv; void main(){ float v = texture2D(map, vUv).r; gl_FragColor = vec4(0.0, v, 1.0, 1.0); }"
  });
  const model = gltf.scene;
  const buttons = {};
  model.traverse((node) => {
    if (!node.isMesh) return;
    node.material = node.name === "screen" ? lcd : shell;
    if (node.name.startsWith("button-")) buttons[node.name] = { mesh: node, z: node.position.z };
  });
  // Hit boxes a little larger than each cap, so small buttons are easy to press.
  const hitMaterial = new THREE.MeshBasicMaterial();
  const hitBoxes = [];
  for (const [name, { mesh }] of Object.entries(buttons)) {
    mesh.geometry.computeBoundingBox();
    const box = mesh.geometry.boundingBox;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3()).add(mesh.position);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x + 0.1, size.y + 0.1, size.z + 0.16), hitMaterial);
    hit.position.copy(center);
    hit.layers.set(1);
    hit.userData.button = BUTTON_NAMES[name];
    model.add(hit);
    hitBoxes.push(hit);
  }
  // Map the screen plane 0..1 from its own bounds so the 160x144 canvas fills it.
  const screen = model.getObjectByName("screen");
  if (screen) {
    const pos = screen.geometry.attributes.position;
    const box = new THREE.Box3().setFromBufferAttribute(pos);
    const uv = new Float32Array(pos.count * 2);
    for (let i = 0; i < pos.count; i++) {
      uv[i * 2] = (pos.getX(i) - box.min.x) / (box.max.x - box.min.x);
      uv[i * 2 + 1] = (pos.getY(i) - box.min.y) / (box.max.y - box.min.y);
    }
    screen.geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  }
  model.scale.setScalar(MODEL_SCALE);
  const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  model.position.sub(center);
  return { model, buttons, hitBoxes };
}

/* ---------- mount ---------- */

export async function mountGameBoy(canvas, { onReady } = {}) {
  const reduced = prefersReducedMotion();
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  } catch (err) {
    return null;
  }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }

  await Promise.race([
    Promise.all([
      document.fonts.load('400 12px "DM Mono"'),
      document.fonts.load('8px "Press Start 2P"')
    ]).catch(() => {}),
    new Promise((r) => setTimeout(r, 2500))
  ]);

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

  const screen = new Screen();
  let model, buttons, hitBoxes;
  try {
    [{ model, buttons, hitBoxes }] = await Promise.all([loadModel(screen.texture), screen.load()]);
  } catch (err) {
    renderer.dispose();
    return null;
  }

  const scene = new THREE.Scene();
  const pivot = new THREE.Group();
  pivot.add(model);
  scene.add(pivot);
  // The baked texture carries the occlusion; live light adds a sheen that follows the turn.
  // (Lambert divides by PI, hence the large-looking intensities.)
  const ambient = new THREE.AmbientLight(0xffffff, 3.0);
  scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(-5, 7, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.6);
  rim.position.set(8, -1, -2);
  scene.add(rim);

  const camera = new THREE.PerspectiveCamera(26, 1, 1, 200);
  const target = new THREE.WebGLRenderTarget(2, 2, { samples: 4 });

  const post = new THREE.ShaderMaterial({
    uniforms: {
      tScene: { value: target.texture },
      tGlyphs: { value: null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uCell: { value: new THREE.Vector2(6, 10) },
      uGlyphCount: { value: 1 },
      uRampCount: { value: 1 },
      uInk: { value: new THREE.Color() },
      uAccent: { value: new THREE.Color() },
      uAccent2: { value: new THREE.Color() },
      uLcd0: { value: new THREE.Color() },
      uLcd1: { value: new THREE.Color() },
      uLcd2: { value: new THREE.Color() },
      uLcd3: { value: new THREE.Color() },
      uReveal: { value: reduced ? 1 : 0 },
      uWhite: { value: 0.9 },
      uBlack: { value: 0.22 },
      uGamma: { value: 1.15 },
      uEdge: { value: 1.1 },
      uHighlight: { value: 0.97 }
    },
    vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: asciiFragment,
    depthTest: false,
    depthWrite: false,
    transparent: true
  });
  const quadGeo = new THREE.BufferGeometry();
  quadGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const quad = new THREE.Mesh(quadGeo, post);
  quad.frustumCulled = false;
  const postScene = new THREE.Scene();
  postScene.add(quad);
  const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const readColors = () => {
    const css = getComputedStyle(document.documentElement);
    const u = post.uniforms;
    // The post pass writes straight to the canvas: hand it raw sRGB numbers.
    const set = (uniform, name, fallback) =>
      uniform.value.copy(new THREE.Color(css.getPropertyValue(name).trim() || fallback)).convertLinearToSRGB();
    set(u.uInk, "--ascii-ink", "#333333");
    set(u.uAccent, "--ascii-flame", "#e0602e");
    set(u.uAccent2, "--ascii-teal", "#2f6f8f");
    set(u.uLcd0, "--lcd-0", "#fff7ea");
    set(u.uLcd1, "--lcd-1", "#ffa552");
    set(u.uLcd2, "--lcd-2", "#d65231");
    set(u.uLcd3, "--lcd-3", "#191010");
  };
  readColors();

  /* scroll story: poses the console passes through as the hero scrolls */
  // x / y are fractions of the visible half-width / half-height; yaw keeps turning one way.
  const STORY = {
    landscape: [
      { p: 0.0, yaw: -0.38, pitch: 0.1, roll: -0.18, s: 1, x: 0, y: -0.02 },
      { p: 0.1, yaw: -0.62, pitch: 0.1, roll: -0.16, s: 1, x: 0, y: -0.02 },
      { p: 0.27, yaw: -1.5, pitch: 0.06, roll: -0.04, s: 0.9, x: 0.4, y: 0.04 },
      { p: 0.47, yaw: -3.05, pitch: 0.2, roll: 0.1, s: 0.88, x: -0.4, y: -0.02 },
      { p: 0.67, yaw: -5.9, pitch: -1.02, roll: 0.55, s: 0.98, x: 0.38, y: 0.02 },
      { p: 0.86, yaw: -Math.PI * 2, pitch: 0.02, roll: 0, s: 0.8, x: 0, y: 0.25 },
      { p: 1.0, yaw: -Math.PI * 2, pitch: 0.02, roll: 0, s: 0.8, x: 0, y: 0.25 }
    ],
    portrait: [
      { p: 0.0, yaw: -0.38, pitch: 0.1, roll: -0.18, s: 1, x: 0, y: 0.16 },
      { p: 0.1, yaw: -0.62, pitch: 0.1, roll: -0.16, s: 1, x: 0, y: 0.16 },
      { p: 0.27, yaw: -1.5, pitch: 0.06, roll: -0.04, s: 0.86, x: 0, y: 0.3 },
      { p: 0.47, yaw: -3.05, pitch: 0.2, roll: 0.1, s: 0.86, x: 0, y: 0.3 },
      { p: 0.67, yaw: -5.9, pitch: -1.02, roll: 0.55, s: 0.92, x: 0, y: 0.3 },
      { p: 0.86, yaw: -Math.PI * 2, pitch: 0.02, roll: 0, s: 0.9, x: 0, y: 0.32 },
      { p: 1.0, yaw: -Math.PI * 2, pitch: 0.02, roll: 0, s: 0.9, x: 0, y: 0.32 }
    ]
  };
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const KEYS = ["yaw", "pitch", "roll", "s", "x", "y"];
  const poseAt = (frames, p) => {
    let i = 0;
    while (i < frames.length - 2 && p > frames[i + 1].p) i++;
    const a = frames[i], b = frames[i + 1];
    const t = ease(Math.min(1, Math.max(0, (p - a.p) / (b.p - a.p))));
    const out = {};
    for (const k of KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
    return out;
  };

  let portrait = false;
  let halfW = 1, halfH = 1;
  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const cssW = Math.max(1, rect.width);
    const cssH = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(cssW, cssH, false);
    const pw = Math.round(cssW * dpr), ph = Math.round(cssH * dpr);
    target.setSize(pw, ph);
    // Same grid as the reference: about width/6 by height/9.
    const cell = cssW < 640 ? { w: 5, h: 8 } : { w: 6, h: 9 };
    const cw = Math.round(cell.w * dpr), ch = Math.round(cell.h * dpr);
    const atlas = buildAtlas(cw, ch);
    post.uniforms.tGlyphs.value?.dispose();
    post.uniforms.tGlyphs.value = atlas.texture;
    post.uniforms.uGlyphCount.value = atlas.count;
    post.uniforms.uRampCount.value = atlas.rampCount;
    post.uniforms.uCell.value.set(cw, ch);
    post.uniforms.uResolution.value.set(pw, ph);

    camera.aspect = cssW / cssH;
    portrait = cssW < cssH * 0.9;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const fitH = (H / (portrait ? 0.5 : 0.7)) / 2 / Math.tan(halfFov);
    const fitW = ((W * 1.3) / (portrait ? 0.8 : 0.42)) / 2 / Math.tan(halfFov) / camera.aspect;
    const dist = Math.max(fitH, fitW);
    camera.position.set(0, 0, dist);
    camera.updateProjectionMatrix();
    halfH = dist * Math.tan(halfFov);
    halfW = halfH * camera.aspect;
    requestRender();
  };

  /* motion */
  const progress = new Spring(0, { damping: 1, response: 0.32 });   // follows the scroll
  const spinYaw = new Spring(reduced ? 0 : 0.9, { damping: 1, response: 1.1 }); // drag offset + entrance
  const spinPitch = new Spring(0, { damping: 1, response: 0.6 });
  const hoverYaw = new Spring(0, { damping: 1, response: 0.6 });
  const hoverPitch = new Spring(0, { damping: 1, response: 0.6 });
  const press = new Spring(1, { damping: 1, response: 0.25 });
  spinYaw.target = 0;
  let dragging = null;
  const tracker = new VelocityTracker();
  const RAD_PER_PX = 0.0085;
  const TAU = Math.PI * 2;

  // Each cap travels on its own spring: down on press, back up on release.
  const travel = {};
  for (const name of Object.values(BUTTON_NAMES)) travel[name] = new Spring(0, { damping: 1, response: 0.12 });
  const meshesFor = Object.fromEntries(Object.entries(BUTTON_NAMES).map(([mesh, name]) => [name, buttons[mesh]]));
  const DPAD = ["up", "down", "left", "right"];

  const raycaster = new THREE.Raycaster();
  raycaster.layers.enableAll();
  const ndc = new THREE.Vector2();
  const buttonAt = (e) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    scene.updateMatrixWorld();
    raycaster.setFromCamera(ndc, camera);
    // Test the shell too, so a press can't go through the back of the console.
    const hit = raycaster.intersectObjects([...hitBoxes, model], true)[0];
    if (!hit) return null;
    return hit.object.userData.button || BUTTON_NAMES[hit.object.name] || null;
  };

  const emit = (button) =>
    canvas.dispatchEvent(new CustomEvent("gameboy:button", { detail: { button, mon: DEX[screen.index] } }));

  // What each button does. START opens the portfolio; the page listens for it.
  const pressButton = (button) => {
    switch (button) {
      case "start":
        screen.flash(["START", "LOADING..."]);
        break;
      case "a":
      case "select":
      case "right":
        screen.next();
        break;
      case "b":
      case "left":
        screen.prev();
        break;
      default:
        break; // up / down move the story; handled by the page
    }
    emit(button);
    requestRender();
  };

  // Keyboard presses animate the cap too.
  const tapButton = (button) => {
    travel[button].target = 1;
    setTimeout(() => { travel[button].target = 0; requestRender(); }, 120);
    pressButton(button);
  };

  const onPointerMove = (e) => {
    if (dragging) {
      const dx = e.clientX - dragging.x;
      const dy = e.clientY - dragging.y;
      if (!dragging.moved && Math.hypot(dx, dy) > 6) {
        dragging.moved = true;
        canvas.classList.add("is-grabbing");
        // Dragging off a button cancels it, like a real tap.
        if (dragging.button) { travel[dragging.button].target = 0; dragging.button = null; }
        press.target = 0.985;
      }
      if (dragging.moved) {
        tracker.add(e.clientX, e.clientY);
        spinYaw.set(dragging.yaw + dx * RAD_PER_PX);
        const p = dragging.pitch + dy * RAD_PER_PX * 0.7;
        const limit = 0.5;
        spinPitch.set(Math.abs(p) > limit ? Math.sign(p) * (limit + rubberband(Math.abs(p) - limit, 1.2)) : p);
      }
      requestRender();
      return;
    }
    if (reduced || e.pointerType !== "mouse") return;
    hoverYaw.target = (e.clientX / window.innerWidth - 0.5) * 0.28;
    hoverPitch.target = (e.clientY / window.innerHeight - 0.5) * 0.16;
    canvas.classList.toggle("is-over-button", Boolean(buttonAt(e)));
    requestRender();
  };

  canvas.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    const button = buttonAt(e);
    dragging = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: spinYaw.value, pitch: spinPitch.value, moved: false, button };
    tracker.reset();
    tracker.add(e.clientX, e.clientY);
    // Feedback on press, not on release: the cap goes down, or the whole console gives a little.
    if (button) travel[button].target = 1;
    else press.target = 0.975;
    requestRender();
  });

  const release = (e, cancelled = false) => {
    if (!dragging || e.pointerId !== dragging.id) return;
    const { moved: wasDrag, button } = dragging;
    dragging = null;
    canvas.classList.remove("is-grabbing");
    press.target = 1;
    if (button) travel[button].target = 0;
    if (!wasDrag) {
      if (!cancelled) {
        if (button) pressButton(button);
        else { screen.next(); emit("screen"); }
      }
      requestRender();
      return;
    }
    const v = tracker.get();
    const angularVelocity = cancelled || reduced ? 0 : v.x * RAD_PER_PX;
    // Throw it: project where the spin would coast to, then settle on the nearest whole turn,
    // so the console always lands back on its place in the story.
    const projected = spinYaw.value + (reduced ? 0 : project(v.x) * RAD_PER_PX);
    spinYaw.configure({ damping: Math.abs(angularVelocity) > 2 ? 0.82 : 1, response: 0.9 });
    spinYaw.velocity = angularVelocity;
    spinYaw.target = Math.round(projected / TAU) * TAU;
    spinPitch.configure({ damping: 1, response: 0.55 });
    spinPitch.velocity = cancelled || reduced ? 0 : v.y * RAD_PER_PX * 0.7;
    spinPitch.target = 0;
    if (reduced) { spinYaw.set(spinYaw.target); spinPitch.set(0); }
    requestRender();
  };
  canvas.addEventListener("pointerup", (e) => release(e));
  canvas.addEventListener("pointercancel", (e) => release(e, true));
  window.addEventListener("pointermove", onPointerMove, { passive: true });

  canvas.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    const map = { enter: "start", a: "a", " ": "a", b: "b", s: "select" };
    if (map[key]) {
      e.preventDefault();
      tapButton(map[key]);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      spinYaw.configure({ damping: 1, response: 0.6 });
      spinYaw.target += (e.key === "ArrowLeft" ? -1 : 1) * (Math.PI / 4);
      requestRender();
    }
  });

  /* loop */
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let revealStart = 0;
  const start = performance.now();
  const springs = [progress, spinYaw, spinPitch, hoverYaw, hoverPitch, press, ...Object.values(travel)];

  function requestRender() {
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!revealStart) revealStart = now;
    springs.forEach((sp) => sp.step(dt));
    // Keep the spin offset small once it has landed on a whole turn.
    if (!dragging && spinYaw.settled && spinYaw.target !== 0) {
      spinYaw.set(spinYaw.value - spinYaw.target);
    }

    const pose = poseAt(STORY[portrait ? "portrait" : "landscape"], reduced ? 0 : progress.value);
    const t = (now - start) / 1000;
    const drift = reduced ? 0 : 1;
    pivot.rotation.set(
      pose.pitch + spinPitch.value + hoverPitch.value + drift * Math.sin(t * 0.7) * 0.025,
      pose.yaw + spinYaw.value + hoverYaw.value + drift * Math.sin(t * 0.45) * 0.05,
      pose.roll + drift * Math.sin(t * 0.33) * 0.012
    );
    pivot.position.set(pose.x * halfW, pose.y * halfH, 0);
    pivot.scale.setScalar(pose.s * press.value);
    // Caps sink when pressed; the D-pad rocks, so its other arms dip a little too.
    const dpadDip = Math.max(...DPAD.map((n) => travel[n].value));
    for (const [name, spring] of Object.entries(travel)) {
      const cap = meshesFor[name];
      if (!cap) continue;
      const depth = DPAD.includes(name) ? Math.max(spring.value, dpadDip * 0.4) : spring.value;
      cap.mesh.position.z = cap.z - depth * 0.03;
    }

    screen.setScene(progress.value > 0.78 ? "start" : "title");
    if (!reduced) post.uniforms.uReveal.value = Math.min(1, (now - revealStart) / 900);
    screen.update(now);

    renderer.setRenderTarget(target);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(postScene, postCamera);

    const busy = !reduced || dragging || screen.mode === "boot" || screen.pending || !springs.every((sp) => sp.settled);
    if (busy) requestRender();
  }

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting && document.visibilityState === "visible";
    if (visible) { last = performance.now(); requestRender(); }
  });
  io.observe(canvas);
  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
    if (visible) { last = performance.now(); requestRender(); }
  });

  new ResizeObserver(resize).observe(canvas);
  resize();
  requestRender();
  onReady?.();

  return {
    // 0..1 through the hero's scroll story.
    setProgress(p) {
      progress.target = Math.min(1, Math.max(0, p));
      requestRender();
    },
    debug(opts = {}) {
      if ("progress" in opts) progress.set(opts.progress);
      for (const k of ["uWhite", "uBlack", "uGamma", "uEdge", "uHighlight"]) if (k in opts) post.uniforms[k].value = opts[k];
      if ("ambient" in opts) ambient.intensity = opts.ambient;
      if ("key" in opts) key.intensity = opts.key;
      if ("rim" in opts) rim.intensity = opts.rim;
      requestRender();
    },
    setTheme() { readColors(); requestRender(); },
    press(button) { tapButton(button); },
    // Where a button sits on screen (client px); used by tests.
    locate(button) {
      const cap = meshesFor[button];
      if (!cap) return null;
      scene.updateMatrixWorld();
      const v = cap.mesh.geometry.boundingBox.getCenter(new THREE.Vector3());
      cap.mesh.localToWorld(v);
      v.project(camera);
      const rect = canvas.getBoundingClientRect();
      return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
    }
  };
}
