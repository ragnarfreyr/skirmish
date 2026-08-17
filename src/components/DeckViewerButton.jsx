import { useState } from 'react'
import './DeckViewerButton.css'

export default function DeckViewerButton({ deck, label }) {
  const [open, setOpen] = useState(false)

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
      {open && (
        <div className="deck-modal-overlay" onClick={() => setOpen(false)}>
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
              {counts.map((card) => (
                <div className="deck-row" key={card.name}>
                  <span className="deck-row-name">
                    {card.name}
                    {card.ranged ? ' (RNG)' : ''}
                  </span>
                  <span className="deck-row-stats">
                    {card.mana} mana • {card.atk} atk / {card.hp} hp
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
