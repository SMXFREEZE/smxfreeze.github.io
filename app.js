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
    meta: ["Python", "React", "Azure", "Agents"],
    lines: [
      "Venu AI (YC W'21): conference automation and sales workflows.",
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
  view: "menu",
  detailIndex: 0,
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
const openScanButtons = [...document.querySelectorAll("[data-open-scan]")];
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
const mobileCartButtons = [...document.querySelectorAll("[data-mobile-cart-index]")];
const projectCards = [...document.querySelectorAll("[data-project-card]")];
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
const consolePages = {
  about: [
    {
      kicker: "Resume packet",
      title: "Sami El-Figha",
      body: "Electrical Engineering builder heading to Waterloo, fluent in English, French, and Arabic, building across AI products, ML systems, and hardware.",
      lines: [
        "Software Engineering Intern at Venu AI (YC W'21).",
        "Co-founded OraxAI and shipped it to paying users.",
        "Waterloo Electrical Engineering starts Sept. 2026."
      ],
      meta: ["Waterloo EE", "Montreal", "3 languages", "Builder"],
      actionLabel: "Open resume PDF",
      url: "./Sami-El-Figha-Resume.pdf"
    },
    {
      kicker: "Signal",
      title: "What to call about",
      body: "Best fits: machine learning, hardware engineering, or software engineering internships where shipping and learning speed matter.",
      lines: [
        "ML: ATS scoring, phonetic generation, adaptive tutoring.",
        "Hardware: Verilog, FPGA inference, computer architecture direction.",
        "Software: React, FastAPI, Django, Azure, AWS, Docker."
      ],
      meta: ["ML", "Hardware", "Software", "Internships"]
    },
    {
      kicker: "Recognition",
      title: "Proof of range",
      body: "The resume has research, internships, projects, and recognition that tell the same story: technical curiosity plus follow-through.",
      lines: [
        "Mathematics Olympiad Finalist in Casablanca.",
        "Calculus intuition researcher with 20+ peer interviews.",
        "Pratt & Whitney and Bombardier micro-internships in 2025."
      ],
      meta: ["Research", "Math", "Aerospace", "Education"]
    }
  ],
  experience: [
    {
      kicker: "Current role",
      title: "Venu AI",
      body: "Software Engineering Intern working remotely with the Venu AI team on conference automation, sales workflows, and AI-enabled event systems.",
      lines: [
        "Automated end-to-end conference production workflows.",
        "Built AI-powered personalized email outreach for founders and event stakeholders.",
        "Used Python, Django, React, and Microsoft Azure services."
      ],
      meta: ["YC W'21", "Python", "Django", "Azure"]
    },
    {
      kicker: "Agent work",
      title: "NeuralSeek AI",
      body: "Shipped production AWS agent work and built multi-agent workflows that made task handling faster and more reliable.",
      lines: [
        "Completed the mAIstro Challenge with 100% on-time delivery.",
        "Designed triage, execution, and review stages.",
        "Cut average task resolution time by about 40%."
      ],
      meta: ["AWS", "Agents", "40% faster", "Remote"]
    },
    {
      kicker: "Research",
      title: "Calculus intuition",
      body: "Interviewed peers and designed weekly exercises to understand where procedural math ability breaks before real conceptual intuition forms.",
      lines: [
        "20+ peer interviews mapped conceptual gaps.",
        "10+ students used the structured exercises weekly.",
        "Strong bridge between tutoring, UX, and model feedback."
      ],
      meta: ["Research", "Teaching", "Math", "UX"]
    }
  ],
  oraxai: [
    {
      kicker: "Product",
      title: "OraxAI",
      body: "AI resume tailoring platform with resume scoring, keyword gap analysis, PDF workflows, and product analytics in one production system.",
      lines: [
        "Built the ATS scoring engine, React frontend, and FastAPI backend.",
        "Iterated from live user research and product demos.",
        "Grew to 100+ MAUs and $2K+ MRR."
      ],
      meta: ["React", "FastAPI", "OpenAI", "$2K+ MRR"],
      actionLabel: "Open oraxai.ca",
      url: "https://www.oraxai.ca/"
    },
    {
      kicker: "Growth",
      title: "Distribution loop",
      body: "OraxAI was built and marketed like a product, not just a portfolio demo.",
      lines: [
        "SEO and organic social brought 10K+ followers.",
        "Content reached 1M+ views without paid ads.",
        "Product analytics fed feature prioritization."
      ],
      meta: ["SEO", "10K+", "1M views", "No ads"]
    },
    {
      kicker: "Why it matters",
      title: "Recruiter read",
      body: "The strongest signal is ownership: scoring logic, frontend, backend, PDFs, analytics, user feedback, and growth all connect.",
      lines: [
        "Full-stack system thinking under real users.",
        "ML product judgment around scoring and feedback loops.",
        "A clear artifact to discuss in an interview."
      ],
      meta: ["Ownership", "Users", "ML product", "Shipping"]
    }
  ],
  projects: [
    {
      kicker: "ML system",
      title: "Lyric Engine",
      body: "Phonetic-aware lyrics generation with a dual BPE + ARPAbet tokenizer, LoRA adapters, and constrained beam search.",
      lines: [
        "Enforces rhyme, syllable count, and emotional arc.",
        "Runtime genre blending with Llama 3.1 adapters.",
        "GitHub repo was updated Apr. 25, 2026."
      ],
      meta: ["Python", "Llama 3.1", "LoRA", "Beam"],
      actionLabel: "Open GitHub",
      url: "https://github.com/SMXFREEZE/lyric-engine"
    },
    {
      kicker: "Product",
      title: "PaideAI",
      body: "Adaptive math tutor that generates practice, gives real-time hints, and gives teachers visibility into class progress.",
      lines: [
        "Built around how students actually reason through math.",
        "React UI with AI-generated support and teacher-facing progress.",
        "Connects tutoring experience to product design."
      ],
      meta: ["React", "FastAPI", "Claude API", "Tutoring"],
      actionLabel: "Open live demo",
      url: "https://paideai.onrender.com"
    },
    {
      kicker: "Hardware ML",
      title: "NeuralForge",
      body: "FPGA accelerator running INT8 LeNet-5 CNN inference on a 4x4 weight-stationary systolic array.",
      lines: [
        "Verilog RTL, Python simulation, PyTorch baseline.",
        "Shows hardware, ML, and systems thinking together.",
        "GitHub repo was updated Apr. 20, 2026."
      ],
      meta: ["Verilog", "FPGA", "INT8", "PyTorch"],
      actionLabel: "Open GitHub",
      url: "https://github.com/SMXFREEZE/neuralforge"
    }
  ],
  education: [
    {
      kicker: "Next level",
      title: "Waterloo EE",
      body: "BASc Electrical Engineering at the University of Waterloo, starting Sept. 2026.",
      lines: [
        "Focus direction: ML, digital hardware, networks, embedded systems.",
        "Strong fit for hardware/software roles with systems depth.",
        "Long-term path points toward practical AI infrastructure."
      ],
      meta: ["Waterloo", "EE", "Networks", "Embedded"]
    },
    {
      kicker: "Foundation",
      title: "Maisonneuve",
      body: "Pure and Applied Sciences at Maisonneuve College in Montreal, Jan. 2024 to Dec. 2025.",
      lines: [
        "Advanced calculus, linear algebra, physics, electricity and magnetism.",
        "Built early programming base in Python, Java, and Unity.",
        "Research and weekly tutoring sharpened communication."
      ],
      meta: ["Science", "Calculus", "Physics", "Teaching"]
    }
  ],
  contact: [
    {
      kicker: "Link cable",
      title: "LinkedIn",
      body: "Fastest recruiter context: role history, education, and professional updates.",
      lines: [
        "LinkedIn profile: samielfigha.",
        "Use this for outreach or quick verification.",
        "A opens the LinkedIn profile."
      ],
      meta: ["LinkedIn", "Recruiter", "Profile", "Outreach"],
      actionLabel: "Open LinkedIn",
      url: "https://www.linkedin.com/in/samielfigha/"
    },
    {
      kicker: "Build trail",
      title: "GitHub",
      body: "Current public repos include this portfolio, Lyric Engine, NeuralForge, PaideAI, FormulaForge, and analytics/data tools.",
      lines: [
        "GitHub profile: SMXFREEZE.",
        "Recent repos show Python, TypeScript, Verilog, and HTML projects.",
        "A opens the GitHub profile."
      ],
      meta: ["GitHub", "Repos", "Python", "Verilog"],
      actionLabel: "Open GitHub",
      url: "https://github.com/SMXFREEZE"
    },
    {
      kicker: "Resume",
      title: "PDF resume",
      body: "One-page resume with education, Venu AI, NeuralSeek, OraxAI, Lyric Engine, KPMG, skills, and awards.",
      lines: [
        "Includes phone and email.",
        "Lists Python, JavaScript, C++, SQL, Verilog.",
        "A opens the PDF."
      ],
      meta: ["PDF", "Resume", "Skills", "Experience"],
      actionLabel: "Open resume",
      url: "./Sami-El-Figha-Resume.pdf"
    },
    {
      kicker: "Inbox",
      title: "Email",
      body: "Interested in machine learning, hardware engineering, or software engineering internships.",
      lines: [
        "Email: sami.elfigha@gmail.com.",
        "Best subject: Internship conversation.",
        "A starts an email."
      ],
      meta: ["Email", "Internships", "ML", "Hardware"],
      actionLabel: "Email Sami",
      url: "mailto:sami.elfigha@gmail.com"
    }
  ]
};
const cartColors = ["#ffd166", "#60c7ff", "#ff7d6e", "#84f0bd", "#c7b8ff", "#f4a261"];

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function pagesForItem(item) {
  return consolePages[item.id] || [{
    kicker: item.cart,
    title: item.title,
    body: item.body,
    lines: item.lines,
    meta: item.meta
  }];
}

function activeDetail(item) {
  const pages = pagesForItem(item);
  const index = ((state.detailIndex % pages.length) + pages.length) % pages.length;
  state.detailIndex = index;
  return { page: pages[index], index, total: pages.length };
}

function resetConsoleDetail() {
  state.detailIndex = 0;
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

function loadMobileCartFromEvent(event) {
  event?.preventDefault();
  event?.stopPropagation();
  const index = Number(event.currentTarget?.dataset.mobileCartIndex);
  if (!Number.isInteger(index)) return;
  insertCart(index, "tap", event.currentTarget);
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

openScanButtons.forEach((button) => {
  button.addEventListener("pointerdown", openRecruiterScanFromEvent);
  button.addEventListener("click", openRecruiterScanFromEvent);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") openRecruiterScanFromEvent(event);
  });
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

mobileCartButtons.forEach((button) => {
  button.addEventListener("click", loadMobileCartFromEvent);
  button.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") loadMobileCartFromEvent(event);
  });
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
    insertCart(Number(card.dataset.tableCartIndex), "tap", card);
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
    body.scrollTop = 0;
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
    body.scrollTop = 0;
    return;
  }

  const item = loadedItem();
  if (item) {
    renderLoadedCart(item);
    return;
  }

  if (state.view === "detail") {
    renderConsoleDetail(currentItem(), { loaded: false });
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
    <div class="screen-footer">Up/down choose. A opens inside screen. Select returns here.</div>
  `;
  body.scrollTop = 0;
}

function renderLoadedCart(item) {
  renderConsoleDetail(item, { loaded: true });
}

function renderConsoleDetail(item, { loaded = false } = {}) {
  const { page, index, total } = activeDetail(item);
  const actionText = page.actionLabel || (page.url ? "Open link" : "Next page");
  const escapedMeta = (page.meta || item.meta).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
  const escapedLines = (page.lines || item.lines).map((line) => `<li>${escapeHtml(line)}</li>`).join("");
  const counter = `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;

  body.innerHTML = `
    <div class="cart-screen">
      <div class="console-page-top">
        <div class="loaded-chip">${loaded ? `${escapeHtml(item.cart)} CART LOADED` : `${escapeHtml(item.cart)} SCREEN`}</div>
        <div class="console-page-count">${counter}</div>
      </div>
      <p class="console-kicker">${escapeHtml(page.kicker || item.cart)}</p>
      <h2 class="screen-title">${escapeHtml(page.title || item.title)}</h2>
      <p class="screen-copy">${escapeHtml(page.body || item.body)}</p>
      <ul class="cart-lines">
        ${escapedLines}
      </ul>
      <div class="screen-meta">
        ${escapedMeta}
      </div>
      ${page.url ? `<div class="console-link-pill">${escapeHtml(actionText)}</div>` : ""}
      <div class="screen-footer">Up/down browse pages. A: ${escapeHtml(actionText)}. B: ${loaded ? "eject" : "back"}.</div>
    </div>
  `;
  body.scrollTop = 0;
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
  resetConsoleDetail();
  state.score = Math.min(999, state.score + 7);
  renderScreen();
}

function setDetailPage(nextIndex) {
  const item = loadedItem() || currentItem();
  const pages = pagesForItem(item);
  state.detailIndex = (nextIndex + pages.length) % pages.length;
  state.score = Math.min(999, state.score + 6);
  renderScreen();
}

function enterConsoleDetail() {
  state.view = "detail";
  resetConsoleDetail();
  state.score = Math.min(999, state.score + 18);
  renderScreen();
}

function openExternalFromConsole(page) {
  if (!page?.url) return false;

  state.score = Math.min(999, state.score + 25);
  if (page.url.includes("github.com") || page.url.includes("linkedin.com") || page.url.includes("Resume.pdf") || page.url.startsWith("mailto:")) unlockQuest("contact");
  if (page.url.includes("oraxai.ca") || page.url.includes("neuralforge") || page.url.includes("lyric-engine")) unlockQuest("builds");

  if (page.url.startsWith("mailto:")) {
    window.location.href = page.url;
  } else {
    window.open(page.url, "_blank", "noopener,noreferrer");
  }
  renderScreen();
  return true;
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

function getCartColor(index, sourceElement) {
  return (
    sourceElement?.style?.getPropertyValue("--cart-bg") ||
    sourceElement?.style?.getPropertyValue("--route-bg") ||
    cartColors[index] ||
    "#ffd166"
  ).trim();
}

function animateCardFlight(index, sourceElement) {
  if (!sourceElement || !cartSlot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  window.cancelAnimationFrame(animateCardFlight.frame);
  animateCardFlight.activeCard?.remove();

  const sourceRect = sourceElement.getBoundingClientRect();
  const slotRect = cartSlot.getBoundingClientRect();
  if (!sourceRect.width || !sourceRect.height || !slotRect.width || !slotRect.height) return;

  const width = Math.min(Math.max(sourceRect.width, 72), 104);
  const height = Math.min(Math.max(sourceRect.height, 82), 132);
  const startLeft = sourceRect.left + sourceRect.width / 2 - width / 2;
  const startTop = sourceRect.top + sourceRect.height / 2 - height / 2;
  const targetLeft = slotRect.left + slotRect.width / 2 - width / 2;
  const targetTop = slotRect.top - height * 0.62;
  const flightCard = document.createElement("div");
  const item = screenItems[index];

  flightCard.className = "insert-flight-card";
  flightCard.style.left = `${startLeft}px`;
  flightCard.style.top = `${startTop}px`;
  flightCard.style.width = `${width}px`;
  flightCard.style.height = `${height}px`;
  flightCard.style.setProperty("--flight-bg", getCartColor(index, sourceElement));
  flightCard.innerHTML = `<strong>${item.cart}</strong><small>Cart</small>`;
  document.body.appendChild(flightCard);
  animateCardFlight.activeCard = flightCard;

  const dx = targetLeft - startLeft;
  const dy = targetTop - startTop;
  const duration = 820;
  const lift = Math.min(86, Math.max(34, Math.abs(dy) * 0.18));
  const startTilt = sourceRect.left < slotRect.left ? -6 : 6;
  const sinkDistance = Math.min(height * 0.64, 74);
  const t0 = performance.now();

  function step(now) {
    const t = Math.min((now - t0) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    const plugT = t > 0.74 ? (t - 0.74) / 0.26 : 0;
    const arc = Math.sin(t * Math.PI) * lift;
    const sinkEase = plugT * plugT * (3 - 2 * plugT);
    const sink = sinkEase * sinkDistance;
    const x = dx * ease;
    const y = dy * ease - arc + sink;
    const rotate = startTilt * (1 - ease) + Math.sin(t * Math.PI) * -5;
    const rotateX = 16 * (1 - ease) + sinkEase * -8;
    const scale = 1 - ease * 0.1 - sinkEase * 0.08;
    const opacity = t > 0.92 ? 1 - ((t - 0.92) / 0.08) * 0.72 : 1;
    const hiddenBottom = Math.min(82, sinkEase * 78);

    flightCard.style.transform = `translate(${x}px, ${y}px) rotateX(${rotateX}deg) rotate(${rotate}deg) scale(${scale})`;
    flightCard.style.opacity = `${opacity}`;
    flightCard.style.clipPath = `inset(0 0 ${hiddenBottom}% 0 round 10px 10px 4px 4px)`;

    if (t < 1) {
      animateCardFlight.frame = window.requestAnimationFrame(step);
    } else {
      flightCard.remove();
      if (animateCardFlight.activeCard === flightCard) animateCardFlight.activeCard = null;
    }
  }

  animateCardFlight.frame = window.requestAnimationFrame(step);
}

function playInsertAnimation(index, sourceElement) {
  const color = getCartColor(index, sourceElement);
  animateCardFlight(index, sourceElement);
  consoleEl?.style.setProperty("--insert-bg", color);
  cartSlot?.style.setProperty("--insert-bg", color);
  consoleEl?.classList.add("is-inserting");
  cartSlot?.classList.add("is-plugging");
  window.clearTimeout(playInsertAnimation.timer);
  playInsertAnimation.timer = window.setTimeout(() => {
    consoleEl?.classList.remove("is-inserting");
    cartSlot?.classList.remove("is-plugging");
  }, 840);
}

function insertCart(index, mode = "insert", sourceElement = null) {
  state.loaded = index;
  state.selected = index;
  state.powered = true;
  state.view = "detail";
  resetConsoleDetail();
  state.score = Math.min(999, state.score + (mode === "drag" ? 75 : 55));
  document.documentElement.classList.remove("cart-dragging");
  cartSlot?.classList.remove("is-hot");
  playInsertAnimation(index, sourceElement);
  playBlip("insert");
  bootConsole();
  unlockQuest("cart");
  focusConsoleOnSmallScreens();
}

function ejectCart() {
  if (state.loaded === null) return;
  state.loaded = null;
  state.view = "menu";
  resetConsoleDetail();
  state.score = Math.min(999, state.score + 15);
  playBlip("eject");
  renderScreen();
}

function openCurrent() {
  const item = loadedItem() || currentItem();
  if (state.view !== "detail" && state.loaded === null) {
    enterConsoleDetail();
    return;
  }

  const { page, index } = activeDetail(item);
  if (openExternalFromConsole(page)) return;

  setDetailPage(index + 1);
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
    if (state.view === "detail" || state.loaded !== null) setDetailPage(state.detailIndex - 1);
    else setSelected(state.selected - 1);
  }

  if (action === "down") {
    playBlip("tap");
    if (state.view === "detail" || state.loaded !== null) setDetailPage(state.detailIndex + 1);
    else setSelected(state.selected + 1);
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
    if (state.view === "detail") {
      playBlip("back");
      state.view = "menu";
      resetConsoleDetail();
      renderScreen();
      return;
    }
    playBlip("back");
    setSelected(0);
  }

  if (action === "top") {
    if (state.loaded !== null) {
      ejectCart();
      return;
    }
    playBlip("tap");
    state.view = "menu";
    resetConsoleDetail();
    renderScreen();
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
    insertCart(Number(tableCard.dataset.tableCartIndex), "tap", tableCard);
    updateTabletop();
    return;
  }

  if (event.target.closest("[data-open-scan]")) {
    openRecruiterPanel();
    return;
  }

  const mobileCart = event.target.closest("[data-mobile-cart-index]");
  if (mobileCart) {
    insertCart(Number(mobileCart.dataset.mobileCartIndex), "tap", mobileCart);
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
    else insertCart(index, "tap", cart);
    return;
  }

  const control = event.target.closest("[data-console-action]");
  if (control) {
    flashControl(control);
    handleAction(control.dataset.consoleAction);
    return;
  }

  if (consoleEl?.contains(event.target)) {
    const fallbackAction = getConsoleActionFromPoint(event);
    if (fallbackAction) {
      flashControl(document.querySelector(`[data-console-action="${fallbackAction}"]`));
      handleAction(fallbackAction);
      return;
    }
  }

  const menuButton = event.target.closest("[data-screen-index]");
  if (menuButton) {
    playBlip("tap");
    setSelected(Number(menuButton.dataset.screenIndex));
  }

  const contactLink = event.target.closest('a[href^="mailto:"], a[href*="linkedin.com/in/samielfigha"], a[href*="github.com/SMXFREEZE"], a[href*="oraxai.ca"], a[href$="Sami-El-Figha-Resume.pdf"]');
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
      if (shouldInsert) insertCart(drag.index, "drag", cart);
      if (shouldTap) {
        suppressNextCartClick = true;
        if (state.loaded === targetIndex) ejectCart();
        else insertCart(targetIndex, "tap", cart);
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

consoleEl?.addEventListener("click", (event) => {
  if (event.target.closest("button, a")) return;
  lcd?.focus({ preventScroll: true });
});

function shouldHandleConsoleKeys() {
  const active = document.activeElement;
  if (!consoleEl || !active || active === document.body) return false;
  return consoleEl.contains(active);
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

  if (!shouldHandleConsoleKeys()) return;

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

function setupProjectCards() {
  const canTilt = window.matchMedia("(hover: hover)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  projectCards.forEach((card) => {
    const front = card.querySelector(".project-card-front");
    const close = card.querySelector(".project-card-close");
    if (!front) return;

    const setOpen = (open) => {
      card.classList.toggle("is-open", open);
      front.setAttribute("aria-expanded", String(open));
    };

    front.addEventListener("click", () => {
      setOpen(true);
      unlockQuest("builds");
      playBlip("tap");
      window.setTimeout(() => close?.focus({ preventScroll: true }), 360);
    });

    close?.addEventListener("click", () => {
      setOpen(false);
      playBlip("tap");
      front.focus({ preventScroll: true });
    });

    if (!canTilt) return;

    front.addEventListener("pointermove", (event) => {
      const rect = front.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      front.style.setProperty("--tilt-x", `${x * 8}deg`);
      front.style.setProperty("--tilt-y", `${-y * 6}deg`);
    });

    front.addEventListener("pointerleave", () => {
      front.style.setProperty("--tilt-x", "0deg");
      front.style.setProperty("--tilt-y", "0deg");
    });
  });
}

setupProjectCards();
setupCartridgeDrag();
updateQuestProgress();
renderRecruiterRoute();
renderScreen();
window.setTimeout(() => bootConsole({ silent: true }), 420);
