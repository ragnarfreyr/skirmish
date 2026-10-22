import { ROWS, COLS, HOME_ROWS } from './constants.js'

export const MAX_TERRAIN = 6
export const MIN_TERRAIN = 1

// Terrain only goes in no-man's-land (the rows outside both deploy zones), so it
// never eats deploy space, never sits on a hero, and never blocks a breakthrough row.
const HOME = new Set([...HOME_ROWS[1], ...HOME_ROWS[2]])
const TERRAIN_ROWS = Array.from({ length: ROWS }, (_, r) => r).filter((r) => !HOME.has(r))

export function isTerrain(terrain, row, col) {
  return terrain.some((t) => t.row === row && t.col === col)
}

// Random terrain for a new game: MIN_TERRAIN..MAX_TERRAIN tiles on random cells,
// re-rolled until both armies can still walk to each other.
export function generateTerrain(random = Math.random) {
  const candidates = []
  TERRAIN_ROWS.forEach((row) => {
    for (let col = 0; col < COLS; col++) candidates.push({ row, col })
  })

  for (let attempt = 0; attempt < 100; attempt++) {
    const count = MIN_TERRAIN + Math.floor(random() * (MAX_TERRAIN - MIN_TERRAIN + 1))
    const pool = candidates.slice()
    // Fisher-Yates, then take the first `count`
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    const terrain = pool.slice(0, count)
    if (sidesConnected(terrain)) return terrain
  }
  return []
}

// True when there's an orthogonal path from one side's back row to the other's
// that avoids terrain, so terrain can never wall the board in two.
function sidesConnected(terrain) {
  const start = []
  for (let col = 0; col < COLS; col++) start.push({ row: 0, col })
  const seen = new Set(start.map((p) => `${p.row},${p.col}`))
  const queue = start.slice()
  while (queue.length) {
    const { row, col } = queue.shift()
    if (row === ROWS - 1) return true
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const r = row + dr
      const c = col + dc
      const key = `${r},${c}`
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || seen.has(key) || isTerrain(terrain, r, c)) continue
      seen.add(key)
      queue.push({ row: r, col: c })
    }
  }
  return false
}

// Line of sight between two tile centers. A terrain tile blocks the shot when the
// straight line actually passes through it; just grazing a corner doesn't count.
export function hasLineOfSight(terrain, from, to) {
  const x0 = from.col + 0.5
  const y0 = from.row + 0.5
  const x1 = to.col + 0.5
  const y1 = to.row + 0.5
  return !terrain.some((t) => {
    if ((t.row === from.row && t.col === from.col) || (t.row === to.row && t.col === to.col)) return false
    return segmentHitsBox(x0, y0, x1, y1, t.col, t.row, t.col + 1, t.row + 1)
  })
}

// Slab test against the box shrunk by a hair, so touching an edge or corner is a miss.
function segmentHitsBox(x0, y0, x1, y1, minX, minY, maxX, maxY) {
  const eps = 1e-6
  minX += eps
  minY += eps
  maxX -= eps
  maxY -= eps
  let tMin = 0
  let tMax = 1
  const d = [x1 - x0, y1 - y0]
  const p = [x0, y0]
  const lo = [minX, minY]
  const hi = [maxX, maxY]
  for (let i = 0; i < 2; i++) {
    if (Math.abs(d[i]) < 1e-12) {
      if (p[i] <= lo[i] || p[i] >= hi[i]) return false
    } else {
      let t1 = (lo[i] - p[i]) / d[i]
      let t2 = (hi[i] - p[i]) / d[i]
      if (t1 > t2) [t1, t2] = [t2, t1]
      tMin = Math.max(tMin, t1)
      tMax = Math.min(tMax, t2)
      if (tMin >= tMax) return false
    }
  }
  return true
}
