import DeckViewerButton from './DeckViewerButton.jsx'
import GameMenu from './GameMenu.jsx'
import './Controls.css'

export default function Controls({
  phase, canDeploy, hasPendingCard, onDraw, onEndTurn, onReset, deck, deckOwnerLabel,
}) {
  return (
    <div className="controls">
      {phase === 'battle' && (
        <button onClick={onDraw} disabled={!canDeploy} style={{ display: canDeploy ? 'block' : 'none' }}>
          Draw unit
        </button>
      )}
      {phase === 'battle' && (
        <button onClick={onEndTurn} disabled={hasPendingCard} className="end-turn">
          End turn
        </button>
      )}
      <DeckViewerButton deck={deck} label={deckOwnerLabel} />
      <GameMenu onRestart={onReset} />
    </div>
  )
}
