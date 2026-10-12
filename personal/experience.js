// Experience: one continuous anime film, told in four acts. The same lake from one hillside, from
// first light to night: the goose at dawn (GutGutGoose), a golden city wakes across the water
// (Blaze), lanterns rise at blue hour (Venu), the night tree under three small lights (NeuralSeek).
//
// Each act loops while its world holds. It opens on a title card (the company's real logo and its
// name, set like the page's section titles); as you scroll, the camera settles and the card
// travels down into a lower third with the role, dates and résumé bullets. Scrolling on plays
// the shot that carries the light into the next act.

const section = document.querySelector('.experience');

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const sstep = (x, a, b) => smooth(clamp((x - a) / (b - a), 0, 1));
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

// each act's film: where its subject sits (so a phone crops to it), the shot into the next act,
// and how far a phone pans off the subject as the lower third comes in
const FILMS = {
  gutgutgoose: { focus: [0.66, 0.55], next: 't12', phonePan: 0.17 },
  blaze: { focus: [0.6, 0.5], next: 't23' },
  venu: { focus: [0.55, 0.55], next: 't34' },
  neuralseek: { focus: [0.6, 0.55], next: null },
};
// Where each clip sits for a portrait phone: the phone masters hold only the strip [x0, x1] of the
// frame that a phone shows (each act's focus and pan; a transition's framing from one act to the
// next). Computed by tools/experience3d/film_master.py, which crops them; keep the two in sync.
const CROPS = { gutgutgoose: [0.47, 1], blaze: [0.3, 0.78], venu: [0.37, 0.85], neuralseek: [0.3, 0.78], t12: [0.41, 1], t23: [0.3, 0.73], t34: [0.42, 0.85] };
const FULL = [0, 1];
const NAVY = '#0c1626';         // the film's scrims: the site's navy
const TITLE = 0.6;              // the title stop, in steps
const STEP = 2.0;               // one act: the title card, the camera settles, the lower third holds, then the shot to the next
const HAND = 0.45;              // half-width of a hand-off: long enough for the transition shot to breathe
const SETTLE = [0.72, 1.22];    // inside an act: where the card travels into the lower third

