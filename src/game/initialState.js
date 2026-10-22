import { buildDeck } from './cards.js'
import { makeUnit } from './rules.js'
import { generateTerrain } from './terrain.js'

export function createInitialState() {
  const units = [
    makeUnit('p1-hero', 1, 'Warlord', 2, 3, 9, 5, 0, true),
    makeUnit('p2-hero', 2, 'Archmage', 2, 3, 9, 0, 0, true),
  ]

  const decks = { 1: buildDeck(), 2: buildDeck() }
  const deck1 = decks[1]
  const openingHand = deck1.slice(0, 3)
  decks[1] = deck1.slice(3)

  return {
    gameId: Date.now(), // changes on restart so the board can replay its intro
    lastEvent: null, // most recent attack / breakthrough, read by the board to play effects
    units,
    terrain: generateTerrain(), // impassable rock tiles, rolled fresh each game
    life: { 1: 20, 2: 20 },
    phase: 'deploy', // 'deploy' | 'battle'
    deployingPlayer: 1,
    deployPlaced: 0,
    decks,
    openingHand,
    selectedHandIndex: null,
    pendingCard: null,
    deployedCount: { 1: 0, 2: 0 },
    hasDeployedThisTurn: false,
    deployCounter: 0,
    currentPlayer: 1,
    selectedId: null,
    activatedId: null, // i-go-you-go: the one unit that has acted this turn
    activatedName: '',
    gameOver: false,
    winText: '',
    message: 'Player 1: tap a unit below, then tap a tile in your zone to deploy it.',
  }
}
