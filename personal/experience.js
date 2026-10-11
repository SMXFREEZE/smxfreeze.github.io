// Experience worlds. Each company is staged like the first page's hero: its name set huge
// behind its 3D mark, the mark spinning in the hero's chrome inside the company's own gradient
// world, glass on hover with a ripple on click. Scrolling orbits the camera 90° and up, exactly
// as the hero does, to reveal the role words, while the caption settles in. Then the next world
// rises in from below behind a soft, grainy edge.
//
// The scene numbers below (camera, planes, fits, shader) are the hero's own, read from
// /assets/home-Y5hht4vi.js, so each world moves and reads like more of the first page.

const section = document.querySelector('.experience');

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = t => t * t * (3 - 2 * t);
const sstep = (x, a, b) => smooth(clamp((x - a) / (b - a), 0, 1));
const damp = (a, b, l, dt) => a + (b - a) * (1 - Math.exp(-l * dt));

// black brand marks become black chrome; the gradient marks keep the hero's bright chrome
const DARK = { gutgutgoose: true, blaze: true };
// which ink the site's own chrome (header, scroll indicator) takes over each world
const CHROME = { gutgutgoose: 'dark', blaze: 'dark', venu: 'cream', neuralseek: 'cream' };
// where the YC tile hangs beside its mark, in units of the mark's half-size (front view)
const YC_AT = { gutgutgoose: [1.05, 0.45], blaze: [1.0, 0.75], venu: [0.95, -0.55] };
const TITLE = 0.6;              // the title stop, in steps
const STEP = 1.7;               // one world: arrive, orbit, hold
const HAND = 0.25;              // half-width of a hand-off between worlds
const ORBIT = [0.32, 1.2];      // where the orbit runs inside a world's step

// the hero's glass, verbatim (uniform values below are the hero's too)
const GLASS_VERT = /* glsl */`
uniform float uSurfaceOffset;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
void main() {
  vec3 displacedPosition = position + normal * uSurfaceOffset;
  vec4 modelPosition = modelMatrix * vec4(displacedPosition, 1.0);
  vec4 projectedPosition = projectionMatrix * viewMatrix * modelPosition;
  gl_Position = projectedPosition;
  vNormal = normalize(normal);
  vPosition = modelPosition.xyz;
  vScreenPosition = projectedPosition;
}`;
const GLASS_FRAG = /* glsl */`
uniform float uOpacity, uTime, uHoverProgress, uNoiseScale, uNoiseSpeed, uRevealEdge, uFresnelPower;
uniform sampler2D uSceneTexture;
uniform float uClickProgress, uClickTime, uClickRadius, uClickWaveFrequency, uClickWaveSpeed, uClickRippleStrength, uClickGlowStrength, uClickRippleNoise;
uniform vec3 uClickPosition;
uniform float uDistortionStrength, uChromaticAberration;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec4 vScreenPosition;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 p) {
  vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDirection = normalize(cameraPosition - vPosition);
  float fresnel = pow(1.0 - clamp(abs(dot(normal, viewDirection)), 0.0, 1.0), uFresnelPower);
  float organicNoise = noise(vPosition * uNoiseScale + vec3(0.0, uTime * uNoiseSpeed, 0.0));
  float reveal = smoothstep(1.0 - uHoverProgress, 1.0 - uHoverProgress + uRevealEdge, organicNoise);
  float distanceToClick = distance(vPosition, uClickPosition);
  float clickMask = 1.0 - smoothstep(0.0, uClickRadius, distanceToClick);
  float clickElapsedTime = uTime - uClickTime;
  float rippleNoise = (noise(vPosition * uNoiseScale * 8.0 + vec3(0.0, uTime * 0.35, 4.2)) - 0.5) * uClickRippleNoise;
  float clickRipple = sin(((distanceToClick + rippleNoise) * uClickWaveFrequency) - (clickElapsedTime * uClickWaveSpeed));
  float clickWave = clickRipple * clickMask * uClickProgress * uHoverProgress;
  float rippleShape = abs(clickRipple);
  float rippleLine = smoothstep(0.99, 1.0, rippleShape);
  float rippleHalo = smoothstep(0.90, 1.0, rippleShape);
  vec2 screenUv = vScreenPosition.xy / vScreenPosition.w * 0.5 + 0.5;
  vec2 baseDir = vec2(noise(vPosition * uNoiseScale + vec3(uTime * uNoiseSpeed, 0.0, 0.0)) - 0.5,
                      noise(vPosition * uNoiseScale + vec3(12.4, uTime * uNoiseSpeed, 7.8)) - 0.5);
  vec2 distortion = baseDir * uDistortionStrength * reveal * uHoverProgress + normalize(baseDir + vec2(0.0001)) * clickWave * uClickRippleStrength;
  vec2 distortedScreenUv = screenUv + distortion;
  vec2 chromaticOffset = normalize(distortion + vec2(0.0001)) * uChromaticAberration * (1.0 + rippleHalo * clickMask * uClickProgress * 2.0) * reveal * uHoverProgress;
  vec3 sceneColor = vec3(texture2D(uSceneTexture, distortedScreenUv + chromaticOffset).r,
                         texture2D(uSceneTexture, distortedScreenUv).g,
                         texture2D(uSceneTexture, distortedScreenUv - chromaticOffset).b);
  float rippleGlow = (rippleLine * 0.80 + rippleHalo * 0.15) * clickMask * uClickProgress * uHoverProgress * uClickGlowStrength;
  vec3 finalColor = mix(sceneColor, vec3(0.90, 0.95, 1.0), mix(0.12, 0.28, fresnel)) + vec3(0.80, 0.95, 1.0) * rippleGlow;
  gl_FragColor = vec4(finalColor, reveal * uHoverProgress * uOpacity);
}`;

