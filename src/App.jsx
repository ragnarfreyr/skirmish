import { useState } from 'react'
import { ROWS, COLS, HOME_ROWS, MAX_UNITS } from './game/constants.js'
import { makeUnit, unitAt, bfsReachable, attackableTargets, refillMana } from './game/rules.js'
import { createInitialState } from './game/initialState.js'

export default function App() {
  const [state, setState] = useState(createInitialState)
  // Starts false so the celebration overlay shows the instant a game is won; "View board" flips it.
  const [winOverlayDismissed, setWinOverlayDismissed] = useState(false)
  const {
    units, life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
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

  const manaP1 = units.filter((u) => u.owner === 1).reduce((s, u) => s + u.mana, 0)
  const manaP2 = units.filter((u) => u.owner === 2).reduce((s, u) => s + u.mana, 0)

  const canDeploy =
    phase === 'battle' && !hasDeployedThisTurn && !pendingCard && deployedCount[currentPlayer] < MAX_UNITS

  // ---- actions ----
  function resetGame() {
    setState(createInitialState())
    setWinOverlayDismissed(false)
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
    const card = pendingCard
    const newCounter = deployCounter + 1
    const newUnit = makeUnit(
      `p${deployingPlayer}-${card.key}-${newCounter}`,
      deployingPlayer, card.name, card.mana, card.atk, card.hp, row, col, false, card.ranged,
    )
    let newUnits = [...units, newUnit]
    let newDeployPlaced = deployPlaced + 1
    const newDeployedCount = {
      ...deployedCount,
      [deployingPlayer]: deployedCount[deployingPlayer] + 1,
    }
    let newDeployingPlayer = deployingPlayer
    let newPhase = phase
    let newDecks = decks
    let newPendingCard = null
    let newMessage = message
    let newCurrentPlayer = currentPlayer

    if (newDeployPlaced === 3) {
      if (deployingPlayer === 1) {
        newDeployingPlayer = 2
        newDeployPlaced = 0
        const deck2 = decks[2].slice()
        newPendingCard = deck2.shift() || null
        newDecks = { ...decks, 2: deck2 }
        newMessage = 'Player 2: drawing your opening units.'
      } else {
        newPhase = 'battle'
        newCurrentPlayer = 1
        newUnits = refillMana(newUnits, 1)
        newMessage = "Battle begins! Player 1's turn."
      }
    } else {
      const deckX = decks[deployingPlayer].slice()
      newPendingCard = deckX.shift() || null
      newDecks = { ...decks, [deployingPlayer]: deckX }
    }

    setState({
      ...state,
      units: newUnits,
      deployPlaced: newDeployPlaced,
      deployingPlayer: newDeployingPlayer,
      phase: newPhase,
      decks: newDecks,
      pendingCard: newPendingCard,
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
      if (!pendingCard) return
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

  // ---- render ----
  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = unitAt(units, r, c)
      const classes = ['cell']
      if (reach.some((x) => x.row === r && x.col === c)) classes.push('moveable')
      if (targets.some((t) => t.row === r && t.col === c)) classes.push('attackable')
      if (pendingCard && placingZoneRows.includes(r) && !u) classes.push('placeable')

      cells.push(
        <div key={`${r}-${c}`} className={classes.join(' ')} onClick={() => handleCellTap(r, c)}>
          {u && <UnitChip unit={u} selected={u.id === selectedId} />}
        </div>,
      )
    }
  }

  return (
    <div className="app">
      <h1>Skirmish — pass and play prototype</h1>

      <div className="bar p2">
        <span className="name">Archmage (P2)</span>
        <span className="stats">
          <span>❤ {life[2]}</span>
          <span className="mv">⚡ {manaP2}</span>
          <span className="dk">🂠 {decks[2].length}</span>
        </span>
      </div>

      <div className="board">{cells}</div>

      <div className="bar p1">
        <span className="name">Warlord (P1)</span>
        <span className="stats">
          <span>❤ {life[1]}</span>
          <span className="mv">⚡ {manaP1}</span>
          <span className="dk">🂠 {decks[1].length}</span>
        </span>
      </div>

      <div className="turn-label">
        {phase === 'deploy'
          ? `Player ${deployingPlayer} deploying — ${deployPlaced}/3 placed`
          : `Player ${currentPlayer}'s turn`}
      </div>

      <div className="panel">{message}</div>

      {pendingCard && (
        <div className="pending-wrap">
          <div className="pending-label">Tap an empty tile in your zone to place:</div>
          <div className="deploy-card">
            <div className="dname">
              {pendingCard.name}
              {pendingCard.ranged ? ' (RNG)' : ''}
            </div>
            <div className="dstats">
              {pendingCard.mana} mana &nbsp;•&nbsp; {pendingCard.atk} atk / {pendingCard.hp} hp
            </div>
          </div>
        </div>
      )}

      <div className="controls">
        {phase === 'battle' && (
          <button onClick={drawForBattle} disabled={!canDeploy} style={{ display: canDeploy ? 'block' : 'none' }}>
            Draw unit
          </button>
        )}
        {phase === 'battle' && (
          <button onClick={endTurn} disabled={!!pendingCard} className="end-turn">
            End turn
          </button>
        )}
        <button onClick={resetGame}>Restart</button>
      </div>

      {gameOver && !winOverlayDismissed && (
        <>
          <Confetti />
          <div className="win-banner show">
            <h2>{winText}</h2>
            <div className="win-actions">
              <button onClick={resetGame}>Play again</button>
              <button className="secondary" onClick={() => setWinOverlayDismissed(true)}>
                View board
              </button>
            </div>
          </div>
        </>
      )}

      {gameOver && winOverlayDismissed && (
        <div className="win-recap">
          <span>{winText}</span>
          <button onClick={resetGame}>Play again</button>
        </div>
      )}
    </div>
  )
}

const CONFETTI_COLORS = ['#ffd24a', '#4a90d9', '#d94a5c', '#5ad98f', '#c98fff']

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2.2 + Math.random() * 1.4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.round(Math.random() * 360),
      drift: Math.round((Math.random() - 0.5) * 140),
    })),
  )

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--rotate': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  )
}

function UnitChip({ unit, selected }) {
  const classes = ['unit', `p${unit.owner}`]
  if (unit.isHero) classes.push('hero')
  if (selected) classes.push('selected')
  if (unit.sick) classes.push('sick')
  if (unit.dying) classes.push('dying')
  if (unit._justAttacked) classes.push('attacking')
  if (unit._justHit) classes.push('hit')

  return (
    <div className={classes.join(' ')}>
      <div>{unit.name}</div>
      <div className="stats">
        {unit.atk}/{unit.hp}
      </div>
      <div className="mana">{unit.mana}</div>
      {unit.ranged && <div className="ranged-tag">RNG</div>}
    </div>
  )
}
