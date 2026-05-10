const screenItems = [
  {
    id: "about",
    title: "Player Profile",
    cart: "SAMI",
    body: "Electrical Engineering builder heading to Waterloo. I co-founded OraxAI, ship full-stack AI products, and research how students actually build calculus intuition.",
    meta: ["Waterloo EE", "Montreal", "English/French/Arabic", "Math Olympiad"],
    lines: [
      "Built OraxAI from scoring engine to GTM.",
      "Researching calculus intuition and tutoring weekly.",
      "Interested in machine learning, hardware engineering, or software engineering."
    ],
    target: "#about"
  },
  {
    id: "experience",
    title: "Campaign Log",
    cart: "WORK",
    body: "Venu AI, OraxAI, NeuralSeek, calculus research, and KPMG case work. The through-line is practical systems under real pressure.",
    meta: ["Python", "React", "AWS", "Agents"],
    lines: [
      "Venu AI: conference automation and sales workflows.",
      "NeuralSeek: multi-agent AWS pipeline, about 40% faster.",
      "Research and case work sharpen the product muscle."
    ],
    target: "#experience"
  },
  {
    id: "oraxai",
    title: "Boss Level: OraxAI",
    cart: "ORAX",
    body: "Resume tailoring that beats ATS filters. Built the scoring engine, React UI, backend API, and GTM loops from scratch.",
    meta: ["100+ MAU", "$2K+ MRR", "10K+ followers", "1M+ views"],
    lines: [
      "ATS scoring engine parses semantic and keyword gaps.",
      "React + FastAPI product shipped to paying users.",
      "Organic SEO and social, zero paid ads."
    ],
    target: "#oraxai"
  },
  {
    id: "projects",
    title: "Cartridge Shelf",
    cart: "LABS",
    body: "Lyric Engine, PaideAI, and NeuralForge: ML generation, adaptive tutoring, and hardware acceleration with a full build story.",
    meta: ["LoRA", "FastAPI", "FPGA", "PyTorch"],
    lines: [
      "Lyric Engine: phonetic constrained generation.",
      "PaideAI: adaptive math tutor with teacher visibility.",
      "NeuralForge: INT8 CNN inference on FPGA."
    ],
    target: "#projects"
  },
  {
    id: "education",
    title: "Training Grounds",
    cart: "EDU",
    body: "Waterloo Electrical Engineering after Pure and Applied Sciences at Maisonneuve, with networks, ML, digital hardware, and embedded systems ahead.",
    meta: ["C/C++", "Rust", "Calculus", "Physics"],
    lines: [
      "Waterloo EE starts Sept 2026.",
      "DEC in Pure and Applied Sciences at Maisonneuve.",
      "Focus: ML, digital hardware, networks, embedded."
    ],
    target: "#education"
  },
  {
    id: "contact",
    title: "Link Cable",
    cart: "LINK",
    body: "Interested in machine learning, hardware engineering, or software engineering internships. If you are building something interesting, my inbox is open.",
    meta: ["Email", "GitHub", "OraxAI", "Internships"],
    lines: [
      "Email is the fastest route.",
      "GitHub shows the build trail.",
      "OraxAI is live and shipping."
    ],
    target: "#contact"
  }
];

const state = {
  selected: 0,
  loaded: null,
  powered: true,
  booted: false,
  score: 0,
  isDragging: false
};

