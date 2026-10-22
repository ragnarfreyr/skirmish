import './PendingCardPanel.css'

export default function PendingCardPanel({ pendingCard }) {
  if (!pendingCard) return null

  return (
    <div className="pending-wrap">
      <div className="pending-label">Tap an empty tile in your zone to place:</div>
      {/* Keyed by card so each new draw flips in fresh. */}
      <div className="deploy-card" key={pendingCard.uid ?? pendingCard.name}>
        <div className="dname">
          {pendingCard.name}
          {pendingCard.ranged ? ` (RNG ${pendingCard.range})` : ''}
        </div>
        <div className="dstats">
          <span className="d-mana">➜{pendingCard.move}</span>
          <span>
            ⚔{pendingCard.attacks}
            <span className="to-hit">{pendingCard.hit}+</span>
          </span>
          <span>❤{pendingCard.hp}</span>
        </div>
      </div>
    </div>
  )
}
