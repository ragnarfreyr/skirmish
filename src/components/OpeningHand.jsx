import './OpeningHand.css'

export default function OpeningHand({ hand, selectedIndex, onSelect }) {
  if (!hand || hand.length === 0) return null

  return (
    <div className="opening-hand">
      <div className="hand-label">Tap a unit, then tap a tile in your zone to deploy it:</div>
      <div className="hand-cards">
        {hand.map((card, i) => (
          <button
            key={i}
            type="button"
            className={`hand-card${i === selectedIndex ? ' selected' : ''}`}
            onClick={() => onSelect(i)}
          >
            <div className="hcname">
              {card.name}
              {card.ranged ? ' (RNG)' : ''}
            </div>
            <div className="hcstats">
              {card.mana} mana &nbsp;•&nbsp; {card.atk} atk / {card.hp} hp
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
