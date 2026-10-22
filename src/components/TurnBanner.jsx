import { useEffect, useRef, useState } from 'react'
import './TurnBanner.css'

// Big slam-in banner whenever the turn or phase changes. Purely decorative:
// it never blocks taps and gets out of the way after about a second.
export default function TurnBanner({ phase, player, gameOver }) {
  const [banner, setBanner] = useState(null)
  const bannerKey = `${phase}-${player}`
  const prevPhase = useRef(phase)

  useEffect(() => {
    if (gameOver) return
    const battleStarts = phase === 'battle' && prevPhase.current === 'deploy'
    prevPhase.current = phase
    let title = `Player ${player}`
    let sub = 'Your turn'
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
