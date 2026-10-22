import { useState } from 'react'
import { usePresence } from '../fx/usePresence.js'
import './DeckViewerButton.css'

export default function DeckViewerButton({ deck, label }) {
  const [open, setOpen] = useState(false)
  const { render, closing } = usePresence(open, 200)

  const counts = []
  const indexByName = {}
  deck.forEach((card) => {
    if (indexByName[card.name] === undefined) {
      indexByName[card.name] = counts.length
      counts.push({ ...card, count: 1 })
    } else {
      counts[indexByName[card.name]].count++
    }
  })

  return (
    <>
      <button type="button" className="deck-btn" onClick={() => setOpen(true)} aria-label="View deck">
        🂠
      </button>
      {render && (
        <div className={`deck-modal-overlay${closing ? ' closing' : ''}`} onClick={() => setOpen(false)}>
          <div className="deck-modal" onClick={(e) => e.stopPropagation()}>
            <div className="deck-modal-header">
              <h3>
                {label} — Deck ({deck.length})
              </h3>
              <button type="button" className="deck-modal-close" onClick={() => setOpen(false)} aria-label="Close">
                ✕
              </button>
            </div>
            <div className="deck-list">
              {counts.length === 0 && <div className="deck-empty">No cards left.</div>}
              {counts.map((card, i) => (
                <div className="deck-row" key={card.name} style={{ '--i': i }}>
                  <span className="deck-row-name">
                    {card.name}
                    {card.ranged ? ` (range ${card.range})` : ''}
                  </span>
                  <span className="deck-row-stats">
                    move {card.move} • {card.attacks} dice, hit {card.hit}+ • {card.hp} hp
                  </span>
                  <span className="deck-row-count">×{card.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
