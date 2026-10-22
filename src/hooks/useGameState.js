import { useState } from 'react'
import { ROWS, HOME_ROWS, MAX_UNITS, DRAW_ROUNDS } from '../game/constants.js'
import { makeUnit, unitAt, bfsReachable, attackableTargets, refreshUnits, shotBlockedByTerrain } from '../game/rules.js'
import { isTerrain } from '../game/terrain.js'
import { createInitialState } from '../game/initialState.js'
import { countHits } from '../game/dice.js'

// How long a destroyed unit stays on the board so its death animation can finish.
// Keep in sync with the .unit.dying animation (delay + duration) in UnitChip.css.
const DEATH_CLEANUP_MS = 940

export function useGameState() {
  const [state, setState] = useState(createInitialState)
  // Starts false so the celebration overlay shows the instant a game is won; "View board" flips it.
  const [winOverlayDismissed, setWinOverlayDismissed] = useState(false)
  const {
    units, terrain, life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    openingHand, selectedHandIndex,
    deployedCount, hasDeployedThisTurn, deployCounter, currentPlayer, round,
    selectedId, inspectId, gameOver, winText, message, gameId, lastEvent, activatedId, activatedName,
    roll, resolving,
  } = state

  // I-go-you-go: a player activates one unit per turn. Until they move or attack,
  // any of their units may act; after that, only the activated one can.
  const canAct = (unit) => !activatedId || unit.id === activatedId
  const lockedMessage = () =>
    `You've activated ${activatedName} this turn — only it can act. End your turn to pass to the other side.`

  // ---- derived / computed values for rendering ----
  const selectedUnit = phase === 'battle' ? units.find((u) => u.id === selectedId) : null
  let reach = []
  let targets = []
  let blockedTargets = [] // in range, but terrain is in the way
  if (selectedUnit && selectedUnit.owner === currentPlayer && !pendingCard && canAct(selectedUnit)) {
    reach = bfsReachable(units, selectedUnit, terrain)
    targets = attackableTargets(units, selectedUnit, terrain)
    if (!selectedUnit.attacked) {
      blockedTargets = units.filter(
        (t) => t.owner !== selectedUnit.owner && shotBlockedByTerrain(selectedUnit, t, terrain),
      )
    }
  }
  const placingZoneRows =
    phase === 'deploy' ? HOME_ROWS[deployingPlayer] : pendingCard ? HOME_ROWS[currentPlayer] : []
  const canPlaceCard = phase === 'deploy' ? selectedHandIndex !== null : !!pendingCard

  const armyP1 = units.filter((u) => u.owner === 1 && !u.dying).length
  const armyP2 = units.filter((u) => u.owner === 2 && !u.dying).length
  // The unit whose stat card is open (it may have just died).
  const inspectUnit = units.find((u) => u.id === inspectId) || null

  const canDeploy =
    phase === 'battle' && !hasDeployedThisTurn && !pendingCard && deployedCount[currentPlayer] < MAX_UNITS &&
    round <= DRAW_ROUNDS
  // Draws this player still has, counting this turn's if it hasn't been used.
  const drawsLeft = Math.max(0, DRAW_ROUNDS - round + (hasDeployedThisTurn ? 0 : 1))

  // Units that can't act any more this turn because a different unit was activated.
  const lockedIds =
    phase === 'battle' && activatedId
      ? units.filter((u) => u.owner === currentPlayer && u.id !== activatedId).map((u) => u.id)
      : []
  // Nothing useful left to do: the activated unit can't move or attack any more (or is dead),
  // and no deploy is pending.
  const activatedUnit = units.find((u) => u.id === activatedId)
  const turnDone =
    phase === 'battle' && !gameOver && !resolving && !!activatedId && !pendingCard && !canDeploy &&
    (!activatedUnit ||
      (activatedUnit.move === 0 && attackableTargets(units, activatedUnit, terrain).length === 0))

  // ---- actions ----
  function resetGame() {
    setState(createInitialState())
    setWinOverlayDismissed(false)
  }

  function dismissWinOverlay() {
    setWinOverlayDismissed(true)
  }

  function selectHandCard(index) {
    if (phase !== 'deploy') return
    setState({ ...state, selectedHandIndex: index })
  }

  function endTurn() {
    if (pendingCard || resolving) return
    const nextPlayer = currentPlayer === 1 ? 2 : 1
    const nextRound = nextPlayer === 1 ? round + 1 : round
    let msg = `Player ${nextPlayer}'s turn. Activate one unit.`
    if (nextRound === DRAW_ROUNDS && nextPlayer === 1) msg = `Round ${nextRound} — the last round to draw reinforcements.`
    if (nextRound === DRAW_ROUNDS + 1 && nextPlayer === 1) msg = 'Reinforcements are over. Fight it out with what you have!'
    setState({
      ...state,
      units: refreshUnits(units, nextPlayer),
      inspectId: null,
      currentPlayer: nextPlayer,
      round: nextRound,
      selectedId: null,
      activatedId: null,
      activatedName: '',
      hasDeployedThisTurn: false,
      message: msg,
    })
  }

  function drawForBattle() {
    if (!canDeploy || resolving) return
    const deck = decks[currentPlayer].slice()
    const card = deck.shift()
    if (!card) {
      setState({ ...state, message: 'Your deck is empty — no more units to deploy.' })
      return
    }
    setState({
      ...state,
      decks: { ...decks, [currentPlayer]: deck },
      pendingCard: card,
      message: `Drew ${card.name} — tap an empty tile in your zone to deploy it.`,
    })
  }

  function deployDuringSetup(row, col) {
    const card = openingHand[selectedHandIndex]
    const newCounter = deployCounter + 1
    const newUnit = makeUnit(`p${deployingPlayer}-${card.key}-${newCounter}`, deployingPlayer, card, row, col)
    let newUnits = [...units, newUnit]
    const remainingHand = openingHand.filter((_, i) => i !== selectedHandIndex)
    let newDeployPlaced = deployPlaced + 1
    const newDeployedCount = {
      ...deployedCount,
      [deployingPlayer]: deployedCount[deployingPlayer] + 1,
    }
    let newDeployingPlayer = deployingPlayer
    let newPhase = phase
    let newDecks = decks
    let newOpeningHand = remainingHand
    let newMessage = message
    let newCurrentPlayer = currentPlayer

    if (newDeployPlaced === 3) {
      if (deployingPlayer === 1) {
        newDeployingPlayer = 2
        newDeployPlaced = 0
        const deck2 = decks[2]
        newOpeningHand = deck2.slice(0, 3)
        newDecks = { ...decks, 2: deck2.slice(3) }
        newMessage = 'Player 2: tap a unit below, then tap a tile in your zone to deploy it.'
      } else {
        newPhase = 'battle'
        newCurrentPlayer = 1
        newUnits = refreshUnits(newUnits, 1)
        newOpeningHand = []
        newMessage = "Battle begins! Player 1's turn — activate one unit."
      }
    }

    setState({
      ...state,
      units: newUnits,
      deployPlaced: newDeployPlaced,
      deployingPlayer: newDeployingPlayer,
      phase: newPhase,
      decks: newDecks,
      openingHand: newOpeningHand,
      selectedHandIndex: null,
      deployedCount: newDeployedCount,
      deployCounter: newCounter,
      currentPlayer: newCurrentPlayer,
      message: newMessage,
    })
  }

  function deployDuringBattle(row, col) {
    const validSpot =
      HOME_ROWS[currentPlayer].includes(row) && !unitAt(units, row, col) && !isTerrain(terrain, row, col)
    if (!validSpot) {
      setState({ ...state, message: `Place ${pendingCard.name} on an empty tile in your zone first.` })
      return
    }
    const card = pendingCard
    const newCounter = deployCounter + 1
    const newUnit = {
      ...makeUnit(`p${currentPlayer}-${card.key}-${newCounter}`, currentPlayer, card, row, col),
      move: 0,
      attacked: true,
      sick: true,
    }
    const newCount = deployedCount[currentPlayer] + 1
    setState({
      ...state,
      units: [...units, newUnit],
      deployCounter: newCounter,
      deployedCount: { ...deployedCount, [currentPlayer]: newCount },
      hasDeployedThisTurn: true,
      pendingCard: null,
      message: `${card.name} deployed with summoning sickness (no actions this turn). ${newCount}/${MAX_UNITS} units placed.`,
    })
  }

  function performMove(unit, row, col, cost) {
    let newUnits = units.map((u) =>
      u.id === unit.id ? { ...u, row, col, move: u.move - cost } : u,
    )
    let newLife = life
    let msg = message
    let event = lastEvent
    const enemyBackRow = unit.owner === 1 ? 0 : ROWS - 1
    if (!unit.isHero && !unit.breached && row === enemyBackRow) {
      newUnits = newUnits.map((u) => (u.id === unit.id ? { ...u, breached: true } : u))
      const enemy = unit.owner === 1 ? 2 : 1
      newLife = { ...life, [enemy]: Math.max(0, life[enemy] - 4) }
      msg = `${unit.name} broke through! ${
        enemy === 1 ? "Warlord's" : "Archmage's"
      } side takes 4 damage. (Life is a pressure score — only defeating the hero wins.)`
      event = { id: Math.random(), type: 'breach', unitId: unit.id, row, col, dmg: 4, distance: cost }
    }
    if (msg === message) msg = `${unit.name} moved. It's your activated unit this turn.`
    setState({
      ...state,
      units: newUnits,
      life: newLife,
      message: msg,
      lastEvent: event,
      activatedId: unit.id,
      activatedName: unit.name,
    })
  }

  // Attacking is a dice roll, like a tabletop wargame: the attacker rolls one d6 per
  // attack, and each die that shows its hit value or higher deals 1 damage.
  // The roll is put on screen first (see DiceTray); resolveRoll applies the result.
  function performAttack(attacker, defender) {
    setState({
      ...state,
      units: units.map((u) => (u.id === attacker.id ? { ...u, attacked: true } : u)),
      inspectId: null,
      activatedId: attacker.id,
      activatedName: attacker.name,
      resolving: true,
      roll: makeRoll('attack', attacker, defender),
      message: `${attacker.name}${attacker.ranged ? ' shoots ' : ' attacks '}${defender.name}: rolling ${
        attacker.attacks
      } ${attacker.attacks === 1 ? 'die' : 'dice'} — every ${attacker.hit}+ is a hit.`,
    })
  }

  // Called by the dice tray once the dice have settled and the result has been shown.
  function resolveRoll(values) {
    setState((prev) => applyRoll(prev, values))
    // Let the lunge, hit and death animations play out (see DEATH_CLEANUP_MS), then
    // remove destroyed units, check for a winner and start any strike-back roll.
    setTimeout(() => setState(afterBlow), DEATH_CLEANUP_MS)
  }

  // Every board tap does its normal job, then decides which unit's stat card is open:
  // tapping any unit (yours or the enemy's) shows its card; tapping away closes it.
  function handleCellTap(row, col) {
    if (gameOver || resolving) return
    const clicked = unitAt(units, row, col)
    playTap(row, col)
    setState((prev) => {
      if (prev.resolving) return prev // an attack started; the dice take over the screen
      let inspect = null
      if (clicked) {
        const deselectedOwn =
          prev.phase === 'battle' && clicked.owner === prev.currentPlayer && prev.selectedId !== clicked.id
        inspect = deselectedOwn ? null : clicked.id
      } else if (prev.selectedId && prev.selectedId === prev.inspectId) {
        inspect = prev.inspectId // the inspected unit just moved: keep its card open
      }
      return prev.inspectId === inspect ? prev : { ...prev, inspectId: inspect }
    })
  }

  function closeInspect() {
    setState((prev) => ({ ...prev, inspectId: null }))
  }

  function playTap(row, col) {

    if (phase === 'deploy') {
      if (selectedHandIndex === null) return
      if (!HOME_ROWS[deployingPlayer].includes(row) || unitAt(units, row, col) || isTerrain(terrain, row, col)) return
      deployDuringSetup(row, col)
      return
    }

    if (phase === 'battle' && pendingCard) {
      deployDuringBattle(row, col)
      return
    }

    const clicked = unitAt(units, row, col)
    const selected = units.find((u) => u.id === selectedId)

    // A locked unit can still be selected to look at, but tapping a tile or enemy
    // with it just explains the rule.
    if (selected && selected.owner === currentPlayer && !canAct(selected)) {
      if (clicked && clicked.owner === currentPlayer) {
        setState({ ...state, selectedId: clicked.id === selected.id ? null : clicked.id })
        return
      }
      setState({ ...state, message: lockedMessage() })
      return
    }

    if (selected && selected.owner === currentPlayer) {
      if (clicked) {
        if (clicked.id === selected.id) {
          setState({ ...state, selectedId: null })
          return
        }
        if (clicked.owner !== currentPlayer) {
          const currentTargets = attackableTargets(units, selected, terrain)
          if (currentTargets.some((t) => t.id === clicked.id)) {
            performAttack(selected, clicked)
            return
          }
          let msg = `${selected.name} is out of range to attack ${clicked.name}.`
          if (selected.sick) msg = `${selected.name} just arrived and can't act until next turn.`
          else if (selected.attacked) msg = `${selected.name} has already attacked this turn.`
          else if (shotBlockedByTerrain(selected, clicked, terrain))
            msg = `Terrain blocks ${selected.name}'s line of sight to ${clicked.name}.`
          setState({ ...state, message: msg })
          return
        }
        setState({
          ...state,
          selectedId: clicked.id,
          message: canAct(clicked) ? message : lockedMessage(),
        })
        return
      } else {
        const currentReach = bfsReachable(units, selected, terrain)
        const spot = currentReach.find((r) => r.row === row && r.col === col)
        if (spot) {
          performMove(selected, row, col, spot.cost)
          return
        }
        if (isTerrain(terrain, row, col)) {
          setState({ ...state, message: 'Rocks and forests are impassable — units have to go around them.' })
          return
        }
        setState({ ...state, message: `${selected.name} can't move that far (${selected.move} ${selected.move === 1 ? 'square' : 'squares'} left).` })
        return
      }
    }

    if (clicked && clicked.owner === currentPlayer) {
      setState({
        ...state,
        selectedId: clicked.id,
        message: canAct(clicked) ? message : lockedMessage(),
      })
      return
    }
    setState({ ...state, selectedId: null })
  }

  return {
    units, terrain, life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    openingHand, selectedHandIndex,
    currentPlayer, selectedId, gameOver, winText, message,
    reach, targets, blockedTargets, placingZoneRows, canPlaceCard, armyP1, armyP2, canDeploy, inspectUnit,
    winOverlayDismissed, gameId, lastEvent, round, drawsLeft, activatedId, activatedName, lockedIds, turnDone,
    roll, resolving,
    handleCellTap, drawForBattle, endTurn, resetGame, dismissWinOverlay, selectHandCard, resolveRoll, closeInspect,
  }
}