const body = document.getElementById("screenBody");
const score = document.getElementById("screenScore");
const lcd = document.getElementById("lcdScreen");
const consoleEl = document.getElementById("portfolioConsole");
const cartSlot = document.getElementById("cartSlot");
const powerLabel = document.querySelector(".power-pill");
const carts = [...document.querySelectorAll(".mini-cart[data-cart-index]")];
const recruiterScanButton = document.getElementById("recruiterScanButton");
const recruiterPanel = document.getElementById("recruiterPanel");
const questProgress = document.getElementById("questProgress");
const questToast = document.getElementById("questToast");
const questCards = [...document.querySelectorAll("[data-quest-card]")];
const roleTabs = [...document.querySelectorAll("[data-role-route]")];
const roleBadge = document.getElementById("roleBadge");
const roleTitle = document.getElementById("roleTitle");
const rolePitch = document.getElementById("rolePitch");
const roleProofList = document.getElementById("roleProofList");
const copyStatus = document.getElementById("copyStatus");
const loadRouteButtons = [...document.querySelectorAll("[data-load-route-cart]")];
const copyPitchButtons = [...document.querySelectorAll("[data-copy-pitch]")];
const tabletopPanel = document.getElementById("tabletopPanel");
const tableSlot = document.getElementById("tableSlot");
const tableScreen = document.getElementById("tableScreen");
const tableStatus = document.getElementById("tableStatus");
const tableCards = [...document.querySelectorAll("[data-table-cart-index]")];
const consoleControls = [...document.querySelectorAll("[data-console-action]")];
const openTableButtons = [...document.querySelectorAll("[data-open-table]")];
const closeTableButtons = [...document.querySelectorAll("[data-close-table]")];
const tableFocusButtons = [...document.querySelectorAll("[data-table-focus-console]")];
let suppressNextCartClick = false;
let lastTableOpenAt = 0;
let selectedRecruiterRoute = "software";
const questState = new Set();

const quests = {
  scan: {
    title: "Scan signal",
    detail: "Role fit packet unlocked."
  },
  cart: {
    title: "Cartridge loaded",
    detail: "A portfolio screen is live."
  },
  builds: {
    title: "Builds inspected",
    detail: "Projects and product proof opened."
  },
  contact: {
    title: "Link cable ready",
    detail: "The next move is easy."
  }
};
const recruiterRoutes = {
  software: {
    title: "Software engineering packet",
    cart: "ORAX",
    cartIndex: 2,
    pitch: "Production AI product builder with React, FastAPI, Django, Azure, AWS agents, and real user traction.",
    clipboard: "Sami El-Figha is a strong software engineering call: he co-founded OraxAI, built the ATS scoring engine, React frontend, FastAPI backend, PDF workflows, and growth loops, plus shipped AI automation work with Venu AI and NeuralSeek.",
    proof: [
      "OraxAI: built the full-stack product from scratch for paying users.",
      "Venu AI: Python, React, Django, and Azure on conference automation.",
      "NeuralSeek: production AWS agent pipeline that cut task resolution about 40%."
    ]
  },
  machine: {
    title: "Machine learning packet",
    cart: "LABS",
    cartIndex: 3,
    pitch: "Applied ML builder with product context: resume scoring, phonetic generation, adaptive tutoring, and agent evaluation loops.",
    clipboard: "Sami El-Figha is a strong machine learning call: he shipped OraxAI's ATS scoring and keyword gap system, built Lyric Engine with phonetic constraints and LoRA adapters, and designed adaptive tutoring workflows in PaideAI.",
    proof: [
      "OraxAI: semantic and keyword gap scoring for resumes and job descriptions.",
      "Lyric Engine: dual tokenizer, LoRA adapters, and constrained beam search.",
      "PaideAI: adaptive math tutoring with real-time hints and progress visibility."
    ]
  },
  hardware: {
    title: "Hardware engineering packet",
    cart: "LABS",
    cartIndex: 3,
    pitch: "Electrical engineering builder with ML hardware signal: FPGA inference, Verilog RTL, Python simulation, and embedded systems direction.",
    clipboard: "Sami El-Figha is a strong hardware engineering call: he is heading to Waterloo Electrical Engineering and built NeuralForge, an FPGA INT8 CNN inference accelerator with Verilog RTL, Python simulation, and PyTorch baselines.",
    proof: [
      "NeuralForge: INT8 CNN inference on a 4x4 weight-stationary systolic array.",
      "Stack signal: Verilog, PyTorch, Python simulation, C/C++, and Rust direction.",
      "Waterloo EE path: digital hardware, architecture, networks, and embedded software."
    ]
  }
};