function init() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sticky = section.querySelector('.experience__sticky');
  const frame = section.querySelector('.experience__frame');
  const canvas = section.querySelector('.experience__canvas');
  const intro = section.querySelector('.experience__intro');
  const title = section.querySelector('.experience__title');
  const subtitle = section.querySelector('.experience__subtitle');

  const split = el => {
    const text = el.textContent.trim();
    el.setAttribute('aria-label', text);
    el.textContent = '';
    return [...text].map(ch => {
      const s = document.createElement('span');
      s.className = 'experience-letter'; s.setAttribute('aria-hidden', 'true');
      s.textContent = ch === ' ' ? ' ' : ch;
      el.append(s);
      return s;
    });
  };
  let titleLetters = split(title), layoutDirty = true;
  new MutationObserver(() => {
    if (!title.querySelector('.experience-letter')) titleLetters = split(title);
    layoutDirty = true;
  }).observe(title, { childList: true });
  new MutationObserver(() => { layoutDirty = true; }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

  const worlds = [...section.querySelectorAll('.experience-world')].map((el, i) => ({
    el, slug: el.dataset.slug, dir: i % 2 ? -1 : 1,
    lead: el.querySelector('.experience-world__lead'),
    slot: el.querySelector('.experience-world__brand-slot'),
    brand: el.querySelector('.experience-world__brand'),
    details: el.querySelector('.experience-world__details'),
    points: el.querySelector('.experience-world__points'),
    card: { tx: 0, ty: 0, k: 0.4 },
  }));
  const N = worlds.length;
  const U = TITLE + N * STEP;

  // ---- scroll ----------------------------------------------------------------------
  let p = 0, u = 0, s = -1, enter = 0, leave = 0, H = frame.clientHeight, iface = null, lastY = scrollY, velocity = 0, sawBack = false;
  const settleOf = k => smooth(clamp((u - (TITLE + k * STEP) - SETTLE[0]) / (SETTLE[1] - SETTLE[0]), 0, 1));
  function measure(dt) {
    const r = section.getBoundingClientRect();
    // the stage's own height (100svh), which holds still while Safari's toolbars come and go
    const vh = Math.max(1, sticky.clientHeight);
    p = clamp(-r.top / Math.max(1, section.offsetHeight - vh), 0, 1);
    enter = clamp(1 - r.top / vh, 0, 1);
    leave = clamp((vh - r.bottom) / (vh * 0.8), 0, 1);
    u = p * U;
    let st = -1;
    for (let k = 0; k < N; k++) st += smooth(clamp((u - (TITLE + k * STEP - HAND)) / (2 * HAND), 0, 1));
    s = st;
    velocity = (scrollY - lastY) / Math.max(dt, 1 / 240);
    if (velocity < -60) sawBack = true;              // the reversed shots load only for someone who scrolls back
    lastY = scrollY;
    // while the stage is pinned it owns the site chrome's ink (re-asserted: the site's own scroll
    // triggers can set it after a reload); once it scrolls off, hand back to the journey section
    if (r.top <= 0 && r.bottom > vh * 0.5) {
      if (document.body.dataset.interfaceColor !== 'cream') document.body.dataset.interfaceColor = 'cream';
      iface = 'cream';
    } else if (iface && r.bottom <= vh * 0.5) { document.body.dataset.interfaceColor = 'cream'; iface = null; }
  }

  // ---- the title card and the lower third ------------------------------------------
  // The card is laid out at title size inside the lower third and scaled down into its slot, so
  // the type is only ever scaled down. As a title it sits big at the bottom left, on the lower
  // third's baseline, leaving the film's subject (mid-frame in every act) clear; it then shrinks
  // and rises into its slot as the role and bullets come in under and beside it.
  function place() {
    const fw = frame.clientWidth, fh = frame.clientHeight;
    const narrow = fw < 760;
    for (const w of worlds) {
      const k = parseFloat(getComputedStyle(w.el).getPropertyValue('--brand-k')) || 0.4;
      const bw = w.brand.offsetWidth, bh = w.brand.offsetHeight;
      w.slot.style.height = `${bh * k}px`;
      if (narrow) w.el.style.setProperty('--points-h', `${w.points.offsetHeight}px`);
      else w.el.style.removeProperty('--points-h');
      const top = w.lead.offsetTop + w.slot.offsetTop + w.brand.offsetTop;
      const baseline = w.points.offsetTop + w.points.offsetHeight;    // the lower third's bottom edge
      // a card wider than the frame's text column shrinks to fit as a title too
      const fit = Math.min(1, (fw * (narrow ? 0.86 : 0.8)) / bw);
      w.card = { k, fit, tx: 0, ty: baseline - (top + bh) };
    }
    layoutDirty = true;
  }
  new ResizeObserver(place).observe(frame);
  worlds.forEach(w => { new ResizeObserver(place).observe(w.lead); new ResizeObserver(place).observe(w.points); });
  document.fonts?.ready.then(place);

  // nothing moves unless the scroll, the frame or the text did: skip the style writes otherwise
  let drawnP = -1, drawnEnter = -1, drawnLeave = -1;
  function layout() {
    if (!layoutDirty && p === drawnP && enter === drawnEnter && leave === drawnLeave) return;
    layoutDirty = false;
    drawnP = p; drawnEnter = enter; drawnLeave = leave;
    const enterScale = 0.94 + 0.06 * smooth(enter), leaveScale = 1 - 0.06 * smooth(leave);
    frame.style.transformOrigin = leave > 0 ? '50% 100%' : '50% 0';
    frame.style.transform = `scale(${enterScale * leaveScale})`;

    // the title lifts away letter by letter as the first act comes forward
    const q = clamp(s + 1, 0, 1);
    intro.style.visibility = q > 0.995 ? 'hidden' : 'visible';
    if (q <= 0.995) {
      intro.style.opacity = 1 - sstep(q, 0.15, 0.6);
      const m = Math.max(1, titleLetters.length - 1);
      titleLetters.forEach((l, j) => {
        const t = 0.3 + 0.7 * Math.pow(j / m, 1.6);
        l.style.transform = reduced ? 'none' : `translate3d(0, ${-q * H * 0.42 * t}px, 0) rotate(${-q * 16 * t}deg)`;
      });
      subtitle.style.transform = reduced ? 'none' : `translate3d(0, ${-q * H * 0.24}px, 0)`;
    }
    section.style.setProperty('--stage-in', sstep(s, -0.4, -0.1).toFixed(3));
    section.style.setProperty('--stage-calm', (s < 0 ? 1 : 1 - sstep(Math.abs(s - Math.round(s)), 0.06, 0.16)).toFixed(3));

    const rise = s < 0 ? sstep(s, -0.85, 0) : 1;
    worlds.forEach((w, i) => {
      // an act's card arrives late in the shot that leads to it, and its type leaves early in
      // the shot that leads away, so the middle of each transition plays clean
      const arrive = i === 0 ? sstep(rise, 0.35, 1) : s <= i - 1 ? 0 : s >= i ? 1 : sstep(s - (i - 1), 0.7, 0.96);
      const gone = s <= i ? 0 : s >= i + 1 ? 1 : sstep(s - i, 0.04, 0.3);
      const o = arrive * (1 - gone);
      const on = o > 0.001;
      w.el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      const q = settleOf(i);
      const t = reduced ? (q > 0.5 ? 1 : 0) : sstep(q, 0.04, 0.72);   // the card travels into the lower third
      const { tx, ty, k, fit } = w.card;
      const sc = fit * Math.pow(k / fit, t);                           // even-feeling scale: title size to lower-third size
      const lift = reduced ? 0 : (1 - arrive) * 18;
      w.brand.style.opacity = o;
      w.brand.style.transform = `translate3d(${tx * (1 - t)}px, ${ty * (1 - t) + lift}px, 0) scale(${sc})`;
      const d = reduced ? (q > 0.5 ? 1 : 0) : sstep(q, 0.5, 0.88), pts = reduced ? d : sstep(q, 0.6, 0.96);
      w.details.style.opacity = o * d;
      w.details.style.transform = `translate3d(0, ${(1 - d) * 16}px, 0)`;
      w.points.style.opacity = o * pts;
      w.points.style.transform = `translate3d(0, ${(1 - pts) * 16}px, 0)`;
    });
  }

  // ---- the film ----------------------------------------------------------------------
  // start loading the film a little over a screen ahead (measured in the stage's stable height)
  let gl = null, preloadObserver = null, preloadMargin = -1;
  function observePreload() {
    const margin = Math.round(sticky.clientHeight * 1.2);
    if (gl || margin === preloadMargin) return;
    preloadMargin = margin;
    preloadObserver?.disconnect();
    preloadObserver = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !gl) {
        gl = 'loading';
        setup3d().then(x => { gl = x; preloadObserver.disconnect(); }).catch(err => { console.warn('experience film:', err); gl = null; });
      }
    }, { rootMargin: `${margin}px 0px` });
    preloadObserver.observe(section);
  }
  observePreload();

  async function setup3d() {
    const THREE = await import('/personal/vendor/three/build/three.module.min.js');
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const saveData = navigator.connection?.saveData;
    const moving = !reduced && !saveData;
    const dpr = Math.min(devicePixelRatio, coarse ? 1.5 : 2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.NoToneMapping;
    const texLoader = new THREE.TextureLoader();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // The films are mastered at 60 fps: 2560x1440 for a desktop ("desk"), and for a portrait phone
    // a full-height crop of just the part it shows ("phone", see CROPS). HEVC where the hardware
    // decodes it (Safari, and almost every Chrome/Edge/Firefox), H.264 at 30 fps otherwise.
    const HEVC = 'video/mp4; codecs="hvc1.1.6.L153.90"';
    let codec = 'h264';
    if (document.createElement('video').canPlayType(HEVC)) {
      codec = 'hevc';
      try {
        const r = await navigator.mediaCapabilities?.decodingInfo({ type: 'file', video: { contentType: HEVC, width: 2560, height: 1440, bitrate: 7e6, framerate: 60 } });
        if (r && !(r.supported && r.smooth)) codec = 'h264';
      } catch {}
    }
    let mode = frame.clientWidth / frame.clientHeight < 0.62 ? 'phone' : 'desk';
    const url = (name, rev) => `/personal/experience/films/${name}-${mode}${rev ? '-rev' : ''}.${codec}.mp4`;
    const cropOf = tex => (tex.userData.name && mode === 'phone' ? CROPS[tex.userData.name] : FULL);

    function clip(name, { loop = false, rev = false } = {}) {
      const v = Object.assign(document.createElement('video'), { muted: true, loop, playsInline: true, preload: 'none', crossOrigin: 'anonymous' });
      v.setAttribute('muted', ''); v.setAttribute('playsinline', '');
      v.dataset.name = name; v.dataset.rev = rev ? '1' : '';
      const tex = new THREE.VideoTexture(v); tex.colorSpace = THREE.SRGBColorSpace;
      tex.userData.name = name;
      // a paused video gets no frame callbacks: upload by hand when it has a frame or has seeked
      for (const ev of ['loadeddata', 'seeked']) v.addEventListener(ev, () => { tex.needsUpdate = true; });
      v.addEventListener('seeked', () => { v.seekingTo = null; });
      return [v, tex];
    }

    const loaded = await Promise.all(worlds.map(async w => {
      const film = FILMS[w.slug];
      // the act's loop: plays only while its act holds the screen
      const [video, vtex] = clip(w.slug, { loop: true });
      const poster = await texLoader.loadAsync(`/personal/experience/films/${w.slug}-poster.webp`);
      poster.colorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      // the film fills the frame (cover), pans gently as the camera settles and slowly pushes in.
      // The grade: a deeper sky so the header reads, and a navy rise from the bottom behind the
      // title card and the lower third, with a soft shade behind the bullets
      const bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        depthTest: false, depthWrite: false,
        uniforms: {
          tFilm: { value: poster }, tFilm2: { value: poster }, uMix: { value: 0 }, uDec: { value: new THREE.Vector2(0, 0) },
          uCrop1: { value: new THREE.Vector2(0, 1) }, uCrop2: { value: new THREE.Vector2(0, 1) },
          uFilmAspect: { value: 16 / 9 }, uAspect: { value: 1 }, uFocus: { value: new THREE.Vector2(film.focus[0], film.focus[1]) },
          uPan: { value: 0 }, uZoom: { value: 1 }, uScrim: { value: new THREE.Color(NAVY) }, uTop: { value: 0.32 }, uLow: { value: 0.6 }, uBullets: { value: new THREE.Vector2(0.72, 0.24) }, uCaption: { value: 0 },
        },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
        fragmentShader: /* glsl */`
          uniform sampler2D tFilm, tFilm2; uniform vec2 uDec, uFocus, uCrop1, uCrop2; uniform vec3 uScrim;
          uniform float uMix, uFilmAspect, uAspect, uPan, uZoom, uTop, uLow, uCaption; uniform vec2 uBullets;
          varying vec2 vUv;
          // three decodes sRGB video only inside its own materials, so a video frame arrives here
          // still encoded (uDec = 1) while the poster image is already linear (uDec = 0)
          vec3 linear(vec3 c, float on) { return mix(c, mix(c * 0.0773993808, pow(c * 0.9478672986 + 0.0521327014, vec3(2.4)), step(0.04045, c)), on); }
          // a phone clip holds only the strip [x0, x1] of the frame: map frame coordinates into it
          vec2 inCrop(vec2 uv, vec2 c) { return vec2((uv.x - c.x) / (c.y - c.x), uv.y); }
          void main() {
            // cover-fit around the film's subject (uFocus), so a phone crops to what matters
            vec2 scale = uAspect > uFilmAspect ? vec2(1.0, uFilmAspect / uAspect) : vec2(uAspect / uFilmAspect, 1.0);
            scale /= uZoom;
            vec2 centre = clamp(uFocus + vec2(uPan, 0.0), scale * 0.5, 1.0 - scale * 0.5);
            vec2 uv = centre + (vUv - 0.5) * scale;
            vec3 col = mix(linear(texture2D(tFilm, inCrop(uv, uCrop1)).rgb, uDec.x), linear(texture2D(tFilm2, inCrop(uv, uCrop2)).rgb, uDec.y), uMix);
            col = mix(col, uScrim, smoothstep(0.6, 1.0, vUv.y) * uTop + (1.0 - smoothstep(0.0, 0.3, vUv.y)) * 0.14);
            float low = 1.0 - smoothstep(0.0, uLow, vUv.y);
            vec2 b = (vUv - uBullets) / vec2(0.36, 0.26);
            col = mix(col, uScrim, clamp(pow(low, 1.3) * mix(0.5, 0.78, uCaption) + exp(-dot(b, b) * 1.2) * 0.42 * uCaption, 0.0, 0.86));
            gl_FragColor = vec4(col, 1.0);
          }`,
      }));
      bg.frustumCulled = false;
      scene.add(bg);
      // the shot that carries the camera into the next act, and (HEVC) the same shot reversed
      const [trans, ttex] = film.next ? clip(film.next) : [null, null];
      const [transR, ttexR] = film.next && codec === 'hevc' ? clip(film.next, { rev: true }) : [null, null];
      return { ...w, scene, bg, video, vtex, poster, trans, ttex, transR, ttexR, copy: 'f', shown: ttex, rate: 1 };
    }));
    const videos = loaded.flatMap(o => [o.video, o.trans, o.transR]).filter(Boolean);

    function load(v) { if (moving && v && !v.src) { v.src = url(v.dataset.name, v.dataset.rev); v.preload = 'auto'; v.load(); } }
    // a phone turned sideways (or back) needs the other master: swap sources, keep the time
    function remaster() {
      for (const v of videos) {
        if (!v.src) continue;
        const t = v.currentTime, wasPlaying = !v.paused;
        v.src = url(v.dataset.name, v.dataset.rev); v.load();
        v.addEventListener('loadedmetadata', () => { v.currentTime = Math.min(t, (v.duration || t) - 0.05); if (wasPlaying) v.play().catch(() => {}); }, { once: true });
      }
    }
    function play(o, on) {
      if (on && moving) { load(o.video); if (o.video.paused) o.video.play().catch(() => {}); }
      else if (!o.video.paused) o.video.pause();
    }
    // back to the loop's first frame (the frame its transition shot ends on), while nobody sees it
    function rewind(o) { const v = o.video; if (v.paused && v.readyState >= 1 && !v.seeking && v.currentTime > 0.02) v.currentTime = 0; }
    const still = o => (o.video.readyState >= 2 ? o.vtex : o.poster);
    function film(o, t1, t2, m) {
      const u = o.bg.material.uniforms;
      u.tFilm.value = t1; u.tFilm2.value = t2; u.uMix.value = m;
      u.uDec.value.set(t1.isVideoTexture ? 1 : 0, t2.isVideoTexture ? 1 : 0);
      u.uCrop1.value.fromArray(cropOf(t1)); u.uCrop2.value.fromArray(cropOf(t2));
    }
    const rest = v => { if (v && !v.paused) v.pause(); };
    function seek(v, t) { if (v.seekingTo == null && Math.abs(v.currentTime - t) > 1 / 60) { v.seekingTo = t; v.currentTime = t; } }

    // The transition shot follows the scroll. It plays towards where the scroll is, faster the
    // further behind it is, so it runs at the decoder's full frame rate; scrolling back plays the
    // reversed copy. A fling far ahead jumps; without a reversed copy (H.264) it seeks instead.
    function shot(o, f) {
      const vF = o.trans, vR = o.transR;
      if (!vF || !moving) return null;
      load(vF); if (sawBack) load(vR);
      if (vF.readyState < 2 || !vF.duration) return null;
      const dur = vF.duration, T = clamp(f, 0, 1) * (dur - 0.03);
      if (!vR) { seek(vF, T); return o.ttex; }
      const back = o.copy === 'r', active = back ? vR : vF;
      if (active.seeking || active.readyState < 2) return o.shown;   // hold the last good frame while it lands
      o.shown = back ? o.ttexR : o.ttex;
      const t = back ? dur - vR.currentTime : vF.currentTime, gap = T - t;
      const to = (copy, time) => {
        rest(vF); rest(vR); o.copy = copy;
        if (copy === 'r') vR.currentTime = dur - time; else vF.currentTime = time;
      };
      if (Math.abs(gap) < 0.025) { rest(vF); rest(vR); return o.shown; }
      const useR = gap < 0;
      if (useR && vR.readyState < 2) { rest(vF); o.copy = 'f'; seek(vF, T); return o.shown; }   // reversed copy not here yet
      if (Math.abs(gap) > 1.2) { to(useR ? 'r' : 'f', T); return o.shown; }                     // a fling: jump
      if (useR !== back) { to(useR ? 'r' : 'f', t); return o.shown; }                           // turned around
      const v = useR ? vR : vF, rate = clamp(Math.abs(gap) * 5, 0.5, 6);
      if (Math.abs(v.playbackRate - rate) > 0.05) v.playbackRate = rate;
      if (v.paused) v.play().catch(() => {});
      return o.shown;
    }

    // the frame renders linear into a target; the composite encodes it and adds the site's grain
    const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tA: { value: rt.texture }, uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D tA; uniform float uTime; varying vec2 vUv;
        // a hash with no lattice, so the grain never shows a repeat
        float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          float g = hash12(gl_FragCoord.xy + floor(uTime * 24.0) * vec2(37.0, 17.0));
          gl_FragColor = vec4(texture2D(tA, vUv).rgb, 1.0);
          #include <colorspace_fragment>
          gl_FragColor.rgb += (g - 0.5) * 0.035;                                  // grain, like the site's gradients
        }`,
    }));
    comp.frustumCulled = false;
    const compScene = new THREE.Scene(); compScene.add(comp);

    let portrait = false, drawnW = 0, drawnH = 0;
    const pan = o => (portrait ? FILMS[o.slug].phonePan || 0.12 : 0.05);
    function resize() {
      const w = frame.clientWidth, h = frame.clientHeight;
      if (w === drawnW && h === drawnH) return;                // Safari's toolbars resize the window, not the stage
      drawnW = w; drawnH = h;
      H = h;
      renderer.setSize(w, h, false);
      rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
      const aspect = w / h;
      portrait = aspect < 0.85;
      const want = aspect < 0.62 ? 'phone' : 'desk';
      if (want !== mode) { mode = want; remaster(); }
      for (const o of loaded) {
        const u = o.bg.material.uniforms;
        u.uAspect.value = aspect;
        u.uTop.value = portrait ? 0.42 : 0.32;
        u.uLow.value = portrait ? 0.92 : 0.6;     // a phone's lower third runs higher up the frame
        u.uBullets.value.set(portrait ? 0.4 : 0.72, portrait ? 0.34 : 0.24);   // on a phone: behind the role, the lower third's top
      }
    }
    new ResizeObserver(resize).observe(frame);
    resize();

    function step(o, q, dt) {
      const u = o.bg.material.uniforms;
      u.uPan.value = reduced ? 0 : o.dir * q * pan(o);       // the film slides as the camera settles (on a phone, off the subject)
      u.uZoom.value = 1.02 + (reduced ? 0 : q * 0.06);       // and pushes in slowly
      u.uCaption.value = sstep(q, 0.4, 0.85);
      // scrolling quickens the loop a little, then it eases back to its own pace
      o.rate = damp(o.rate, clamp(1 + Math.abs(velocity) / 1600, 1, 1.9), 3, dt);
      if (!o.video.paused && Math.abs(o.video.playbackRate - o.rate) > 0.04) o.video.playbackRate = o.rate;
    }
    function draw(o) { renderer.setRenderTarget(rt); renderer.render(o.scene, camera); }

    for (const o of loaded) { await renderer.compileAsync(o.scene, camera); draw(o); }
    renderer.setRenderTarget(null);
    section.classList.add('is-ready');

    return {
      frame(dt, now) {
        const sc = Math.max(0, s);
        const a = Math.min(N - 1, Math.floor(sc)), f = sc - a;
        const handing = f > 0.0005 && f < 0.9995 && a + 1 < N;
        const A = loaded[f >= 0.9995 ? Math.min(N - 1, a + 1) : a];
        const B = handing ? loaded[a + 1] : null;
        const ia = loaded.indexOf(A);
        // only the act holding the screen plays; during a hand-off both loops wait, and the one
        // at the far end of the shot is rewound to its first frame so the shot lands on it exactly
        loaded.forEach(o => {
          play(o, o === A && !handing);
          if (!(handing && o === A)) { rest(o.trans); rest(o.transR); }
        });
        // get ready both ways: the shot onward and the next loop, and the shot back (reversed)
        load(A.trans);
        if (ia + 1 < N) load(loaded[ia + 1].video);
        if (ia > 0 && sawBack) load(loaded[ia - 1].transR || loaded[ia - 1].trans);
        if (handing) rewind(f < 0.5 ? B : A);
        comp.material.uniforms.uTime.value = now * 0.001;
        if (handing) {
          // one shot, framed from the end of one act (panned, pushed in) to the start of the next
          const W = f < 0.5 ? A : B;
          step(W, settleOf(W === A ? a : a + 1), dt);
          const ub = W.bg.material.uniforms;
          // the frozen loop melts into the shot; the shot ends on the next loop's first frame
          const tex = shot(A, f);
          if (tex) film(W, f < 0.5 ? still(A) : tex, f < 0.5 ? tex : still(B), f < 0.5 ? sstep(f, 0, 0.14) : sstep(f, 0.94, 1));
          else film(W, still(A), still(B), sstep(f, 0.3, 0.7));
          ub.uPan.value = reduced ? 0 : (1 - f) * A.dir * pan(A);
          ub.uZoom.value = reduced ? 1.02 : 1.08 + (1.02 - 1.08) * f;
          ub.uCaption.value = W === A ? 1 - sstep(f, 0.04, 0.3) : 0;
          draw(W);
        } else {
          step(A, settleOf(ia), dt);
          film(A, still(A), still(A), 0);
          draw(A);
        }
        renderer.setRenderTarget(null);
        renderer.render(compScene, camera);
      },
      sleep() { videos.forEach(rest); },
    };
  }

  // ---- loop -------------------------------------------------------------------------
  let running = false, raf = 0, then = performance.now();
  const tick = now => {
    const dt = clamp((now - then) / 1000, 1 / 240, 0.05); then = now;
    measure(dt);
    layout();
    if (gl && gl !== 'loading') gl.frame(dt, now);
    raf = requestAnimationFrame(tick);
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; then = performance.now(); lastY = scrollY; raf = requestAnimationFrame(tick); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); if (gl && gl !== 'loading') gl.sleep(); }
  }).observe(section);
  new ResizeObserver(() => {
    H = frame.clientHeight;
    layoutDirty = true;
    observePreload();
  }).observe(frame);
  place(); measure(1 / 60); layout();
}

if (section) init();
