import { useEffect, useRef } from 'react'
import { ROWS, COLS } from '../game/constants.js'
import { unitAt } from '../game/rules.js'
import { animate, buzz, EASE, moveDuration } from '../fx/motion.js'
import UnitChip from './UnitChip.jsx'
import './Board.css'

// Melee: wind up, lunge in, bonk. Ranged: recoil and fire a bolt.
const MELEE_IMPACT_MS = 170
const RANGED_IMPACT_MS = 250
const RETALIATION_DELAY_MS = 110
const GRID_GAP = 3 // keep in sync with --gap in Board.css

export default function Board({
  units, terrain, reach, targets, blockedTargets, canPlaceCard, placingZoneRows, selectedId, activatedId, lockedIds, onCellTap, lastEvent,
}) {
  const shakeRef = useRef(null)
  const fxRef = useRef(null)
  const slots = useRef(new Map())
  // Units present on the first render drop in one after another; later ones drop in immediately.
  const introDone = useRef(false)
  useEffect(() => {
    introDone.current = true
  }, [])

  const registerRef = (id, el) => {
    if (el) slots.current.set(id, el)
    else slots.current.delete(id)
  }

  // ---- choreograph attacks and breakthroughs ----
  useEffect(() => {
    if (!lastEvent) return
    if (lastEvent.type === 'attack') playAttack(lastEvent)
    if (lastEvent.type === 'breach') playBreach(lastEvent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastEvent?.id])

  function chipOf(id) {
    return slots.current.get(id)?.querySelector('.unit')
  }

  function cellSize() {
    // Distance from one tile to the next (tile width + grid gap).
    const any = slots.current.values().next().value
    return any ? any.getBoundingClientRect().width + GRID_GAP : 50
  }

  function playAttack(ev) {
    const attacker = chipOf(ev.attackerId)
    const defender = chipOf(ev.defenderId)
    const dr = ev.to.row - ev.from.row
    const dc = ev.to.col - ev.from.col
    const len = Math.hypot(dr, dc) || 1
    const ux = dc / len
    const uy = dr / len
    const size = cellSize()

    let impactAt
    if (!ev.ranged) {
      impactAt = MELEE_IMPACT_MS
      const reachPx = size * Math.min(len, 1) * 0.55
      animate(
        attacker,
        [
          { transform: 'translate(0, 0) scale(1, 1)' },
          { transform: `translate(${-ux * 8}px, ${-uy * 8}px) scale(0.9, 1.1)`, offset: 0.3 }, // wind-up
          { transform: `translate(${ux * reachPx}px, ${uy * reachPx}px) scale(1.2, 0.85)`, offset: 0.45 }, // strike
          { transform: `translate(${ux * reachPx * 0.6}px, ${uy * reachPx * 0.6}px) scale(0.95, 1.05)`, offset: 0.6 },
          { transform: 'translate(0, 0) scale(1, 1)' },
        ],
        { duration: 380, easing: 'ease-out', composite: 'replace' },
      )
      slots.current.get(ev.attackerId)?.style.setProperty('z-index', '5')
      setTimeout(() => slots.current.get(ev.attackerId)?.style.removeProperty('z-index'), 400)
    } else {
      impactAt = RANGED_IMPACT_MS
      animate(
        attacker,
        [
          { transform: 'translate(0, 0) scale(1, 1)' },
          { transform: `translate(${-ux * 7}px, ${-uy * 7}px) scale(1.15, 0.85)`, offset: 0.25 },
          { transform: 'translate(0, 0) scale(1, 1)' },
        ],
        { duration: 420, easing: EASE.bouncy },
      )
      fireBolt(ev, size)
    }

    setTimeout(() => {
      hit(defender, ux, uy, ev.dmg, ev.defenderDies)
      spawnText(ev.to, `-${ev.dmg}`, ev.defenderDies ? 'big' : '')
      if (ev.defenderDies) burst(ev.to, size)
      shake(ev.defenderDies ? 9 : 5)
      buzz(ev.defenderDies ? [20, 40, 30] : 15)
    }, impactAt)

    if (ev.retaliation) {
      setTimeout(() => {
        hit(attacker, -ux, -uy, ev.retaliation, ev.attackerDies)
        spawnText(ev.from, `-${ev.retaliation}`, ev.attackerDies ? 'big' : '')
        if (ev.attackerDies) burst(ev.from, size)
        shake(ev.attackerDies ? 9 : 4)
      }, impactAt + RETALIATION_DELAY_MS)
    }
  }

  function playBreach(ev) {
    // Wait for the unit to land on the back row, then make some noise.
    setTimeout(() => {
      const chip = chipOf(ev.unitId)
      animate(
        chip,
        [
          { transform: 'scale(1)', filter: 'brightness(1)' },
          { transform: 'scale(1.45) rotate(-6deg)', filter: 'brightness(2.2)', offset: 0.25 },
          { transform: 'scale(1)', filter: 'brightness(1)' },
        ],
        { duration: 700, easing: EASE.jelly },
      )
      spawnText(ev, 'BREAKTHROUGH!', 'breach')
      burst(ev, cellSize(), 18, 0)
      shake(12)
      buzz([30, 50, 30, 50, 60])
    }, moveDuration(ev.distance) + 60)
  }

  // White flash, knocked back away from the blow, squish, wobble home.
  function hit(el, ux, uy, dmg, dies) {
    const k = 6 + dmg * 2
    animate(
      el,
      [
        { transform: 'translate(0, 0) scale(1, 1)', filter: 'brightness(1)' },
        { transform: `translate(${ux * k}px, ${uy * k}px) scale(1.25, 0.78)`, filter: 'brightness(3) saturate(0)', offset: 0.15 },
        { transform: `translate(${-ux * k * 0.4}px, ${-uy * k * 0.4}px) scale(0.88, 1.12) rotate(${ux * -6}deg)`, filter: 'brightness(1.3)', offset: 0.4 },
        { transform: `translate(${ux * 2}px, ${uy * 2}px) scale(1.05, 0.96) rotate(${ux * 3}deg)`, offset: 0.65 },
        { transform: 'translate(0, 0) scale(1, 1)', filter: 'brightness(1)' },
      ],
      { duration: dies ? 200 : 520, easing: 'ease-out' },
    )
  }

  function shake(strength) {
    const s = strength
    animate(
      shakeRef.current,
      [
        { transform: 'translate(0, 0) rotate(0)' },
        { transform: `translate(${-s}px, ${s * 0.5}px) rotate(-0.6deg)` },
        { transform: `translate(${s * 0.8}px, ${-s * 0.4}px) rotate(0.5deg)` },
        { transform: `translate(${-s * 0.5}px, ${-s * 0.3}px) rotate(-0.3deg)` },
        { transform: `translate(${s * 0.3}px, ${s * 0.2}px) rotate(0.2deg)` },
        { transform: 'translate(0, 0) rotate(0)' },
      ],
      { duration: 320, easing: 'ease-out' },
    )
  }

  // ---- little imperative FX nodes (damage numbers, bolts, particles) ----
  function fxNode(className, pos) {
    const layer = fxRef.current
    if (!layer) return null
    const el = document.createElement('div')
    el.className = className
    el.style.setProperty('--row', pos.row)
    el.style.setProperty('--col', pos.col)
    layer.appendChild(el)
    return el
  }

  function spawnText(pos, text, variant) {
    const el = fxNode(`fx-text ${variant || ''}`, pos)
    if (!el) return
    el.textContent = text
    const drift = (Math.random() - 0.5) * 24
    const a = el.animate(
      [
        { transform: 'translate(0, 0) scale(0.2)', opacity: 0 },
        { transform: `translate(${drift * 0.3}px, -14px) scale(1.6)`, opacity: 1, offset: 0.15 },
        { transform: `translate(${drift * 0.6}px, -24px) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${drift}px, -46px) scale(0.9)`, opacity: 0 },
      ],
      { duration: variant === 'breach' ? 1400 : 950, easing: 'ease-out' },
    )
    a.onfinish = () => el.remove()
  }

  function fireBolt(ev, size) {
    const el = fxNode('fx-bolt', ev.from)
    if (!el) return
    const dx = (ev.to.col - ev.from.col) * size
    const dy = (ev.to.row - ev.from.row) * size
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI
    const a = el.animate(
      [
        { transform: `translate(0, 0) rotate(${angle}deg) scale(0.3, 1)`, opacity: 0 },
        { transform: `translate(${dx * 0.1}px, ${dy * 0.1}px) rotate(${angle}deg) scale(1.6, 1)`, opacity: 1, offset: 0.25 },
        { transform: `translate(${dx}px, ${dy}px) rotate(${angle}deg) scale(1, 1)`, opacity: 1 },
      ],
      { duration: RANGED_IMPACT_MS - 40, delay: 40, easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)', fill: 'backwards' },
    )
    a.onfinish = () => el.remove()
  }

  function burst(pos, size, count = 12, delay = 250) {
    for (let i = 0; i < count; i++) {
      const el = fxNode('fx-spark', pos)
      if (!el) return
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5
      const dist = size * (0.5 + Math.random() * 0.6)
      const a = el.animate(
        [
          { transform: 'translate(0, 0) scale(1.4)', opacity: 1 },
          { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0.2 },
        ],
        { duration: 450 + Math.random() * 250, easing: 'cubic-bezier(0.1, 0.8, 0.3, 1)', delay, fill: 'backwards' },
      )
      a.onfinish = () => el.remove()
    }
  }

  // ---- grid ----
  const selected = units.find((u) => u.id === selectedId)
  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = unitAt(units, r, c)
      const classes = ['cell']
      // Highlights ripple outward from the selected unit.
      const dist = selected ? Math.abs(selected.row - r) + Math.abs(selected.col - c) : c + r
      if (reach.some((x) => x.row === r && x.col === c)) classes.push('moveable')
      if (targets.some((t) => t.row === r && t.col === c)) classes.push('attackable')
      if (blockedTargets.some((t) => t.row === r && t.col === c)) classes.push('blocked')
      const rock = terrain.some((t) => t.row === r && t.col === c)
      if (rock) classes.push('terrain')
      if (canPlaceCard && placingZoneRows.includes(r) && !u && !rock) classes.push('placeable')
      if (placingZoneRows.includes(r)) classes.push('zone')

      cells.push(
        <div
          key={`${r}-${c}-${selectedId ?? ""}`}
          className={classes.join(' ')}
          style={{ '--d': dist }}
          onClick={() => onCellTap(r, c)}
        />,
      )
    }
  }

  return (
    <div className="board-shake" ref={shakeRef}>
      <div className="board">
        {cells}
        <div className="units-layer">
          {/* Rocks rise out of the ground first, then the heroes drop in. */}
          {terrain.map((t, i) => (
            <div
              key={`rock-${t.row}-${t.col}`}
              className={`rock rock-v${(t.row * 7 + t.col * 3) % 3}`}
              style={{ '--row': t.row, '--col': t.col, '--i': i }}
            >
              <span className="rock-body" />
            </div>
          ))}
          {units.map((u, i) => (
            <UnitChip
              key={u.id}
              unit={u}
              selected={u.id === selectedId}
              activated={u.id === activatedId}
              locked={lockedIds.includes(u.id)}
              introDelay={introDone.current ? 0 : 300 + terrain.length * 90 + i * 140}
              registerRef={registerRef}
            />
          ))}
          <div className="fx-layer" ref={fxRef} />
        </div>
      </div>
    </div>
  )
}
