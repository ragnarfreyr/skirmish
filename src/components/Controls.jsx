import DeckViewerButton from './DeckViewerButton.jsx'
import GameMenu from './GameMenu.jsx'
import './Controls.css'

export default function Controls({
  phase, canDeploy, hasPendingCard, busy, turnDone, drawsLeft, onDraw, onEndTurn, onReset, deck, deckOwnerLabel,
}) {
  return (
    <div className="controls">
      {phase === 'battle' && canDeploy && (
        <button onClick={onDraw} disabled={busy} className="draw pop-in">
          Draw unit <span className="draws-left">{drawsLeft} left</span>
        </button>
      )}
      {phase === 'battle' && (
        <button onClick={onEndTurn} disabled={hasPendingCard || busy} className={`end-turn pop-in${turnDone ? ' nudge' : ''}`}>
          End turn
        </button>
      )}
      <DeckViewerButton deck={deck} label={deckOwnerLabel} />
      <GameMenu onRestart={onReset} />
    </div>
  )
}
