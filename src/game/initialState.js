import { buildDeck, rollUnitStats, HERO_NAMES } from './cards.js'
import { makeUnit } from './rules.js'
import { generateTerrain } from './terrain.js'

export function createInitialState() {
  // Fresh stats every game, shared by both sides so neither starts ahead.
  const stats = rollUnitStats()
  const units = [
    makeUnit('p1-hero', 1, { ...stats.hero, name: HERO_NAMES[1] }, 5, 0, true),
    makeUnit('p2-hero', 2, { ...stats.hero, name: HERO_NAMES[2] }, 0, 0, true),
  ]

  const decks = { 1: buildDeck(stats.units), 2: buildDeck(stats.units) }
  const deck1 = decks[1]
  const openingHand = deck1.slice(0, 3)
  decks[1] = deck1.slice(3)

  return {
    gameId: Date.now(), // changes on restart so the board can replay its intro
    lastEvent: null, // most recent attack / breakthrough, read by the board to play effects
    roll: null, // dice roll on screen right now: { id, kind, attackerId, defenderId, dice, hit, owner }
    queuedRoll: null, // a strike-back roll waiting for the first blow's animation to finish
    resolving: false, // true from the first roll until the last blow has landed
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
    round: 1, // battle round; ticks up each time play passes back to Player 1
    selectedId: null,
    inspectId: null, // unit whose stat card is showing
    activatedId: null, // i-go-you-go: the one unit that has acted this turn
    activatedName: '',
    gameOver: false,
    winText: '',
    message: 'Unit stats are rolled fresh this game — tap any unit on the board to see them. Player 1: deploy a unit.',
  }
}
