import { buildDeck } from './cards.js'
import { makeUnit } from './rules.js'

export function createInitialState() {
  const units = [
    makeUnit('p1-hero', 1, 'Warlord', 2, 3, 9, 5, 0, true),
    makeUnit('p2-hero', 2, 'Archmage', 2, 3, 9, 0, 0, true),
  ]

  const decks = { 1: buildDeck(), 2: buildDeck() }
  const deck1 = decks[1].slice()
  const pendingCard = deck1.shift()
  decks[1] = deck1

  return {
    units,
    life: { 1: 20, 2: 20 },
    phase: 'deploy', // 'deploy' | 'battle'
    deployingPlayer: 1,
    deployPlaced: 0,
    decks,
    pendingCard,
    deployedCount: { 1: 0, 2: 0 },
    hasDeployedThisTurn: false,
    deployCounter: 0,
    currentPlayer: 1,
    selectedId: null,
    gameOver: false,
    winText: '',
    message: 'Player 1: drawing your opening units.',
  }
}
