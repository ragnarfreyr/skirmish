import './PendingCardPanel.css'

export default function PendingCardPanel({ pendingCard }) {
  if (!pendingCard) return null

  return (
    <div className="pending-wrap">
      <div className="pending-label">Tap an empty tile in your zone to place:</div>
      <div className="deploy-card">
        <div className="dname">
          {pendingCard.name}
          {pendingCard.ranged ? ' (RNG)' : ''}
        </div>
        <div className="dstats">
          {pendingCard.mana} mana &nbsp;•&nbsp; {pendingCard.atk} atk / {pendingCard.hp} hp
        </div>
      </div>
    </div>
  )
}
