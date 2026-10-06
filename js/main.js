import { prefersReducedMotion } from "./spring.js";
import { AsciiSprite } from "./ascii-sprite.js";
import { mountHoloCards } from "./holo.js";

const EMAIL = "sami.elfigha@gmail.com";
const root = document.documentElement;
const reduced = prefersReducedMotion();
const themeListeners = new Set();

/* ---------- toast + clipboard ---------- */

const toastEl = document.querySelector("[data-toast]");
let toastTimer = 0;
function toast(message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("is-on"), 2400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }
}

function setupEmail() {
  document.querySelectorAll("[data-email]").forEach((link) => {
    link.addEventListener("click", async (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey) return; // modified clicks open the mail app
      event.preventDefault();
      if (await copyText(EMAIL)) toast(`Copied ${EMAIL}`);
      else window.location.href = `mailto:${EMAIL}`;
    });
  });
}

/* ---------- theme: light unless chosen ---------- */

function setupTheme() {
  const button = document.querySelector("[data-theme-toggle]");
  const sync = () => {
    const dark = root.dataset.theme === "dark";
    button?.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#000000" : "#f4f3ef");
    themeListeners.forEach((fn) => fn());
  };
  button?.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) { /* private mode */ }
    sync();
  });
  sync();
}

/* ---------- ASCII sprites and logos ---------- */

const sprites = new Map();
async function setupSprites() {
  const canvases = [...document.querySelectorAll("[data-ascii-sprite]")];
  await Promise.all(canvases.map(async (canvas) => {
    const lane = canvas.closest("[data-lane]");
    const sprite = new AsciiSprite(canvas, {
      name: canvas.dataset.asciiSprite,
      cols: Number(canvas.dataset.cols) || 40,
      mode: lane && lane.getAttribute("aria-selected") === "true" ? "accent" : "ink"
    });
    try {
      await sprite.load();
      sprites.set(canvas, sprite);
    } catch (err) { /* the frame stays empty; layout holds */ }
  }));
  themeListeners.add(() => sprites.forEach((s) => s.readPalette()));
}

/* ---------- experience: tap a frame for the real logo (touch) ---------- */

function setupLogos() {
  if (window.matchMedia("(hover: hover)").matches) return; // hover handles it
  document.querySelectorAll(".role .frame").forEach((frame) => {
    frame.addEventListener("click", () => frame.classList.toggle("is-real"));
  });
  document.querySelectorAll(".row img").forEach((img) => {
    const row = img.closest(".row");
    row.addEventListener("click", () => row.classList.toggle("is-color"));
  });
}

/* ---------- hero: scroll story ---------- */

function setupStory(gameboy) {
  const hero = document.getElementById("home");
  const title = document.querySelector("[data-story-title]");
  const scrollHint = document.querySelector("[data-story-scroll]");
  const status = document.querySelector("[data-story-status]");
  const beats = [...document.querySelectorAll("[data-beat]")].map((el) => {
    const [a, b] = el.dataset.beat.split(" ").map(Number);
    return { el, a, b, status: el.dataset.status || "" };
  });
  if (!hero) return { setPokemon() {} };

  const FADE = 0.035;
  const smooth = (t) => t * t * (3 - 2 * t);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  let pokemonNote = "";
  let lastStatus = null;

  const render = () => {
    const rect = hero.getBoundingClientRect();
    const span = Math.max(1, hero.offsetHeight - window.innerHeight);
    const p = clamp01(-rect.top / span);
    gameboy?.setProgress(p);

    const titleOpacity = 1 - smooth(clamp01((p - 0.04) / 0.1));
    title.style.opacity = titleOpacity.toFixed(3);
    scrollHint.style.opacity = titleOpacity.toFixed(3);

    let active = null;
    for (const beat of beats) {
      const fadeIn = smooth(clamp01((p - beat.a) / FADE));
      const fadeOut = 1 - smooth(clamp01((p - (beat.b - FADE)) / FADE));
      const o = Math.min(fadeIn, fadeOut);
      beat.el.style.opacity = o.toFixed(3);
      if (!reduced) beat.el.style.translate = `0 ${((1 - fadeIn) * 10).toFixed(1)}px`;
      if (o > 0.5) active = beat;
    }
    const text = active ? active.status : titleOpacity > 0.5 ? pokemonNote : "";
    if (text !== lastStatus) {
      status.textContent = text;
      lastStatus = text;
    }
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; render(); });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  render();

  // Beat centres, for stepping through the story with the D-pad.
  const STOPS = [0, ...beats.map((b) => (b.a + Math.min(b.b, 1)) / 2)];
  const scrollToProgress = (p) => {
    const top = hero.getBoundingClientRect().top + window.scrollY;
    const span = Math.max(1, hero.offsetHeight - window.innerHeight);
    window.scrollTo({ top: top + p * span, behavior: reduced ? "auto" : "smooth" });
  };

  return {
    setPokemon(mon) {
      pokemonNote = `On screen · No.${mon.no} ${mon.name.charAt(0)}${mon.name.slice(1).toLowerCase()}`;
      lastStatus = null;
      render();
    },
    step(direction) {
      const span = Math.max(1, hero.offsetHeight - window.innerHeight);
      const p = clamp01(-hero.getBoundingClientRect().top / span);
      if (direction > 0) {
        const next = STOPS.find((stop) => stop > p + 0.02);
        if (next === undefined) document.getElementById("work")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        else scrollToProgress(next);
      } else {
        const prev = [...STOPS].reverse().find((stop) => stop < p - 0.02);
        scrollToProgress(prev ?? 0);
      }
    }
  };
}

