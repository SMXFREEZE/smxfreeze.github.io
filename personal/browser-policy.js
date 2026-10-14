// Instagram shares the page's graphics and input budget with its own app UI.
// Keep the normal browser presentation, but use lighter effects in that webview.
export const isInstagramBrowser = /Instagram/i.test(navigator.userAgent);
export const useReducedEffects = isInstagramBrowser || matchMedia('(prefers-reduced-motion: reduce)').matches;

if (isInstagramBrowser) document.documentElement.dataset.inAppBrowser = 'instagram';

// Transition state is optional. A restricted storage environment must never
// leave the page covered or scrolling stopped while navigation initializes.
export function readSession(key) {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function writeSession(key, value) {
  try { sessionStorage.setItem(key, value); } catch {}
}

export function removeSession(key) {
  try { sessionStorage.removeItem(key); } catch {}
}
