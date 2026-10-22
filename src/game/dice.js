// Dice helpers. The 3D tray rolls the real dice; these only count and fall back.

export function countHits(values, hit) {
  return values.filter((v) => v >= hit).length
}

// Odds of a single d6 hitting on `hit`+ — shown next to the roll so players learn the maths.
export function hitChance(hit) {
  return Math.round(((7 - hit) / 6) * 100)
}

// Used if the 3D dice can't start (no WebGL, assets missing, a roll that never settles).
export function rollD6s(n) {
  return Array.from({ length: n }, () => 1 + Math.floor(Math.random() * 6))
}