function playBlip(type = "tap") {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = playBlip.context || new AudioContext();
  playBlip.context = context;

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  const frequencies = {
    tap: 440,
    insert: 520,
    open: 660,
    eject: 260,
    back: 300,
    boot: 880,
    off: 140
  };

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(frequencies[type] || 440, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(type === "boot" ? 0.05 : 0.035, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + (type === "boot" ? 0.16 : 0.075));
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(now);
  oscillator.stop(now + (type === "boot" ? 0.18 : 0.085));
}

function currentItem() {
  return screenItems[state.selected];
}

function loadedItem() {
  if (state.loaded === null) return null;
  return screenItems[state.loaded];
}

function updateQuestProgress() {
  questCards.forEach((card) => {
    card.classList.toggle("is-unlocked", questState.has(card.dataset.questCard));
  });

  if (questProgress) {
    questProgress.textContent = `${questState.size} / ${Object.keys(quests).length} unlocked`;
  }
}

function showQuestToast(quest) {
  if (!questToast) return;
  const title = questToast.querySelector("strong");
  const detail = questToast.querySelector("small");
  if (title) title.textContent = quest.title;
  if (detail) detail.textContent = quest.detail;
  questToast.classList.add("is-visible");
  window.clearTimeout(showQuestToast.timer);
  showQuestToast.timer = window.setTimeout(() => {
    questToast.classList.remove("is-visible");
  }, 2600);
}

function unlockQuest(id) {
  const quest = quests[id];
  if (!quest || questState.has(id)) return;
  questState.add(id);
  state.score = Math.min(999, state.score + 45);
  updateQuestProgress();
  showQuestToast(quest);
  renderScreen();
}

function renderRecruiterRoute() {
  const route = recruiterRoutes[selectedRecruiterRoute] || recruiterRoutes.software;
  roleTabs.forEach((tab) => {
    const isActive = tab.dataset.roleRoute === selectedRecruiterRoute;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-pressed", String(isActive));
  });

  if (roleBadge) roleBadge.textContent = `Best first cart: ${route.cart}`;
  if (roleTitle) roleTitle.textContent = route.title;
  if (rolePitch) rolePitch.textContent = route.pitch;
  if (roleProofList) {
    roleProofList.innerHTML = route.proof.map((line) => `<li>${line}</li>`).join("");
  }
  if (copyStatus) copyStatus.textContent = "";
}

function selectRecruiterRoute(routeId) {
  if (!recruiterRoutes[routeId]) return;
  selectedRecruiterRoute = routeId;
  renderRecruiterRoute();
  playBlip("tap");
}

function loadRecruiterRouteCart() {
  const route = recruiterRoutes[selectedRecruiterRoute] || recruiterRoutes.software;
  closeRecruiterPanel();
  insertCart(route.cartIndex, "tap");
  unlockQuest("builds");
}

async function copyRecruiterPitch() {
  const route = recruiterRoutes[selectedRecruiterRoute] || recruiterRoutes.software;
  const text = route.clipboard;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const fallback = document.createElement("textarea");
      fallback.value = text;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.left = "-9999px";
      document.body.appendChild(fallback);
      fallback.select();
      document.execCommand("copy");
      fallback.remove();
    }
    if (copyStatus) copyStatus.textContent = "Pitch copied.";
    unlockQuest("contact");
    playBlip("open");
  } catch (error) {
    if (copyStatus) copyStatus.textContent = "Copy blocked. Email link is ready.";
    playBlip("back");
  }
}

function openRecruiterPanel() {
  renderRecruiterRoute();
  recruiterPanel?.classList.add("is-open");
  recruiterPanel?.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  unlockQuest("scan");
  playBlip("open");
}