async function setupHero() {
  const canvas = document.querySelector("[data-gameboy]");
  let gameboy = null;
  try {
    const { mountGameBoy } = await import("./gameboy.js");
    gameboy = await mountGameBoy(canvas);
  } catch (err) {
    gameboy = null;
  }
  const story = setupStory(gameboy);
  if (!gameboy) {
    root.classList.add("no-webgl"); // show the still print instead
    canvas?.removeAttribute("tabindex");
    return;
  }
  themeListeners.add(() => gameboy.setTheme());
  if (new URLSearchParams(location.search).has("debug")) window.__gameboy = gameboy;
  // The console's buttons drive the page: START opens the portfolio, the D-pad walks the story.
  canvas.addEventListener("gameboy:button", (e) => {
    const { button, mon } = e.detail;
    if (button === "start") {
      document.getElementById("work")?.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
    } else if (button === "up" || button === "down") {
      story.step(button === "down" ? 1 : -1);
    } else if (mon) {
      story.setPokemon(mon);
    }
  });
}

/* ---------- starter: role fit ---------- */

const LANES = {
  software: {
    title: "Software engineering",
    pitch: "Production software engineer with Python, React, FastAPI, Django, Node, TypeScript, Azure, AWS, and experience shipping systems at four AI startups.",
    proof: [
      "GutGutGoose: Python computational biology pipelines from data ingestion through model evaluation.",
      "Blaze: Node/TypeScript agent infrastructure, x402 payments, Remotion video generation.",
      "OraxAI: built the full-stack product from scratch for paying users.",
      "Venu AI: Python, React, Django, and Azure on conference automation.",
      "NeuralSeek: production AWS agent pipeline that cut task resolution about 40%."
    ],
    link: { href: "#oraxai", label: "See OraxAI" },
    clipboard: "Sami El-Figha is a strong software engineering call: he builds scientific software at GutGutGoose, shipped agent infrastructure at Blaze, backend AI systems at Venu AI, production agents at NeuralSeek AI, and built OraxAI end to end."
  },
  machine: {
    title: "Machine learning",
    pitch: "Applied ML engineer working across personalized microbiome recommendations, ATS scoring, phonetic generation, and production agent evaluation loops.",
    proof: [
      "GutGutGoose: customer DNA and genomic marker matching against curated microbiome datasets.",
      "OraxAI: semantic and keyword gap scoring for resumes and job descriptions.",
      "Lyric Engine: dual tokenizer, LoRA adapters, and constrained beam search.",
      "NeuralSeek AI: approximately 30% benchmark accuracy improvement after 3+ iterations."
    ],
    link: { href: "#projects", label: "See ML projects" },
    clipboard: "Sami El-Figha is a strong machine learning call: he develops personalized microbiome ML at GutGutGoose, built OraxAI's ATS scoring engine, created Lyric Engine with phonetic constraints and LoRA adapters, and improved production agent benchmarks at NeuralSeek AI."
  },
  hardware: {
    title: "Hardware engineering",
    pitch: "Waterloo Electrical Engineering student with Python, C++, SQL, and Verilog skills plus practical ML systems experience.",
    proof: [
      "University of Waterloo: BASc Electrical Engineering.",
      "NeuralForge: INT8 CNN inference on a 4x4 systolic array in Verilog RTL.",
      "Technical languages: Python, JavaScript, TypeScript, C++, SQL, and Verilog.",
      "ML tools: PyTorch, Hugging Face, OpenAI API, and Amazon Bedrock."
    ],
    link: { href: "#projects", label: "See NeuralForge" },
    clipboard: "Sami El-Figha is a Waterloo Electrical Engineering student whose current resume includes Python, C++, SQL, and Verilog alongside production ML and software engineering experience, including NeuralForge, an FPGA CNN accelerator in Verilog."
  }
};

