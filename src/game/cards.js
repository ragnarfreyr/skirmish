// The full card pool both players draw from. `copies` controls how many of
// each card appear in a 20-card deck. Both players get an identical deck
// (just shuffled independently), which is what keeps the matchup fair while
// still being different every game.
export const UNIT_DEFS = [
  { key: 'skirmisher', name: 'Skirmisher', mana: 1, atk: 1, hp: 2, copies: 3 },
  { key: 'warden', name: 'Warden', mana: 2, atk: 2, hp: 3, copies: 3 },
  { key: 'javelineer', name: 'Javelineer', mana: 2, atk: 1, hp: 2, ranged: true, copies: 3 },
  { key: 'duelist', name: 'Duelist', mana: 3, atk: 3, hp: 4, copies: 2 },
  { key: 'longbow', name: 'Longbow', mana: 3, atk: 2, hp: 3, ranged: true, copies: 2 },
  { key: 'ironhide', name: 'Ironhide', mana: 4, atk: 3, hp: 6, copies: 2 },
  { key: 'falconer', name: 'Falconer', mana: 4, atk: 2, hp: 4, ranged: true, copies: 2 },
  { key: 'ballista', name: 'Ballista', mana: 5, atk: 3, hp: 5, ranged: true, copies: 2 },
  { key: 'colossus', name: 'Colossus', mana: 6, atk: 5, hp: 9, copies: 1 },
]

export function buildDeck() {
  const deck = []
  UNIT_DEFS.forEach((def) => {
    for (let i = 0; i < def.copies; i++) {
      deck.push({
        key: def.key,
        name: def.name,
        mana: def.mana,
        atk: def.atk,
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
