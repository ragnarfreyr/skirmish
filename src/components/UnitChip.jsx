import { useLayoutEffect, useRef } from 'react'
import { animate, EASE, moveDuration } from '../fx/motion.js'
import './UnitChip.css'

// A unit on the board. It's made of three nested layers so different kinds of
// motion never fight over the same `transform`:
//   .unit-slot  — where on the grid it is (springs between tiles)
//   .unit-bob   — selection lift + idle breathing
//   .unit       — one-shot squash & stretch (drop-in, hop, lunge, hit)
export default function UnitChip({ unit, selected, activated, locked, introDelay = 0, registerRef }) {
  const unitRef = useRef(null)
  const prevPos = useRef({ row: unit.row, col: unit.col })

  // Drop onto the board when it first appears, landing with a squash.
  useLayoutEffect(() => {
    animate(
      unitRef.current,
      [
        { transform: 'translateY(-90%) scale(0.55, 1.45)', opacity: 0 },
        { transform: 'translateY(-90%) scale(0.55, 1.45)', opacity: 1, offset: 0.15 },
        { transform: 'translateY(0) scale(1.35, 0.65)', offset: 0.5 },
        { transform: 'translateY(-6%) scale(0.88, 1.14)', offset: 0.7 },
        { transform: 'translateY(0) scale(1.06, 0.95)', offset: 0.85 },
        { transform: 'translateY(0) scale(1, 1)', opacity: 1 },
      ],
      { duration: 620, delay: introDelay, easing: 'ease-out', fill: 'backwards' },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Hop when the unit moves: stretch in the travel direction, arc up, splat on landing.
  useLayoutEffect(() => {
    const { row, col } = prevPos.current
    if (row === unit.row && col === unit.col) return
    const dr = unit.row - row
    const dc = unit.col - col
    prevPos.current = { row: unit.row, col: unit.col }
    const horizontal = Math.abs(dc) >= Math.abs(dr)
    const stretch = horizontal ? 'scale(1.25, 0.82)' : 'scale(0.82, 1.25)'
    animate(
      unitRef.current,
      [
        { transform: 'translateY(0) scale(1, 1)' },
        { transform: 'translateY(4%) scale(1.2, 0.8)', offset: 0.12 }, // crouch
        { transform: `translateY(-22%) ${stretch}`, offset: 0.4 }, // airborne
        { transform: 'translateY(0) scale(1.3, 0.72)', offset: 0.72 }, // splat
        { transform: 'translateY(-4%) scale(0.92, 1.08)', offset: 0.86 },
        { transform: 'translateY(0) scale(1, 1)' },
      ],
      { duration: moveDuration(Math.abs(dr) + Math.abs(dc)) + 120, easing: 'ease-out' },
    )
  }, [unit.row, unit.col])

  // A jelly wobble whenever the unit gets picked up.
  useLayoutEffect(() => {
    if (!selected) return
    animate(
      unitRef.current,
      [{ transform: 'scale(0.82, 1.2)' }, { transform: 'scale(1, 1)' }],
      { duration: 650, easing: EASE.jelly },
    )
  }, [selected])

  // During the render where the unit moves, prevPos still holds the old tile, so this
  // is the distance travelled. (A running CSS transition keeps the duration it started with.)
  const distance = Math.abs(unit.row - prevPos.current.row) + Math.abs(unit.col - prevPos.current.col)
  const classes = ['unit', `p${unit.owner}`]
  if (unit.isHero) classes.push('hero')
  if (unit.sick) classes.push('sick')
  if (unit.dying) classes.push('dying')
  if (unit.mana === 0 && !unit.sick) classes.push('spent')
  if (locked) classes.push('locked')

  return (
    <div
      className={`unit-slot${unit.dying ? ' is-dying' : ''}`}
      ref={(el) => registerRef?.(unit.id, el)}
      style={{
        '--row': unit.row,
        '--col': unit.col,
        transitionDuration: `${moveDuration(distance)}ms`,
      }}
    >
      <div className={`unit-bob${selected ? ' selected' : ''}`}>
        <div className={classes.join(' ')} ref={unitRef}>
          <div className="unit-name">{unit.name}</div>
          <div className="stats">
            <span className="atk">
              <span className="icon">⚔</span>
              {unit.attacks}
              <span className="to-hit">{unit.hit}+</span>
            </span>
            <span className="hp" key={`hp-${unit.hp}`}>
              <span className="icon">❤</span>
              {Math.max(0, unit.hp)}
            </span>
          </div>
          <div className="mana" key={`mana-${unit.mana}`}>
            <span className="icon">⚡</span>
            {unit.mana}
          </div>
          {unit.ranged && <div className="ranged-tag">RNG</div>}
          {unit.sick && <div className="zzz">z</div>}
          {activated && <div className="active-tag">ACTIVE</div>}
        </div>
      </div>
    </div>
  )
}
