// The full card pool both players draw from. `copies` controls how many of
// each card appear in a 20-card deck. Both players get an identical deck
// (just shuffled independently), which is what keeps the matchup fair while
// still being different every game.
// Combat works like a tabletop wargame: an attack rolls `attacks` six-sided dice,
// and every die showing `hit` or higher is a hit. Each hit deals 1 damage.
export const UNIT_DEFS = [
  { key: 'skirmisher', name: 'Skirmisher', mana: 1, attacks: 2, hit: 4, hp: 2, copies: 3 },
  { key: 'warden', name: 'Warden', mana: 2, attacks: 3, hit: 4, hp: 3, copies: 3 },
  { key: 'javelineer', name: 'Javelineer', mana: 2, attacks: 2, hit: 4, hp: 2, ranged: true, copies: 3 },
  { key: 'duelist', name: 'Duelist', mana: 3, attacks: 4, hit: 3, hp: 4, copies: 2 },
  { key: 'longbow', name: 'Longbow', mana: 3, attacks: 3, hit: 3, hp: 3, ranged: true, copies: 2 },
  { key: 'ironhide', name: 'Ironhide', mana: 4, attacks: 5, hit: 4, hp: 6, copies: 2 },
  { key: 'falconer', name: 'Falconer', mana: 4, attacks: 3, hit: 3, hp: 4, ranged: true, copies: 2 },
  { key: 'ballista', name: 'Ballista', mana: 5, attacks: 3, hit: 2, hp: 5, ranged: true, copies: 2 },
  { key: 'colossus', name: 'Colossus', mana: 6, attacks: 6, hit: 3, hp: 9, copies: 1 },
]

export function buildDeck() {
  const deck = []
  UNIT_DEFS.forEach((def) => {
    for (let i = 0; i < def.copies; i++) {
      deck.push({
        uid: `${def.key}-${i}`, // stable identity so the UI can animate each card
        key: def.key,
        name: def.name,
        mana: def.mana,
        attacks: def.attacks,
        hit: def.hit,
        hp: def.hp,
        ranged: !!def.ranged,
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

// The two heroes. Mirrored so neither side starts ahead.
export const HERO_DEFS = {
  1: { key: 'warlord', name: 'Warlord', mana: 2, attacks: 4, hit: 3, hp: 9 },
  2: { key: 'archmage', name: 'Archmage', mana: 2, attacks: 4, hit: 3, hp: 9 },
}
