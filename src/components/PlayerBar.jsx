import { useLayoutEffect, useRef } from 'react'
import { animate, EASE } from '../fx/motion.js'
import './PlayerBar.css'

export default function PlayerBar({ player, name, life, mana, deckCount, active }) {
  const barRef = useRef(null)
  const prevLife = useRef(life)

  // Losing life rattles the whole bar and flashes it red.
  useLayoutEffect(() => {
    if (life < prevLife.current) {
      animate(
        barRef.current,
        [
          { transform: 'translateX(0)', backgroundColor: '#5a1f26' },
          { transform: 'translateX(-10px) rotate(-1deg)', offset: 0.15 },
          { transform: 'translateX(8px) rotate(1deg)', offset: 0.35 },
          { transform: 'translateX(-5px)', offset: 0.55 },
          { transform: 'translateX(3px)', offset: 0.75 },
          { transform: 'translateX(0)', backgroundColor: '#1e2127' },
        ],
        { duration: 600, easing: 'ease-out' },
      )
    }
    prevLife.current = life
  }, [life])

  // Becoming the active player: a jelly wobble to draw the eye.
  useLayoutEffect(() => {
    if (!active) return
    animate(barRef.current, [{ transform: 'scale(1.08, 0.9)' }, { transform: 'scale(1)' }], {
      duration: 700,
      easing: EASE.jelly,
    })
  }, [active])

  return (
    <div className={`bar p${player}${active ? ' active' : ''}`} ref={barRef}>
      <span className="name">
        {active && <span className="turn-dot" />}
        {name}
      </span>
      <span className="stats">
        {/* Keyed by value so each change remounts the number and replays its bump. */}
        <span className="num" key={`l${life}`}>❤ {life}</span>
        <span className="num mv" key={`m${mana}`}>⚡ {mana}</span>
        <span className="num dk" key={`d${deckCount}`}>🂠 {deckCount}</span>
      </span>
    </div>
  )
}
