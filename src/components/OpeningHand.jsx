import './OpeningHand.css'

export default function OpeningHand({ hand, selectedIndex, onSelect, player }) {
  if (!hand || hand.length === 0) return null

  return (
    <div className="opening-hand">
      {/* Keyed by player so a fresh hand is dealt in when Player 2 takes over. */}
      <div className="hand-cards" key={player}>
        {hand.map((card, i) => {
          // Fan the cards slightly, like they're held in a hand.
          const fan = hand.length === 1 ? 0 : (i - (hand.length - 1) / 2) * 4
          return (
            <button
              key={card.uid ?? i}
              type="button"
              className={`hand-card p${player}${i === selectedIndex ? ' selected' : ''}`}
              style={{ '--fan': `${fan}deg`, '--i': i }}
              onClick={() => onSelect(i)}
            >
              <div className="hcname">
                {card.name}
                {card.ranged ? ' (RNG)' : ''}
              </div>
              <div className="hcstats">
                <span className="hc-mana">⚡{card.mana}</span>
                <span>⚔{card.atk}</span>
                <span>❤{card.hp}</span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
