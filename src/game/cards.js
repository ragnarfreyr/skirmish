// The full card pool both players draw from. `copies` controls how many of
// each card appear in a 20-card deck. Both players get an identical deck
// (just shuffled independently), which is what keeps the matchup fair while
// still being different every game.
// Each unit has separate stats for moving and fighting:
//   move    — squares it can move per turn (orthogonal, around terrain)
//   attacks — six-sided dice it rolls when it attacks (once per turn)
//   hit     — each die showing this or higher is a hit; each hit deals 1 damage
//   hp      — damage it can take
//   range   — ranged units only: how far it can shoot
// These are the base stats. Every game rolls fresh variations (see rollUnitStats),
// and both players get the same rolled stats, so the matchup stays fair.
export const UNIT_DEFS = [
  { key: 'skirmisher', name: 'Skirmisher', move: 3, attacks: 2, hit: 4, hp: 2, copies: 3 },
  { key: 'warden', name: 'Warden', move: 2, attacks: 3, hit: 4, hp: 3, copies: 3 },
  { key: 'javelineer', name: 'Javelineer', move: 2, attacks: 2, hit: 4, hp: 2, ranged: true, range: 3, copies: 3 },
  { key: 'duelist', name: 'Duelist', move: 2, attacks: 4, hit: 3, hp: 4, copies: 2 },
  { key: 'longbow', name: 'Longbow', move: 1, attacks: 3, hit: 3, hp: 3, ranged: true, range: 4, copies: 2 },
  { key: 'ironhide', name: 'Ironhide', move: 1, attacks: 5, hit: 4, hp: 6, copies: 2 },
  { key: 'falconer', name: 'Falconer', move: 2, attacks: 3, hit: 3, hp: 4, ranged: true, range: 4, copies: 2 },
  { key: 'ballista', name: 'Ballista', move: 1, attacks: 3, hit: 2, hp: 5, ranged: true, range: 5, copies: 2 },
  { key: 'colossus', name: 'Colossus', move: 1, attacks: 6, hit: 3, hp: 9, copies: 1 },
]

// The heroes. Rolled once per game and given to both sides, so they always mirror.
export const HERO_BASE = { key: 'hero', move: 2, attacks: 4, hit: 3, hp: 9 }
export const HERO_NAMES = { 1: 'Warlord', 2: 'Archmage' }

// How far each stat may drift, and which direction is "better".
const STAT_LIMITS = {
  move: { min: 1, max: 4, better: 1 },
  attacks: { min: 1, max: 7, better: 1 },
  hit: { min: 2, max: 5, better: -1 }, // a lower hit value is better
  hp: { min: 2, max: 10, better: 1 },
  range: { min: 2, max: 6, better: 1 },
}

// Trade-offs keep each unit about as strong as its base version: every swing
// makes one stat better and a different stat worse. Two swings per unit type.
function varyStats(def, swings = 2) {
  const out = { ...def }
  const keys = ['move', 'attacks', 'hit', 'hp', ...(def.ranged ? ['range'] : [])]
  const canShift = (k, dir) => {
    const lim = STAT_LIMITS[k]
    const next = out[k] + lim.better * dir
    return next >= lim.min && next <= lim.max
  }
  for (let n = 0; n < swings; n++) {
    const ups = keys.filter((k) => canShift(k, 1))
    const up = ups[Math.floor(Math.random() * ups.length)]
    const downs = keys.filter((k) => k !== up && canShift(k, -1))
    if (!up || !downs.length) continue
    const down = downs[Math.floor(Math.random() * downs.length)]
    out[up] += STAT_LIMITS[up].better
    out[down] -= STAT_LIMITS[down].better
  }
  return out
}

// Roll this game's stats for every unit type and the heroes. Called once per game.
export function rollUnitStats() {
  return {
    units: UNIT_DEFS.map((def) => varyStats(def)),
    hero: varyStats(HERO_BASE),
  }
}

// Builds a shuffled deck from this game's rolled unit stats.
export function buildDeck(defs = UNIT_DEFS) {
  const deck = []
  defs.forEach((def) => {
    for (let i = 0; i < def.copies; i++) {
      deck.push({
        uid: `${def.key}-${i}`, // stable identity so the UI can animate each card
        key: def.key,
        name: def.name,
        move: def.move,
        attacks: def.attacks,
        hit: def.hit,
        hp: def.hp,
        ranged: !!def.ranged,
        range: def.range ?? 0,
      })
    }
  })
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}