function closeRecruiterPanel() {
  recruiterPanel?.classList.remove("is-open");
  recruiterPanel?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function updateTabletop() {
  const item = loadedItem();
  tableCards.forEach((card) => {
    const index = Number(card.dataset.tableCartIndex);
    card.classList.toggle("is-loaded", state.loaded === index);
    card.setAttribute("aria-pressed", String(state.loaded === index));
  });

  if (tableSlot) {
    tableSlot.textContent = item ? `${item.cart} CART LOADED` : "INSERT CART";
    tableSlot.classList.toggle("has-cart", !!item);
  }

  if (tableStatus) {
    tableStatus.textContent = item ? "LOADED" : "READY";
  }

  if (tableScreen) {
    if (!item) {
      tableScreen.innerHTML = `
        <strong>Pick a cart</strong>
        <span>Tap a cartridge card on the table.</span>
      `;
      return;
    }

    tableScreen.innerHTML = `
      <strong>${item.title}</strong>
      <span>${item.body}</span>
      <ul>
        ${item.lines.slice(0, 3).map((line) => `<li>&gt; ${line}</li>`).join("")}
      </ul>
    `;
  }
}

function openTabletop() {
  updateTabletop();
  tabletopPanel?.classList.add("is-open");
  tabletopPanel?.setAttribute("aria-hidden", "false");
  document.body.classList.add("no-scroll");
  playBlip("open");
}

function closeTabletop() {
  tabletopPanel?.classList.remove("is-open");
  tabletopPanel?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("no-scroll");
}

function flashControl(control) {
  if (!control) return;
  control.classList.add("is-pressing");
  consoleEl?.classList.add("is-control-active");
  window.clearTimeout(flashControl.timer);
  window.setTimeout(() => control.classList.remove("is-pressing"), 150);
  flashControl.timer = window.setTimeout(() => {
    consoleEl?.classList.remove("is-control-active");
  }, 220);
}

function openTabletopFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const now = performance.now();
  if (now - lastTableOpenAt < 260) return;
  lastTableOpenAt = now;
  openTabletop();
}

function openRecruiterScanFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  openRecruiterPanel();
}

function selectRecruiterRouteFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  selectRecruiterRoute(event.currentTarget?.dataset.roleRoute);
}

function loadRecruiterRouteFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  loadRecruiterRouteCart();
}

function copyRecruiterPitchFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  copyRecruiterPitch();
}

document.addEventListener("pointerdown", (event) => {
  if (event.target.closest("[data-load-route-cart]")) {
    loadRecruiterRouteFromEvent(event);
  }

  if (event.target.closest("[data-copy-pitch]")) {
    copyRecruiterPitchFromEvent(event);
  }
}, true);

openTableButtons.forEach((button) => {
  button.addEventListener("pointerdown", openTabletopFromEvent);
  button.addEventListener("click", openTabletopFromEvent);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") openTabletopFromEvent(event);
  });
});

recruiterScanButton?.addEventListener("pointerdown", openRecruiterScanFromEvent);
recruiterScanButton?.addEventListener("click", openRecruiterScanFromEvent);
recruiterScanButton?.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") openRecruiterScanFromEvent(event);
});

roleTabs.forEach((button) => {
  button.addEventListener("click", selectRecruiterRouteFromEvent);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") selectRecruiterRouteFromEvent(event);
  });
});

loadRouteButtons.forEach((button) => {
  button.addEventListener("pointerdown", loadRecruiterRouteFromEvent);
  button.addEventListener("click", loadRecruiterRouteFromEvent);
});

copyPitchButtons.forEach((button) => {
  button.addEventListener("pointerdown", copyRecruiterPitchFromEvent);
  button.addEventListener("click", copyRecruiterPitchFromEvent);
});

closeTableButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeTabletop();
  });
});

tableFocusButtons.forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closeTabletop();
    consoleEl?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

tableCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    insertCart(Number(card.dataset.tableCartIndex), "tap");
    updateTabletop();
  });
});

consoleControls.forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    flashControl(control);
    handleAction(control.dataset.consoleAction);
  });
});

