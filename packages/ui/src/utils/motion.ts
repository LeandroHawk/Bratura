/** The visitor asked the system for less motion: skip animations and transitions, act at once. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
