import { ROWS, COLS } from './constants.js'

export function makeUnit(id, owner, name, mana, atk, hp, row, col, isHero, ranged) {
  return {
    id,
    owner,
    name,
    mana,
    maxMana: mana,
    atk,
    hp,
    maxHp: hp,
    row,
    col,
    isHero: !!isHero,
    ranged: !!ranged,
    breached: false,
    dying: false,
    sick: false,
    _justAttacked: false,
    _justHit: false,
  }
}

export function unitAt(units, row, col) {
  return units.find((u) => u.row === row && u.col === col)
}

// All tiles a unit can reach this turn, given its remaining mana.
// Movement is orthogonal only (no diagonals) and costs 1 mana per square;
// units can't move through occupied tiles.
export function bfsReachable(units, unit) {
  const visited = { [`${unit.row},${unit.col}`]: 0 }
  const queue = [{ row: unit.row, col: unit.col, cost: 0 }]
  const reachable = []
  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]

  while (queue.length) {
    const cur = queue.shift()
    for (const [dr, dc] of dirs) {
      const nr = cur.row + dr
      const nc = cur.col + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      const key = `${nr},${nc}`
      const nextCost = cur.cost + 1
      if (nextCost > unit.mana) continue
      if (unitAt(units, nr, nc)) continue
      if (visited[key] !== undefined && visited[key] <= nextCost) continue
      visited[key] = nextCost
      reachable.push({ row: nr, col: nc, cost: nextCost })
      queue.push({ row: nr, col: nc, cost: nextCost })
    }
  }
  return reachable
}

// Enemy units this unit could attack right now (costs 1 mana, needs mana >= 1).
// Melee: any of the 8 surrounding tiles (diagonals included).
// Ranged: any enemy within a distance equal to the unit's mana stat
// (i.e. "as far as it could move"), no line-of-sight check, no retaliation.
export function attackableTargets(units, unit) {
  if (unit.mana < 1) return []
  const targets = []

  if (unit.ranged) {
    units.forEach((t) => {
      if (t.owner === unit.owner) return
      const dist = Math.abs(t.row - unit.row) + Math.abs(t.col - unit.col)
      if (dist > 0 && dist <= unit.maxMana) targets.push(t)
    })
  } else {
    const dirs = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ]
    for (const [dr, dc] of dirs) {
      const t = unitAt(units, unit.row + dr, unit.col + dc)
      if (t && t.owner !== unit.owner) targets.push(t)
    }
  }
  return targets
}

export function refillMana(units, player) {
  return units.map((u) =>
    u.owner === player ? { ...u, mana: u.maxMana, sick: false } : u,
  )
}