function renderScreen() {
  if (!body || !score) return;

  score.textContent = `SCORE ${String(state.score).padStart(3, "0")}`;
  updateConsoleChrome();

  if (!state.powered) {
    body.innerHTML = `
      <div class="power-off-screen">
        <h2 class="screen-title">Power Off</h2>
        <p class="screen-copy">Press START to power the Pocket Lab back on.</p>
      </div>
    `;
    return;
  }

  if (!state.booted) {
    const item = loadedItem();
    body.innerHTML = `
      <h2 class="screen-title">SEF Pocket Lab</h2>
      <p class="screen-copy">${item ? `Loading ${item.cart} cartridge...` : "Booting portfolio OS..."}</p>
      <div class="screen-meta"><span>RAM OK</span><span>AI CORE OK</span><span>SHIP MODE</span><span>READY</span></div>
      <div class="screen-footer">Please wait.</div>
    `;
    return;
  }

  const item = loadedItem();
  if (item) {
    renderLoadedCart(item);
    return;
  }

  renderMenu();
}

function renderMenu() {
  const item = currentItem();
  body.innerHTML = `
    <h2 class="screen-title">${item.title}</h2>
    <p class="screen-copy">${item.body}</p>
    <div class="screen-menu" role="listbox" aria-label="Portfolio screen menu">
      ${screenItems.map((entry, index) => `
        <button type="button" class="${index === state.selected ? "is-active" : ""}" data-screen-index="${index}" role="option" aria-selected="${index === state.selected}">
          <span class="cursor">&gt;</span>
          <span>${entry.title}</span>
          <span>${String(index + 1).padStart(2, "0")}</span>
        </button>
      `).join("")}
    </div>
    <div class="screen-meta">
      ${item.meta.map((tag) => `<span>${tag}</span>`).join("")}
    </div>
    <div class="screen-footer">Tap a cart or drag it into the slot. A opens menu item.</div>
  `;
}

function renderLoadedCart(item) {
  body.innerHTML = `
    <div class="cart-screen">
      <div class="loaded-chip">${item.cart} CART LOADED</div>
      <h2 class="screen-title">${item.title}</h2>
      <p class="screen-copy">${item.body}</p>
      <ul class="cart-lines">
        ${item.lines.map((line) => `<li>${line}</li>`).join("")}
      </ul>
      <div class="screen-meta">
        ${item.meta.map((tag) => `<span>${tag}</span>`).join("")}
      </div>
      <div class="screen-footer">A/screen: open. B/Select: eject. Start: power.</div>
    </div>
  `;
}

function updateConsoleChrome() {
  consoleEl?.classList.toggle("is-off", !state.powered);
  consoleEl?.classList.toggle("has-cart", state.loaded !== null);
  lcd?.classList.toggle("is-off", !state.powered);
  lcd?.classList.toggle("has-cart", state.loaded !== null && state.powered);
  powerLabel?.classList.toggle("is-off", !state.powered);

  if (cartSlot) {
    const item = loadedItem();
    cartSlot.textContent = item ? `${item.cart} CART` : "DROP CART HERE";
    cartSlot.classList.toggle("has-cart", !!item);
  }

  carts.forEach((cart) => {
    const index = Number(cart.dataset.cartIndex);
    const isLoaded = state.loaded === index;
    cart.classList.toggle("is-loaded", isLoaded);
    cart.classList.toggle("is-dimmed", state.loaded !== null && !isLoaded);
    cart.setAttribute("aria-pressed", String(isLoaded));
    cart.setAttribute("aria-label", `${screenItems[index].cart} cartridge: ${isLoaded ? "loaded, tap to eject" : "tap or drag to insert"}`);
  });

  updateTabletop();
}

function setSelected(nextIndex) {
  state.selected = (nextIndex + screenItems.length) % screenItems.length;
  state.score = Math.min(999, state.score + 7);
  renderScreen();
}

function bootConsole({ silent = false } = {}) {
  if (!lcd || !body) return;
  state.powered = true;
  state.booted = false;
  state.score = Math.min(999, state.score + 20);
  lcd.classList.add("is-booting");
  if (!silent) playBlip("boot");
  renderScreen();

  window.setTimeout(() => {
    state.booted = true;
    state.score = Math.min(999, state.score + 30);
    lcd.classList.remove("is-booting");
    renderScreen();
  }, 760);
}

