// Event bus mínimo para coordenar o fim do preloader com o heroIntro,
// como no projeto ECQUA (o onComplete do preloader dispara a entrada do hero).

let done = false;
const listeners = new Set<() => void>();

export function markIntroReady() {
  if (done) return;
  done = true;
  listeners.forEach((l) => l());
  listeners.clear();
}

/** Executa cb quando o preloader terminar (ou já, se terminou). Retorna unsubscribe. */
export function onIntroReady(cb: () => void): () => void {
  if (done) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function isIntroReady() {
  return done;
}

export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
