// Shared helpers for the game's "juice": timings, easing and tiny effects.
// Components use these with the Web Animations API (element.animate) for
// one-shot, interruptible effects that CSS classes handle poorly.

// Web Animations can't read CSS variables for easing, so mirror the curves here.
export const EASE = {
  snappy:
    'linear(0, 0.142, 0.435, 0.731, 0.953, 1.079, 1.125, 1.116, 1.082, 1.043, 1.012, 0.993, 0.985, 0.985, 0.988, 0.993, 0.998, 1)',
  bouncy:
    'linear(0, 0.13, 0.432, 0.776, 1.065, 1.246, 1.309, 1.276, 1.186, 1.079, 0.987, 0.928, 0.905, 0.913, 0.939, 0.972, 1.002, 1.021, 1.029, 1.028, 1.02, 1.01, 1, 0.994, 0.991, 0.991, 0.994, 0.997, 1)',
  jelly:
    'linear(0, 0.186, 0.614, 1.073, 1.392, 1.492, 1.393, 1.179, 0.955, 0.802, 0.758, 0.81, 0.917, 1.027, 1.099, 1.119, 1.091, 1.038, 0.985, 0.95, 0.942, 0.956, 0.982, 1.009, 1.025, 1.029, 1.021, 1.008, 0.995, 0.987, 0.986, 0.99, 0.996, 1.003, 1.006, 1.007, 1.005, 1.002, 1)',
}

const supportsLinear =
  typeof CSS !== 'undefined' && CSS.supports && CSS.supports('transition-timing-function', 'linear(0, 1)')
if (!supportsLinear) {
  EASE.snappy = 'cubic-bezier(0.34, 1.4, 0.64, 1)'
  EASE.bouncy = 'cubic-bezier(0.34, 1.8, 0.64, 1)'
  EASE.jelly = 'cubic-bezier(0.3, 2.2, 0.5, 1)'
}

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

// Safe wrapper: skips animation when the user asked for reduced motion.
export function animate(el, keyframes, options) {
  if (!el || !el.animate || reducedMotion()) return null
  return el.animate(keyframes, options)
}

// Little buzz on phones that support it (Android Chrome; iOS Safari ignores it).
export function buzz(pattern = 15) {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* not supported */
  }
}

// How long a unit takes to slide `distance` tiles. Longer moves take a bit longer,
// but stay snappy.
export function moveDuration(distance) {
  return 260 + 90 * Math.max(1, distance)
}
