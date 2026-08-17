import { useState } from 'react'
import { ROWS, HOME_ROWS, MAX_UNITS } from '../game/constants.js'
import { makeUnit, unitAt, bfsReachable, attackableTargets, refillMana } from '../game/rules.js'
import { createInitialState } from '../game/initialState.js'

export function useGameState() {
  const [state, setState] = useState(createInitialState)
  // Starts false so the celebration overlay shows the instant a game is won; "View board" flips it.
  const [winOverlayDismissed, setWinOverlayDismissed] = useState(false)
  const {
    units, life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    openingHand, selectedHandIndex,
    deployedCount, hasDeployedThisTurn, deployCounter, currentPlayer,
    selectedId, gameOver, winText, message,
  } = state

  // ---- derived / computed values for rendering ----
  const selectedUnit = phase === 'battle' ? units.find((u) => u.id === selectedId) : null
  let reach = []
  let targets = []
  if (selectedUnit && selectedUnit.owner === currentPlayer && !pendingCard) {
    reach = bfsReachable(units, selectedUnit)
    targets = attackableTargets(units, selectedUnit)
  }
  const placingZoneRows =
    phase === 'deploy' ? HOME_ROWS[deployingPlayer] : pendingCard ? HOME_ROWS[currentPlayer] : []
  const canPlaceCard = phase === 'deploy' ? selectedHandIndex !== null : !!pendingCard

  const manaP1 = units.filter((u) => u.owner === 1).reduce((s, u) => s + u.mana, 0)
  const manaP2 = units.filter((u) => u.owner === 2).reduce((s, u) => s + u.mana, 0)

  const canDeploy =
    phase === 'battle' && !hasDeployedThisTurn && !pendingCard && deployedCount[currentPlayer] < MAX_UNITS

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
    if (pendingCard) return
    const nextPlayer = currentPlayer === 1 ? 2 : 1
    setState({
      ...state,
      units: refillMana(units, nextPlayer),
      currentPlayer: nextPlayer,
      selectedId: null,
      hasDeployedThisTurn: false,
      message: `Player ${nextPlayer}'s turn. Mana refreshed.`,
    })
  }

  function drawForBattle() {
    if (!canDeploy) return
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
    const newUnit = makeUnit(
      `p${deployingPlayer}-${card.key}-${newCounter}`,
      deployingPlayer, card.name, card.mana, card.atk, card.hp, row, col, false, card.ranged,
    )
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
        newUnits = refillMana(newUnits, 1)
        newOpeningHand = []
        newMessage = "Battle begins! Player 1's turn."
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
    const validSpot = HOME_ROWS[currentPlayer].includes(row) && !unitAt(units, row, col)
    if (!validSpot) {
      setState({ ...state, message: `Place ${pendingCard.name} on an empty tile in your zone first.` })
      return
    }
    const card = pendingCard
    const newCounter = deployCounter + 1
    const newUnit = {
      ...makeUnit(
        `p${currentPlayer}-${card.key}-${newCounter}`,
        currentPlayer, card.name, card.mana, card.atk, card.hp, row, col, false, card.ranged,
      ),
      mana: 0,
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
      u.id === unit.id ? { ...u, row, col, mana: u.mana - cost } : u,
    )
    let newLife = life
    let msg = message
    const enemyBackRow = unit.owner === 1 ? 0 : ROWS - 1
    if (!unit.isHero && !unit.breached && row === enemyBackRow) {
      newUnits = newUnits.map((u) => (u.id === unit.id ? { ...u, breached: true } : u))
      const enemy = unit.owner === 1 ? 2 : 1
      newLife = { ...life, [enemy]: Math.max(0, life[enemy] - 4) }
      msg = `${unit.name} broke through! ${
        enemy === 1 ? "Warlord's" : "Archmage's"
      } side takes 4 damage. (Life is a pressure score — only defeating the hero wins.)`
    }
    setState({ ...state, units: newUnits, life: newLife, message: msg })
  }

  function performAttack(attacker, defender) {
    const newAttackerMana = attacker.mana - 1
    const newDefenderHp = defender.hp - attacker.atk
    const retaliates = !attacker.ranged && newDefenderHp > 0
    const newAttackerHp = retaliates ? attacker.hp - defender.atk : attacker.hp

    const attackerDying = newAttackerHp <= 0
    const defenderDying = newDefenderHp <= 0

    const newUnits = units.map((u) => {
      if (u.id === attacker.id) {
        return { ...u, mana: newAttackerMana, hp: newAttackerHp, _justAttacked: true, dying: attackerDying }
      }
      if (u.id === defender.id) {
        return { ...u, hp: newDefenderHp, _justHit: true, dying: defenderDying }
      }
      return u
    })

    setState({
      ...state,
      units: newUnits,
      message: `${attacker.name}${attacker.ranged ? ' shoots ' : ' attacks '}${defender.name}.`,
    })

    // Let the hit/dying animation play, then remove destroyed units and check for a winner.
    setTimeout(() => {
      setState((prev) => {
        const survivors = prev.units.filter((u) => !u.dying)
        const cleaned = survivors.map((u) => ({ ...u, _justAttacked: false, _justHit: false }))
        const p1Hero = cleaned.find((u) => u.id === 'p1-hero')
        const p2Hero = cleaned.find((u) => u.id === 'p2-hero')
        let gameOverNext = prev.gameOver
        let winTextNext = prev.winText
        if (!p1Hero) {
          gameOverNext = true
          winTextNext = 'Player 2 wins! The Warlord was defeated.'
        } else if (!p2Hero) {
          gameOverNext = true
          winTextNext = 'Player 1 wins! The Archmage was defeated.'
        }
        const stillSelected = cleaned.some((u) => u.id === prev.selectedId)
        return {
          ...prev,
          units: cleaned,
          selectedId: stillSelected ? prev.selectedId : null,
          gameOver: gameOverNext,
          winText: winTextNext,
        }
      })
    }, 500)
  }

  function handleCellTap(row, col) {
    if (gameOver) return

    if (phase === 'deploy') {
      if (selectedHandIndex === null) return
      if (!HOME_ROWS[deployingPlayer].includes(row) || unitAt(units, row, col)) return
      deployDuringSetup(row, col)
      return
    }

    if (phase === 'battle' && pendingCard) {
      deployDuringBattle(row, col)
      return
    }

    const clicked = unitAt(units, row, col)
    const selected = units.find((u) => u.id === selectedId)

    if (selected && selected.owner === currentPlayer) {
      if (clicked) {
        if (clicked.id === selected.id) {
          setState({ ...state, selectedId: null })
          return
        }
        if (clicked.owner !== currentPlayer) {
          const currentTargets = attackableTargets(units, selected)
          if (currentTargets.some((t) => t.id === clicked.id)) {
            performAttack(selected, clicked)
            return
          }
          const msg =
            selected.mana < 1
              ? `${selected.name} needs 1 mana to attack — none left this turn.`
              : `${selected.name} is out of range to attack ${clicked.name}.`
          setState({ ...state, message: msg })
          return
        }
        setState({ ...state, selectedId: clicked.id })
        return
      } else {
        const currentReach = bfsReachable(units, selected)
        const spot = currentReach.find((r) => r.row === row && r.col === col)
        if (spot) {
          performMove(selected, row, col, spot.cost)
          return
        }
        setState({ ...state, message: `Not enough mana for ${selected.name} to reach that tile.` })
        return
      }
    }

    if (clicked && clicked.owner === currentPlayer) {
      setState({ ...state, selectedId: clicked.id })
      return
    }
    setState({ ...state, selectedId: null })
  }

  return {
    units, life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    openingHand, selectedHandIndex,
    currentPlayer, selectedId, gameOver, winText, message,
    reach, targets, placingZoneRows, canPlaceCard, manaP1, manaP2, canDeploy,
    winOverlayDismissed,
    handleCellTap, drawForBattle, endTurn, resetGame, dismissWinOverlay, selectHandCard,
  }
}
