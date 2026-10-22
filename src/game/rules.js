import { ROWS, COLS } from './constants.js'
import { isTerrain, hasLineOfSight } from './terrain.js'

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
// units can't move through occupied tiles or terrain.
export function bfsReachable(units, unit, terrain = []) {
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
      if (unitAt(units, nr, nc) || isTerrain(terrain, nr, nc)) continue
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
// (i.e. "as far as it could move") with a clear line of sight (terrain blocks
// shots; units don't), no retaliation.
export function attackableTargets(units, unit, terrain = []) {
  if (unit.mana < 1) return []
  const targets = []

  if (unit.ranged) {
    units.forEach((t) => {
      if (t.owner === unit.owner) return
      const dist = Math.abs(t.row - unit.row) + Math.abs(t.col - unit.col)
      if (dist > 0 && dist <= unit.maxMana && hasLineOfSight(terrain, unit, t)) targets.push(t)
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

// For feedback: is this enemy in a ranged unit's range, but hidden behind terrain?
export function shotBlockedByTerrain(unit, target, terrain = []) {
  if (!unit.ranged) return false
  const dist = Math.abs(target.row - unit.row) + Math.abs(target.col - unit.col)
  return dist > 0 && dist <= unit.maxMana && !hasLineOfSight(terrain, unit, target)
}

export function refillMana(units, player) {
  return units.map((u) =>
    u.owner === player ? { ...u, mana: u.maxMana, sick: false } : u,
  )
}
