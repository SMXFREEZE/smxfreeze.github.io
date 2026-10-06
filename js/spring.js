// Apple-style spring: tuned with damping ratio + response (seconds), not mass/stiffness.
// Always animates from the current (presentation) value and keeps velocity on re-target,
// so every motion can be grabbed and redirected mid-flight.
export class Spring {
  constructor(value = 0, { damping = 1, response = 0.4 } = {}) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
    this.configure({ damping, response });
  }

  configure({ damping = this.damping, response = this.response } = {}) {
    this.damping = damping;
    this.response = response;
    this.stiffness = Math.pow((2 * Math.PI) / response, 2);
    this.friction = (4 * Math.PI * damping) / response;
    return this;
  }

  set(value) {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  step(dt) {
    // Fixed sub-steps keep stiff springs stable on slow frames.
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      const force = -this.stiffness * (this.value - this.target) - this.friction * this.velocity;
      this.velocity += force * h;
      this.value += this.velocity * h;
    }
    return this.value;
  }

  get settled() {
    return Math.abs(this.value - this.target) < 1e-3 && Math.abs(this.velocity) < 1e-3;
  }
}

// Where a flick would come to rest under scroll-like deceleration (Designing Fluid Interfaces).
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

export function rubberband(overshoot, dimension, constant = 0.55) {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

// Short pointer history for release velocity (units per second).
export class VelocityTracker {
  constructor() { this.samples = []; }
  reset() { this.samples.length = 0; }
  add(x, y, t = performance.now()) {
    this.samples.push({ x, y, t });
    while (this.samples.length > 2 && t - this.samples[0].t > 100) this.samples.shift();
  }
  get() {
    const s = this.samples;
    if (s.length < 2) return { x: 0, y: 0 };
    const a = s[0];
    const b = s[s.length - 1];
    const dt = Math.max(1, b.t - a.t) / 1000;
    return { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt };
  }
}

export const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