function setupStarter() {
  const tabs = [...document.querySelectorAll("[data-lane]")];
  const panel = document.getElementById("starter-panel");
  if (!tabs.length || !panel) return;
  const $ = (sel) => panel.querySelector(sel);
  const status = $("[data-copy-status]");
  let current = "software";

  const select = (tab, { focus = false } = {}) => {
    const lane = LANES[tab.dataset.lane];
    if (!lane) return;
    current = tab.dataset.lane;
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      sprites.get(t.querySelector("canvas"))?.setMode(on ? "accent" : "ink");
    });
    panel.setAttribute("aria-labelledby", tab.id);
    $("[data-lane-title]").textContent = lane.title;
    $("[data-lane-pitch]").textContent = lane.pitch;
    const list = $("[data-lane-proof]");
    list.replaceChildren(...lane.proof.map((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      return li;
    }));
    const link = $("[data-lane-link]");
    link.href = lane.link.href;
    link.textContent = lane.link.label;
    status.textContent = "";
    for (const el of [$("[data-lane-title]"), $("[data-lane-pitch]"), list]) {
      el.removeAttribute("data-swap");
      void el.offsetWidth;
      el.setAttribute("data-swap", "");
    }
    if (focus) tab.focus();
  };

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (step) {
        e.preventDefault();
        select(tabs[(i + step + tabs.length) % tabs.length], { focus: true });
      } else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        select(tabs[e.key === "Home" ? 0 : tabs.length - 1], { focus: true });
      }
    });
  });

  $("[data-copy-pitch]")?.addEventListener("click", async () => {
    const ok = await copyText(LANES[current].clipboard);
    status.textContent = ok ? "Pitch copied" : "Copy failed. Select the text instead.";
    if (ok) toast("Pitch copied");
  });
}

/* ---------- OraxAI console ---------- */

