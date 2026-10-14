// Three.js r184: the copy the site's own bundle ships (assets/three.module-*.js), re-exported under
// its real names, so the Experience film shares one Three with the hero and the contact scene
// instead of downloading a second copy. The bundle's chunk is minified, so its exports are the
// one-letter names below; the mapping was read off the chunk (each class is identified by its
// own `isX` marker, the constants by their values) and the contact page uses the same names.
// The chunk has no VideoTexture (nothing in the bundle used one), so that class is written here
// exactly as three defines it.
export {
  m as Color,
  V as Mesh,
  lt as Scene,
  Z as OrthographicCamera,
  ut as ShaderMaterial,
  wt as WebGLRenderTarget,
  i as WebGLRenderer,
  $ as PlaneGeometry,
  _t as TextureLoader,
  bt as Vector2,
  gt as Texture,
  ct as SRGBColorSpace,
  M as LinearFilter,
} from '/assets/three.module-fBMLdKIM.js';
import { gt as Texture, M as LinearFilter } from '/assets/three.module-fBMLdKIM.js';

export const NoToneMapping = 0;
export const HalfFloatType = 1016;

export class VideoTexture extends Texture {
  constructor(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy) {
    super(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
    this.isVideoTexture = true;
    this.minFilter = minFilter !== undefined ? minFilter : LinearFilter;
    this.magFilter = magFilter !== undefined ? magFilter : LinearFilter;
    this.generateMipmaps = false;
    // One addition to three's class: an upload rate limit. A phone decodes a 60 fps clip in
    // hardware for next to nothing, but each new frame is also copied into the GPU texture, and
    // that copy is what costs; at 30 the copies halve and the clip still reads as motion.
    this.frameRateLimit = Infinity;
    this.lastUpload = -Infinity;
    const scope = this;
    function updateVideo(now) {
      if (now - scope.lastUpload >= 1000 / scope.frameRateLimit - 2) { scope.lastUpload = now; scope.needsUpdate = true; }
      video.requestVideoFrameCallback(updateVideo);
    }
    if ('requestVideoFrameCallback' in video) video.requestVideoFrameCallback(updateVideo);
  }
  clone() { return new this.constructor(this.image).copy(this); }
  // the renderer calls this once per frame before it samples the texture
  update() {
    const video = this.image;
    if ('requestVideoFrameCallback' in video || video.readyState < video.HAVE_CURRENT_DATA) return;
    const now = performance.now();
    if (now - this.lastUpload >= 1000 / this.frameRateLimit - 2) { this.lastUpload = now; this.needsUpdate = true; }
  }
}