function powerOff() {
  state.powered = false;
  state.booted = false;
  lcd?.classList.remove("is-booting");
  playBlip("off");
  renderScreen();
}

function focusConsoleOnSmallScreens() {
  if (!consoleEl || !window.matchMedia("(max-width: 900px)").matches) return;

  window.setTimeout(() => {
    consoleEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 80);
}

function insertCart(index, mode = "insert") {
  state.loaded = index;
  state.selected = index;
  state.powered = true;
  state.score = Math.min(999, state.score + (mode === "drag" ? 75 : 55));
  document.documentElement.classList.remove("cart-dragging");
  cartSlot?.classList.remove("is-hot");
  playBlip("insert");
  bootConsole();
  unlockQuest("cart");
  focusConsoleOnSmallScreens();
}

function ejectCart() {
  if (state.loaded === null) return;
  state.loaded = null;
  state.score = Math.min(999, state.score + 15);
  playBlip("eject");
  renderScreen();
}

function openCurrent() {
  const item = loadedItem() || currentItem();
  const target = document.querySelector(item.target);
  if (!target) return;
  state.score = Math.min(999, state.score + 25);
  renderScreen();
  history.replaceState(null, "", item.target);
  if (item.id === "oraxai" || item.id === "projects") unlockQuest("builds");
  if (item.id === "contact") unlockQuest("contact");
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleAction(action) {
  if (action === "boot") {
    if (state.powered) powerOff();
    else bootConsole();
    return;
  }

  if (!state.powered) {
    if (action === "open" || action === "top") bootConsole();
    return;
  }

  if (!state.booted) return;

  if (action === "up") {
    playBlip("tap");
    setSelected(state.selected - 1);
  }

  if (action === "down") {
    playBlip("tap");
    setSelected(state.selected + 1);
  }

  if (action === "open") {
    playBlip("open");
    openCurrent();
  }

  if (action === "back") {
    if (state.loaded !== null) {
      ejectCart();
      return;
    }
    playBlip("back");
    setSelected(0);
    history.replaceState(null, "", "#home");
    document.getElementById("home")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (action === "top") {
    if (state.loaded !== null) {
      ejectCart();
      return;
    }
    playBlip("tap");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-close-table]")) {
    closeTabletop();
    return;
  }

  if (event.target.closest("[data-close-panel]")) {
    closeRecruiterPanel();
    return;
  }

  if (event.target.closest("[data-open-table]")) {
    openTabletop();
    return;
  }

  if (event.target.closest("[data-table-focus-console]")) {
    closeTabletop();
    consoleEl?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const tableCard = event.target.closest("[data-table-cart-index]");
  if (tableCard) {
    insertCart(Number(tableCard.dataset.tableCartIndex), "tap");
    updateTabletop();
    return;
  }

  if (event.target.closest("#recruiterScanButton")) {
    openRecruiterPanel();
    return;
  }

  const roleTab = event.target.closest("[data-role-route]");
  if (roleTab) {
    selectRecruiterRoute(roleTab.dataset.roleRoute);
    return;
  }

  if (event.target.closest("[data-load-route-cart]")) {
    loadRecruiterRouteCart();
    return;
  }

  if (event.target.closest("[data-copy-pitch]")) {
    copyRecruiterPitch();
    return;
  }

  const scanJump = event.target.closest("[data-scan-jump]");
  if (scanJump) {
    unlockQuest(scanJump.dataset.scanJump);
    closeRecruiterPanel();
    return;
  }

  const questCard = event.target.closest("[data-quest-card]");
  if (questCard) {
    const quest = questCard.dataset.questCard;
    playBlip("tap");
    if (quest === "scan") {
      openRecruiterPanel();
      return;
    }
    if (quest === "cart") {
      insertCart(3, "tap");
      return;
    }
    if (quest === "builds") {
      unlockQuest("builds");
      document.getElementById("projects")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (quest === "contact") {
      unlockQuest("contact");
      document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }

  const cart = event.target.closest(".mini-cart[data-cart-index]");
  if (cart && !state.isDragging) {
    if (suppressNextCartClick) {
      suppressNextCartClick = false;
      return;
    }
    const index = Number(cart.dataset.cartIndex);
    if (state.loaded === index) ejectCart();
    else insertCart(index, "tap");
    return;
  }

  const control = event.target.closest("[data-console-action]");
  if (control) {
    flashControl(control);
    handleAction(control.dataset.consoleAction);
    return;
  }

  const fallbackAction = getConsoleActionFromPoint(event);
  if (fallbackAction) {
    flashControl(document.querySelector(`[data-console-action="${fallbackAction}"]`));
    handleAction(fallbackAction);
    return;
  }

  const menuButton = event.target.closest("[data-screen-index]");
  if (menuButton) {
    playBlip("tap");
    setSelected(Number(menuButton.dataset.screenIndex));
  }

  const contactLink = event.target.closest('a[href^="mailto:"], a[href*="github.com/SMXFREEZE"], a[href*="oraxai.ca"]');
  if (contactLink) {
    unlockQuest("contact");
  }
});

lcd?.addEventListener("click", (event) => {
  if (event.target.closest("[data-screen-index]")) return;
  if (!state.powered || !state.booted) return;
  if (state.loaded !== null) {
    playBlip("open");
    openCurrent();
  }
});

function containsPoint(element, event) {
  const rect = element?.getBoundingClientRect();
  if (!rect) return false;

  return (
    event.clientX >= rect.left &&
    event.clientX <= rect.right &&
    event.clientY >= rect.top &&
    event.clientY <= rect.bottom
  );
}

function getConsoleActionFromPoint(event) {
  const metaButtons = document.querySelector(".meta-buttons");
  if (containsPoint(metaButtons, event)) {
    const rect = metaButtons.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    return x < 0.5 ? "top" : "boot";
  }

  const dpad = document.querySelector(".dpad");
  if (containsPoint(dpad, event)) {
    const rect = dpad.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (y < 0.34) return "up";
    if (y > 0.66) return "down";
    if (x < 0.42) return "back";
    if (x > 0.58) return "open";
  }

  const faceButtons = document.querySelector(".face-buttons");
  if (containsPoint(faceButtons, event)) {
    const rect = faceButtons.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    return x < 0.5 ? "back" : "open";
  }

  return null;
}

document.querySelector(".dpad")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-console-action]")) return;
  const action = getConsoleActionFromPoint(event);
  if (action) handleAction(action);
  event.stopPropagation();
});

document.querySelector(".face-buttons")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-console-action]")) return;
  const action = getConsoleActionFromPoint(event);
  if (action) handleAction(action);
  event.stopPropagation();
});