function setupOrax() {
  const screen = document.querySelector("[data-orax-screen]");
  const tabs = [...document.querySelectorAll("[data-orax-module]")];
  if (!screen || !tabs.length) return;
  const speech = document.querySelector("[data-orax-speech]");
  const state = document.querySelector("[data-orax-state]");
  const note = document.querySelector("[data-orax-note]");

  const MODULES = {
    ats: {
      speech: "Squirtle used HYDRO-PARSE! Two keywords from super effective.",
      note: "Demo run",
      running: "Scanning",
      done: "Scan complete",
      steps: [
        { cmd: "orax scan resume.pdf --job ml-engineer-intern" },
        { text: "parse resume.pdf ............ ok", cls: "tl-ok", delay: 260 },
        { text: "extract skills .............. ok", cls: "tl-ok", delay: 300 },
        { text: "match vs job description .... running", cls: "tl-dim", delay: 320 },
        { score: 87, delay: 280 },
        { text: "matched   python · pytorch · fastapi · docker · sql", cls: "tl-ok", delay: 340 },
        { text: "missing   kubernetes · airflow", cls: "tl-miss", delay: 300 },
        { text: "3 rewrites suggested → export ATS-ready PDF", cls: "tl-warn", delay: 340 }
      ]
    },
    stack: {
      speech: "React up front, FastAPI behind. Every layer built by hand.",
      note: "Architecture",
      running: "Reading",
      done: "Shipped",
      steps: [
        { cmd: "orax stack --describe" },
        { text: "frontend ..... React UI, auth, PDF export", cls: "tl-ok", delay: 260 },
        { text: "backend ...... FastAPI on Python", cls: "tl-ok", delay: 260 },
        { text: "engine ....... ATS scoring: semantic + keyword gaps", cls: "tl-ok", delay: 260 },
        { text: "input ........ job descriptions, resumes", cls: "tl-dim", delay: 260 },
        { text: "loop ......... iterated from live user sessions and demos", cls: "tl-warn", delay: 320 }
      ]
    },
    growth: {
      speech: "Zero paid ads. The loop just keeps evolving.",
      note: "Resume numbers",
      running: "Counting",
      done: "Organic",
      steps: [
        { cmd: "orax metrics" },
        { count: { label: "monthly active users", to: 100, display: "100+" }, delay: 220 },
        { count: { label: "monthly recurring revenue", to: 2000, display: "$2K+" }, delay: 220 },
        { count: { label: "social followers", to: 10000, display: "10K+" }, delay: 220 },
        { count: { label: "total views", to: 1000000, display: "1M+" }, delay: 220 },
        { text: "paid ads ..... none, organic SEO and social only", cls: "tl-warn", delay: 360 }
      ]
    }
  };

  const fmt = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(/\.0$/, "")}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(v));
  const caret = document.createElement("span");
  caret.className = "orax-caret";
  caret.setAttribute("aria-hidden", "true");
  let token = 0;

  const wait = (ms, t) => new Promise((r) => setTimeout(() => r(t === token), reduced ? 0 : ms));
  const line = (cls = "") => {
    const p = document.createElement("p");
    if (cls) p.className = cls;
    screen.appendChild(p);
    screen.scrollTop = screen.scrollHeight;
    return p;
  };
  const tween = (duration, t, onFrame) => new Promise((resolve) => {
    const start = performance.now();
    const tick = (now) => {
      if (t !== token) return resolve();
      const k = reduced ? 1 : Math.min(1, (now - start) / duration);
      onFrame(1 - Math.pow(1 - k, 3), k);
      if (k < 1) requestAnimationFrame(tick); else resolve();
    };
    requestAnimationFrame(tick);
  });

  const run = async (id) => {
    const mod = MODULES[id];
    const t = ++token;
    screen.textContent = "";
    speech.textContent = mod.speech;
    state.textContent = mod.running;
    note.textContent = mod.note;
    for (const step of mod.steps) {
      if (t !== token) return;
      if (step.cmd) {
        const p = line("tl-cmd");
        p.appendChild(caret);
        for (const ch of reduced ? [step.cmd] : step.cmd) {
          if (t !== token) return;
          p.insertBefore(document.createTextNode(ch), caret);
          if (!reduced) await new Promise((r) => setTimeout(r, 14));
        }
        continue;
      }
      if (!(await wait(step.delay, t))) return;
      if (step.text) {
        const p = line(step.cls);
        p.textContent = step.text;
        p.appendChild(caret);
      } else if (step.score) {
        const row = document.createElement("div");
        row.className = "orax-score";
        row.innerHTML = '<div class="orax-score-track"><div class="orax-score-fill"></div></div><span class="orax-score-num">0/100</span>';
        screen.appendChild(row);
        row.appendChild(caret);
        const fill = row.querySelector(".orax-score-fill");
        const num = row.querySelector(".orax-score-num");
        requestAnimationFrame(() => { fill.style.transform = `scaleX(${step.score / 100})`; });
        await tween(900, t, (e) => { num.textContent = `${Math.round(step.score * e)}/100`; });
      } else if (step.count) {
        const p = line("orax-metric");
        p.innerHTML = `<span>${step.count.label}</span><b>0</b>`;
        const b = p.querySelector("b");
        await tween(620, t, (e, k) => { b.textContent = k >= 1 ? step.count.display : fmt(Math.round(step.count.to * e)); });
      }
      screen.scrollTop = screen.scrollHeight;
    }
    if (t === token) state.textContent = mod.done;
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((other) => {
        const on = other === tab;
        other.classList.toggle("is-active", on);
        other.setAttribute("aria-selected", String(on));
      });
      run(tab.dataset.oraxModule);
    });
  });

  const io = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) return;
    io.disconnect();
    run("ats");
  }, { threshold: 0.35 });
  io.observe(screen);
}

/* ---------- boot ---------- */

setupTheme();
setupEmail();
setupLogos();
setupStarter();
setupOrax();
mountHoloCards();
setupSprites();
setupHero();
