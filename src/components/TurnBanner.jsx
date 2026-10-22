import { useEffect, useRef, useState } from 'react'
import { DRAW_ROUNDS } from '../game/constants.js'
import './TurnBanner.css'

// Big slam-in banner whenever the turn or phase changes. Purely decorative:
// it never blocks taps and gets out of the way after about a second.
export default function TurnBanner({ phase, player, round, gameOver }) {
  const [banner, setBanner] = useState(null)
  const bannerKey = `${phase}-${player}`
  const prevPhase = useRef(phase)

  useEffect(() => {
    if (gameOver) return
    const battleStarts = phase === 'battle' && prevPhase.current === 'deploy'
    prevPhase.current = phase
    let title = `Player ${player}`
    let sub = `Round ${round} · your turn`
    if (round === DRAW_ROUNDS) sub = `Round ${round} · last chance to draw`
    if (round > DRAW_ROUNDS) sub = `Round ${round} · no more draws`
    if (round === DRAW_ROUNDS + 1 && player === 1) title = 'Final stand!'
    if (phase === 'deploy') {
      title = 'Deploy!'
      sub = `Player ${player} — place 3 units`
    } else if (battleStarts) {
      title = 'Battle!'
      sub = `Player ${player} goes first`
    }
    setBanner({ key: bannerKey + Math.random(), title, sub, player })
    const t = setTimeout(() => setBanner(null), 1250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bannerKey])

  if (!banner) return null
  return (
    <div className={`turn-banner p${banner.player}`} key={banner.key} aria-live="polite">
      <div className="turn-banner-stripe" />
      <div className="turn-banner-title">{banner.title}</div>
      <div className="turn-banner-sub">{banner.sub}</div>
    </div>
  )
}