// ---- dice combat helpers (pure: they take a state and return the next one) ----

function makeRoll(kind, attacker, defender) {
  return {
    id: Math.random(),
    kind, // 'attack' | 'strikeback'
    attackerId: attacker.id,
    attackerName: attacker.name,
    defenderId: defender.id,
    defenderName: defender.name,
    owner: attacker.owner,
    ranged: kind === 'attack' && attacker.ranged,
    dice: attacker.attacks,
    hit: attacker.hit,
  }
}

function applyRoll(prev, values) {
  const roll = prev.roll
  if (!roll) return prev
  const attacker = prev.units.find((u) => u.id === roll.attackerId)
  const defender = prev.units.find((u) => u.id === roll.defenderId)
  if (!attacker || !defender) return { ...prev, roll: null, resolving: false }

  const hits = countHits(values, roll.hit)
  const newHp = defender.hp - hits
  const dies = newHp <= 0
  const units = prev.units.map((u) => {
    if (u.id === attacker.id) return { ...u, _justAttacked: true }
    if (u.id === defender.id) return { ...u, hp: newHp, _justHit: hits > 0, dying: dies }
    return u
  })

  // Melee attacks get struck back if the defender lives through it. Ranged ones never do.
  const strikesBack = roll.kind === 'attack' && !roll.ranged && !dies && defender.attacks > 0
  let message
  if (hits === 0) message = `${roll.attackerName} missed everything!`
  else if (dies) message = `${hits} ${hits === 1 ? 'hit' : 'hits'} — ${roll.defenderName} is destroyed!`
  else message = `${hits} ${hits === 1 ? 'hit' : 'hits'} — ${roll.defenderName} takes ${hits} damage.`
  if (strikesBack) message += ` ${roll.defenderName} strikes back…`

  return {
    ...prev,
    units,
    roll: null,
    queuedRoll: strikesBack ? makeRoll('strikeback', defender, attacker) : null,
    message,
    // Everything the board needs to choreograph the clash (lunge, projectile, numbers, shake).
    lastEvent: {
      id: Math.random(),
      type: 'attack',
      attackerId: attacker.id,
      defenderId: defender.id,
      from: { row: attacker.row, col: attacker.col },
      to: { row: defender.row, col: defender.col },
      ranged: roll.ranged,
      dmg: hits,
      retaliation: 0,
      attackerDies: false,
      defenderDies: dies,
    },
  }
}

function afterBlow(prev) {
  const survivors = prev.units.filter((u) => !u.dying)
  const cleaned = survivors.map((u) => ({ ...u, _justAttacked: false, _justHit: false }))
  let gameOver = prev.gameOver
  let winText = prev.winText
  if (!cleaned.some((u) => u.id === 'p1-hero')) {
    gameOver = true
    winText = 'Player 2 wins! The Warlord was defeated.'
  } else if (!cleaned.some((u) => u.id === 'p2-hero')) {
    gameOver = true
    winText = 'Player 1 wins! The Archmage was defeated.'
  }
  const next = prev.queuedRoll && !gameOver ? prev.queuedRoll : null
  return {
    ...prev,
    units: cleaned,
    selectedId: cleaned.some((u) => u.id === prev.selectedId) ? prev.selectedId : null,
    gameOver,
    winText,
    roll: next,
    queuedRoll: null,
    resolving: !!next,
    message: next
      ? `${next.attackerName} strikes back: rolling ${next.dice} ${next.dice === 1 ? 'die' : 'dice'} — every ${next.hit}+ is a hit.`
      : prev.message,
  }
}