document.querySelector(".meta-buttons")?.addEventListener("click", (event) => {
  if (event.target.closest("[data-console-action]")) return;
  const action = getConsoleActionFromPoint(event);
  if (action) handleAction(action);
  event.stopPropagation();
});

consoleControls.forEach((control) => {
  control.addEventListener("pointerdown", () => flashControl(control));
  control.addEventListener("pointerup", () => control.classList.remove("is-pressing"));
  control.addEventListener("pointerleave", () => control.classList.remove("is-pressing"));
});

function isPointOverSlot(x, y) {
  const slotRect = cartSlot?.getBoundingClientRect();
  const bezelRect = document.querySelector(".screen-bezel")?.getBoundingClientRect();
  if (!slotRect || !bezelRect) return false;

  const padded = {
    left: Math.min(slotRect.left, bezelRect.left + bezelRect.width * 0.62) - 28,
    right: slotRect.right + 36,
    top: slotRect.top - 36,
    bottom: bezelRect.top + 48
  };

  return x >= padded.left && x <= padded.right && y >= padded.top && y <= padded.bottom;
}

function setupCartridgeDrag() {
  let drag = null;

  carts.forEach((cart) => {
    cart.addEventListener("pointerdown", (event) => {
      if (event.button !== undefined && event.button !== 0) return;
      const index = Number(cart.dataset.cartIndex);
      drag = {
        cart,
        index,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        moved: false
      };
      cart.setPointerCapture?.(event.pointerId);
      cart.classList.add("is-grabbed");
      document.documentElement.classList.add("cart-dragging");
      event.preventDefault();
    });

    cart.addEventListener("pointermove", (event) => {
      if (!drag || drag.cart !== cart) return;
      const dx = event.clientX - drag.startX;
      const dy = event.clientY - drag.startY;
      if (Math.hypot(dx, dy) > 4) drag.moved = true;
      state.isDragging = drag.moved;
      cart.style.setProperty("--drag-x", `${dx}px`);
      cart.style.setProperty("--drag-y", `${dy}px`);
      cart.classList.toggle("is-dragging", drag.moved);
      cartSlot?.classList.toggle("is-hot", isPointOverSlot(event.clientX, event.clientY));
      event.preventDefault();
    });

    cart.addEventListener("pointerup", (event) => {
      if (!drag || drag.cart !== cart) return;
      const shouldInsert = drag.moved && isPointOverSlot(event.clientX, event.clientY);
      const shouldTap = !drag.moved;
      const targetIndex = drag.index;
      resetDraggedCart(cart, event.pointerId);
      if (shouldInsert) insertCart(drag.index, "drag");
      if (shouldTap) {
        suppressNextCartClick = true;
        if (state.loaded === targetIndex) ejectCart();
        else insertCart(targetIndex, "tap");
      }
      window.setTimeout(() => {
        state.isDragging = false;
        suppressNextCartClick = false;
      }, 120);
      drag = null;
      event.preventDefault();
    });

    cart.addEventListener("pointercancel", (event) => {
      if (!drag || drag.cart !== cart) return;
      resetDraggedCart(cart, event.pointerId);
      state.isDragging = false;
      drag = null;
    });
  });
}