function init() {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
      s.textContent = ch === ' ' ? ' ' : ch;
      el.append(s);
      return s;
    });
  };
  let titleLetters = split(title);
  new MutationObserver(() => { if (!title.querySelector('.experience-letter')) titleLetters = split(title); }).observe(title, { childList: true });

  const worlds = [...section.querySelectorAll('.experience-world')].map(el => ({
    el, slug: el.dataset.slug, yc: el.dataset.yc, dir: Number(el.dataset.orbit) || 1,
    caption: el.querySelector('.experience-world__caption'),
  }));
  const N = worlds.length;
  const U = TITLE + N * STEP;

  // ---- scroll ----------------------------------------------------------------------
  let p = 0, u = 0, s = -1, enter = 0, leave = 0, H = frame.clientHeight, iface = null, lastY = scrollY, velocity = 0;
  const orbitOf = k => smooth(clamp((u - (TITLE + k * STEP) - ORBIT[0]) / (ORBIT[1] - ORBIT[0]), 0, 1));
  function measure(dt) {
    const r = section.getBoundingClientRect();
    const vh = innerHeight;
    p = clamp(-r.top / Math.max(1, section.offsetHeight - vh), 0, 1);
    enter = clamp(1 - r.top / vh, 0, 1);
    leave = clamp((vh - r.bottom) / (vh * 0.8), 0, 1);
    u = p * U;
    let st = -1;
    for (let k = 0; k < N; k++) st += smooth(clamp((u - (TITLE + k * STEP - HAND)) / (2 * HAND), 0, 1));
    s = st;
    velocity = (scrollY - lastY) / Math.max(dt, 1 / 240);
    lastY = scrollY;
    // while a world is pinned it owns the site chrome's ink (re-asserted: the site's own scroll
    // triggers can set it after a reload); once it scrolls off, hand back to the journey section
    if (r.top <= 0 && r.bottom > vh * 0.5) {
      const want = CHROME[worlds[clamp(Math.round(s), 0, N - 1)].slug] || 'cream';
      if (document.body.dataset.interfaceColor !== want) document.body.dataset.interfaceColor = want;
      iface = want;
    } else if (iface && r.bottom <= vh * 0.5) { document.body.dataset.interfaceColor = 'cream'; iface = null; }
  }

  function layout() {
    const enterScale = 0.94 + 0.06 * smooth(enter), leaveScale = 1 - 0.06 * smooth(leave);
    frame.style.transformOrigin = leave > 0 ? '50% 100%' : '50% 0';
    frame.style.transform = `scale(${enterScale * leaveScale})`;

    // the title lifts away letter by letter as the first world comes forward
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

    const sc = Math.max(0, s), a = Math.min(N - 1, Math.floor(sc)), f = sc - a;
    const inkA = getComputedStyle(worlds[a].el).getPropertyValue('--world-ink').trim();
    const inkB = getComputedStyle(worlds[Math.min(N - 1, a + 1)].el).getPropertyValue('--world-ink').trim();
    section.style.setProperty('--stage-ink', f > 0.5 ? inkB : inkA);
    section.style.setProperty('--stage-in', sstep(s, -0.4, -0.1).toFixed(3));
    section.style.setProperty('--stage-calm', (s < 0 ? 1 : 1 - sstep(Math.abs(s - Math.round(s)), 0.06, 0.16)).toFixed(3));

    // captions settle in with the role words, and leave with their world
    worlds.forEach((w, i) => {
      const d = i - s;
      const show = sstep(orbitOf(i), 0.74, 0.92);
      const on = show > 0.001 && d > -1 && d < 1;
      w.el.style.visibility = on ? 'visible' : 'hidden';
      if (!on) return;
      const lift = d < 0 && !reduced ? -d : 0;           // this world is handing over: it slides up
      w.caption.style.opacity = reduced ? show * (1 - sstep(-d, 0.3, 0.5)) : show;
      w.caption.style.transform = `translate3d(0, ${(1 - show) * 18 - lift * H}px, 0)`;
      if (lift > 0) {
        const edge = H - lift * H;                        // the hand-off edge, from the top
        const m = `linear-gradient(to bottom, #000 ${edge - 44}px, transparent ${edge + 44}px)`;
        w.el.style.maskImage = w.el.style.webkitMaskImage = m;
      } else w.el.style.maskImage = w.el.style.webkitMaskImage = 'none';
    });
  }

  // ---- 3D --------------------------------------------------------------------------
  let gl = null;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !gl) {
      gl = 'loading';
      setup3d().then(x => { gl = x; }).catch(err => { console.warn('experience 3d:', err); gl = null; });
    }
  }, { rootMargin: '120% 0px' }).observe(section);

  async function setup3d() {
    const THREE = await import('/personal/vendor/three/build/three.module.min.js');
    const { GLTFLoader } = await import('/personal/vendor/three/examples/jsm/loaders/GLTFLoader.js');
    const coarse = matchMedia('(hover: none) and (pointer: coarse)').matches;
    const narrow = innerWidth < 760;
    const lang = (document.documentElement.lang || localStorage.getItem('portfolio.language') || 'en').startsWith('fr') ? 'fr' : 'en';
    const layoutTag = coarse || narrow ? 'mobile' : 'desktop';
    const dpr = Math.min(devicePixelRatio, coarse ? 1.5 : 2);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    renderer.toneMapping = THREE.NoToneMapping;       // worlds render into targets; marks tone-map themselves
    const AXIS = new THREE.Vector3(0.2, 1, 0.1).normalize();
    const pmrem = new THREE.PMREMGenerator(renderer);
    const texLoader = new THREE.TextureLoader();
    const gltfLoader = new GLTFLoader();

    // The marks tone-map in their own shader (ACES, like the hero's renderer), so the gradient
    // and the text stay exactly as painted while the chrome rolls off like the hero's.
    const ACES = /* glsl */`
      vec3 expRRTAndODTFit(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
      vec3 expAces(vec3 color) {                // three's ACESFilmicToneMapping at exposure 1
        const mat3 inM = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 outM = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        color *= 1.0 / 0.6;
        return clamp(outM * expRRTAndODTFit(inM * color), 0.0, 1.0);
      }`;
    const aces = m => {
      m.onBeforeCompile = sh => {
        sh.fragmentShader = sh.fragmentShader
          .replace('void main() {', `${ACES}\nvoid main() {`)
          .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = expAces( gl_FragColor.rgb );');
      };
      m.customProgramCacheKey = () => 'experience-aces';
      return m;
    };
    // the world's gradient all round, a dark floor, two softbox strips and a soft sweep panel:
    // big flat faces need the sweep to read as polished metal while they turn
    const sweepTex = (() => {
      const c = document.createElement('canvas'); c.width = 8; c.height = 256;
      const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, '#fff'); grad.addColorStop(0.42, '#9a9a9a'); grad.addColorStop(0.6, '#2a2a2a'); grad.addColorStop(1, '#000');
      g.fillStyle = grad; g.fillRect(0, 0, 8, 256);
      const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    const studio = sky => {
      const st = new THREE.Scene();
      st.add(new THREE.Mesh(new THREE.SphereGeometry(20, 64, 32), new THREE.MeshBasicMaterial({ map: sky, side: THREE.BackSide })));
      const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 64), new THREE.MeshBasicMaterial({ color: 0x101c30, side: THREE.DoubleSide }));
      floor.rotation.x = -Math.PI / 2; floor.position.y = -7; st.add(floor);
      const panel = (w, h, el, az, rot, color, map) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, map, side: THREE.DoubleSide }));
        const e = THREE.MathUtils.degToRad(el), a = THREE.MathUtils.degToRad(az);
        m.position.set(Math.sin(a) * Math.cos(e) * 12, Math.sin(e) * 12, Math.cos(a) * Math.cos(e) * 12);
        m.lookAt(0, 0, 0); m.rotateZ(THREE.MathUtils.degToRad(rot)); st.add(m);
      };
      panel(7, 1.5, 35, -60, 0, new THREE.Color(4, 4, 4));
      panel(7, 1.5, 35, 60, 0, new THREE.Color(4, 4, 4));
      panel(6, 3, 10, -40, 28, new THREE.Color(0.8, 0.8, 0.8), sweepTex);
      const env = pmrem.fromScene(st, 0.02).texture;
      st.traverse(o => { o.geometry?.dispose(); if (o.material && o.material.map !== sweepTex) o.material.dispose(); });
      return env;
    };
    const textPlane = (tex, w, h) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    };

    const loaded = await Promise.all(worlds.map(async w => {
      const [sky, gltf, ycGltf, nameTex, r1Tex, r2Tex] = await Promise.all([
        texLoader.loadAsync(`/personal/experience/worlds/${w.slug}${layoutTag === 'mobile' ? '-mobile' : ''}.webp`),
        gltfLoader.loadAsync(`/personal/experience/3d/${w.slug}.glb`),
        w.yc ? gltfLoader.loadAsync(`/personal/experience/3d/yc-${w.yc}.glb`) : null,
        ...['name', 'r1', 'r2'].map(k => texLoader.loadAsync(`/personal/experience/text/${lang}/${w.slug}-${k}-${layoutTag}.webp`)),
      ]);
      sky.mapping = THREE.EquirectangularReflectionMapping;
      sky.colorSpace = THREE.SRGBColorSpace;
      const env = studio(sky);
      const scene = new THREE.Scene();
      scene.background = sky;
      const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
      camera.position.set(0, 0, 6);

      // the mark: the hero's material and its glass twin
      let mesh; gltf.scene.traverse(o => { if (o.isMesh) mesh = o; });
      mesh.geometry.computeBoundingBox();
      mesh.material = aces(new THREE.MeshStandardMaterial({ color: DARK[w.slug] ? 0x333333 : 0xffffff, metalness: 1, roughness: 0.24, envMap: env, envMapIntensity: 1.2 }));
      mesh.renderOrder = 1;
      const glassMat = new THREE.ShaderMaterial({
        vertexShader: GLASS_VERT, fragmentShader: GLASS_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: {
          uSurfaceOffset: { value: 5e-4 }, uTime: { value: 0 }, uOpacity: { value: 1 }, uSceneTexture: { value: null }, uHoverProgress: { value: 0 },
          uNoiseScale: { value: 2 }, uNoiseSpeed: { value: 0.1 }, uRevealEdge: { value: 0.1 }, uFresnelPower: { value: 1.2 },
          uDistortionStrength: { value: 0.025 }, uChromaticAberration: { value: 0.0045 },
          uClickProgress: { value: 0 }, uClickPosition: { value: new THREE.Vector3() }, uClickTime: { value: 0 }, uClickRadius: { value: 1.2 },
          uClickWaveFrequency: { value: 20 }, uClickWaveSpeed: { value: 7 }, uClickRippleStrength: { value: 0.02 }, uClickGlowStrength: { value: 0.5 }, uClickRippleNoise: { value: 0.05 },
        },
      });
      const glass = new THREE.Mesh(mesh.geometry, glassMat);
      glass.renderOrder = 2; glass.visible = false;
      const group = new THREE.Group(), spin = new THREE.Group();
      group.add(spin); spin.add(mesh); spin.add(glass); scene.add(group);
      const size = mesh.geometry.boundingBox.getSize(new THREE.Vector3());
      const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, Math.max(size.z, 0.3)), new THREE.MeshBasicMaterial({ visible: false }));
      spin.add(hit);
      spin.rotateOnAxis(AXIS, worlds.indexOf(w) * 1.1 - 0.6);

      // the text layers, placed like the hero's name and role planes
      const namePlane = textPlane(nameTex, 11, 2.8); namePlane.position.z = -2.5; scene.add(namePlane);
      const r1 = textPlane(r1Tex, 5.5 * 0.85, 1.4 * 0.85), r2 = textPlane(r2Tex, 5.5 * 0.6, 1.4 * 0.6);
      // mirrored orbits keep the role words lower left and upper right on screen
      r1.position.set(1 * w.dir, 5.25, -1.75 * w.dir); r1.rotation.y = -Math.PI / 2 * w.dir;
      r2.position.set(-1 * w.dir, 6.5, 1.25 * w.dir); r2.rotation.y = -Math.PI / 2 * w.dir;
      r1.material.opacity = r2.material.opacity = 0;
      scene.add(r1, r2);

      let yc = null;
      if (ycGltf) {
        yc = ycGltf.scene;
        yc.traverse(m => {
          if (!m.isMesh) return;
          m.material = aces(m.material.name === 'yc_tile'
            ? new THREE.MeshPhysicalMaterial({ color: 0xf26522, emissive: 0xf26522, emissiveIntensity: 0.62, metalness: 0, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.28, envMap: env, envMapIntensity: 0.55 })
            : new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.3, envMap: env, envMapIntensity: 1.2 }));
        });
        group.add(yc);
      }
      return {
        ...w, scene, camera, mesh, glass, glassMat, group, spin, hit, size, namePlane, r1, r2, yc,
        r1z: r1.position.z, r2z: r2.position.z, hover: 0, click: 0, impulse: 0,
      };
    }));
    pmrem.dispose();

    // render targets: one per visible world, plus the scene-behind-the-glass pass
    const rtOpts = { type: THREE.HalfFloatType, samples: coarse ? 0 : 4 };
    const rtA = new THREE.WebGLRenderTarget(1, 1, rtOpts), rtB = new THREE.WebGLRenderTarget(1, 1, rtOpts);
    const rtScene = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    loaded.forEach(w => { w.glassMat.uniforms.uSceneTexture.value = rtScene.texture; });

    // composite: two worlds at a time, the incoming one rising in behind a grainy edge
    const comp = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      depthTest: false, depthWrite: false, toneMapped: false,
      uniforms: { tA: { value: rtA.texture }, tB: { value: rtB.texture }, uF: { value: 0 }, uAmp: { value: 0 }, uTime: { value: 0 }, uSlide: { value: reduced ? 0 : 1 } },
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      fragmentShader: /* glsl */`
        uniform sampler2D tA, tB; uniform float uF, uAmp, uTime, uSlide; varying vec2 vUv;
        float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
        float noise(vec3 p) {
          vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        // grain needs a hash with no lattice: the 1/pi hash above repeats about every 355px
        float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
        void main() {
          float g = hash12(gl_FragCoord.xy + floor(uTime * 24.0) * vec2(37.0, 17.0));
          vec3 col;
          if (uF <= 0.0) col = texture2D(tA, vUv).rgb;
          else {
            float n = (noise(vec3(vUv.x * 3.2, uTime * 0.04, 5.0)) - 0.5 + (g - 0.5) * 0.22) * uAmp;
            float seam = mix(uF, 0.5, 1.0 - uSlide);
            float above = mix(smoothstep(seam - 0.008, seam + 0.008, vUv.y + n), 1.0 - smoothstep(0.44, 0.56, uF), 1.0 - uSlide);
            vec3 a = texture2D(tA, vec2(vUv.x, vUv.y - uF * uSlide)).rgb;          // the outgoing world slides up
            vec3 b = texture2D(tB, vec2(vUv.x, vUv.y + (1.0 - uF) * uSlide)).rgb;  // the next one rises in
            col = mix(b, a, above);
          }
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
          gl_FragColor.rgb += (g - 0.5) * 0.04;                                   // grain, like the site's gradients
        }`,
    }));
    comp.frustumCulled = false;
    const compScene = new THREE.Scene(); compScene.add(comp);
    const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    let vw6 = 1, vh6 = 1, portrait = false;
    function resize() {
      const w = frame.clientWidth, h = frame.clientHeight;
      H = h;
      renderer.setSize(w, h, false);
      for (const rt of [rtA, rtB, rtScene]) rt.setSize(Math.round(w * dpr), Math.round(h * dpr));
      const aspect = w / h;
      portrait = aspect < 0.85;
      const fov = THREE.MathUtils.degToRad(35);
      vh6 = 2 * 6 * Math.tan(fov / 2); vw6 = vh6 * aspect;
      const vh85 = 2 * 8.5 * Math.tan(fov / 2), vw85 = vh85 * aspect;
      const roleScale = portrait ? 0.4 : Math.min(1, aspect / 1.6);
      for (const o of loaded) {
        o.camera.aspect = aspect; o.camera.updateProjectionMatrix();
        // marks of equal visual weight (the wide Blaze mark would otherwise swamp its role words),
        // kept inside the hero's 90%-of-the-short-side fit; the name fits 80% of the view
        const k = Math.min(portrait ? 0.66 : 1.25, Math.sqrt(1.0 / (o.size.x * o.size.y)), (Math.min(vw6, vh6) * 0.9) / o.size.length() * 1.15, portrait ? 0.55 * vw6 / o.size.x : 9);
        o.spin.scale.setScalar(k);
        o.half = [o.size.x * k / 2, o.size.y * k / 2];
        o.namePlane.scale.setScalar(Math.min(1, vw85 * (portrait ? 0.92 : 0.8) / (11 * 0.548), vh85 * 0.8 / (2.8 * 0.81)));
        o.r1.scale.setScalar(roleScale); o.r2.scale.setScalar(roleScale);
        if (portrait) {
          // a phone can't hold the words left and right of the mark: stack them, one above
          // the raised mark and one below it, clear of the caption
          o.r1.position.set(1 * o.dir, 6.26, 0); o.r2.position.set(-1 * o.dir, 7.29, 0);   // top phrase, mark, lower phrase, then the caption
        } else {
          o.r1.position.set(1 * o.dir, 5.25, o.r1z * roleScale); o.r2.position.set(-1 * o.dir, 6.5, o.r2z * roleScale);
        }
        if (o.yc) {
          const tile = vh6 * (aspect < 1 ? 0.075 : 0.09);
          o.yc.scale.setScalar(tile);
          const [ax, ay] = YC_AT[o.slug] || [1, 0.5];
          if (portrait) o.yc.position.set(Math.min(o.half[0] + tile * 0.45, vw6 / 2 - tile * 0.75), o.half[1] * 0.7, 0.35);
          else o.yc.position.set(Math.min(ax * o.half[0] + tile * 0.75, vw6 / 2 - tile * 0.7), ay * o.half[1], 0.35);
        }
      }
    }
    new ResizeObserver(resize).observe(frame);
    resize();

    // hover and click, like the hero: glass on hover, a ripple where you click
    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
    let hasPtr = false, current = null;
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      ptr.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
      hasPtr = e.pointerType === 'mouse';
    });
    canvas.addEventListener('pointerleave', () => { hasPtr = false; });
    canvas.addEventListener('click', () => {
      if (!current || current.hover < 0.75) return;
      ray.setFromCamera(ptr, current.camera);
      const hits = ray.intersectObject(current.hit);
      if (!hits.length) return;
      current.glassMat.uniforms.uClickPosition.value.copy(hits[0].point);
      current.glassMat.uniforms.uClickTime.value = performance.now() * 0.001;
      current.click = 1;
    });

    function step(o, q, rise, dt, now, isCurrent) {
      const t = -o.dir * q * Math.PI / 2, y = q * 6;
      o.camera.position.set(Math.sin(t) * 6, y, Math.cos(t) * 6);
      o.camera.lookAt(0, y, 0);
      o.group.position.y = y + (portrait ? 0.85 * q : 0) - (1 - rise) * 1.6;   // rises in under the title; on a phone it lifts to make room
      o.namePlane.material.opacity = (1 - sstep(q, 0.2, 0.4)) * sstep(rise, 0.35, 1);
      o.namePlane.visible = o.namePlane.material.opacity > 0.001;
      const roles = sstep(q, 0.72, 0.9);
      o.r1.material.opacity = o.r2.material.opacity = roles;
      o.r1.visible = o.r2.visible = roles > 0.001;
      o.impulse = reduced ? 0 : Math.max(damp(o.impulse, 0, 1.5, dt), clamp(Math.abs(velocity) / 2000, 0, 1) * 2.5);
      if (!reduced) o.spin.rotateOnAxis(AXIS, dt * (0.2 + o.impulse));
      if (o.yc) o.yc.rotation.set(0.05, t - 0.22, 0.04);           // keeps facing the camera as it orbits
      let over = 0;
      if (isCurrent && hasPtr && !coarse) { ray.setFromCamera(ptr, o.camera); over = ray.intersectObject(o.hit).length > 0 ? 1 : 0; }
      o.hover = damp(o.hover, over, 4.5, dt);
      o.click = damp(o.click, 0, 3.5, dt);
      const g = o.glassMat.uniforms;
      g.uTime.value = now * 0.001; g.uHoverProgress.value = o.hover; g.uClickProgress.value = o.click;
      return over;
    }
    function draw(o, target) {
      if (o.hover > 0.002) {
        o.mesh.visible = false; o.glass.visible = false;
        renderer.setRenderTarget(rtScene); renderer.render(o.scene, o.camera);
        o.mesh.visible = true; o.glass.visible = true;
      } else o.glass.visible = false;
      renderer.setRenderTarget(target); renderer.render(o.scene, o.camera);
    }

    // compile every world and draw each once off screen, so textures are on the GPU before the
    // first hand-off (otherwise the first rise stutters while they upload)
    for (const o of loaded) { await renderer.compileAsync(o.scene, o.camera); o.namePlane.visible = o.r1.visible = o.r2.visible = true; draw(o, rtB); }
    renderer.setRenderTarget(null);
    section.classList.add('is-ready');

    return {
      frame(dt, now) {
        const sc = Math.max(0, s);
        const a = Math.min(N - 1, Math.floor(sc)), f = sc - a;
        const handing = f > 0.0005 && f < 0.9995 && a + 1 < N;
        const A = loaded[f >= 0.9995 ? Math.min(N - 1, a + 1) : a];
        const rise = s < 0 ? sstep(s, -0.85, 0) : 1;
        current = handing ? null : A;
        const over = step(A, orbitOf(loaded.indexOf(A)), loaded.indexOf(A) === 0 ? rise : 1, dt, now, !handing);
        section.classList.toggle('is-hovering', !!over && !handing);
        draw(A, rtA);
        const u = comp.material.uniforms;
        u.uTime.value = now * 0.001;
        if (handing) {
          const B = loaded[a + 1];
          step(B, orbitOf(a + 1), 1, dt, now, false);
          draw(B, rtB);
          u.uF.value = f;
          u.uAmp.value = 0.09 * smooth(clamp(Math.min(f, 1 - f) / 0.14, 0, 1));
        } else u.uF.value = 0;
        renderer.setRenderTarget(null);
        renderer.render(compScene, compCam);
      },
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
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  }).observe(section);
  addEventListener('resize', () => { H = frame.clientHeight; });
  measure(1 / 60); layout();
}

if (section) init();