function resetDraggedCart(cart, pointerId) {
  cart.releasePointerCapture?.(pointerId);
  cart.classList.remove("is-grabbed", "is-dragging");
  cart.style.removeProperty("--drag-x");
  cart.style.removeProperty("--drag-y");
  cartSlot?.classList.remove("is-hot");
  document.documentElement.classList.remove("cart-dragging");
}

document.addEventListener("keydown", (event) => {
  const activeTag = document.activeElement?.tagName;
  if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

  if (event.key === "Escape" && tabletopPanel?.classList.contains("is-open")) {
    event.preventDefault();
    closeTabletop();
    return;
  }

  if (tabletopPanel?.classList.contains("is-open")) return;

  if (event.key === "Escape" && recruiterPanel?.classList.contains("is-open")) {
    event.preventDefault();
    closeRecruiterPanel();
    return;
  }

  if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") {
    event.preventDefault();
    handleAction("up");
  }

  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") {
    event.preventDefault();
    handleAction("down");
  }

  if (event.key === "Enter" || event.key.toLowerCase() === "a") {
    event.preventDefault();
    handleAction("open");
  }

  if (event.key === "Escape" || event.key === "Backspace" || event.key.toLowerCase() === "b") {
    event.preventDefault();
    handleAction("back");
  }

  if (event.key === "Home") {
    event.preventDefault();
    handleAction("top");
  }

  if (event.key.toLowerCase() === "p") {
    event.preventDefault();
    handleAction("boot");
  }
});

const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" })
  : null;

document.querySelectorAll(".reveal-card").forEach((card, index) => {
  card.style.transitionDelay = `${Math.min(index * 0.045, 0.22)}s`;
  if (revealObserver) {
    revealObserver.observe(card);
  } else {
    card.classList.add("is-visible");
  }
});

setupCartridgeDrag();
updateQuestProgress();
renderRecruiterRoute();
renderScreen();
window.setTimeout(() => bootConsole({ silent: true }), 420);
