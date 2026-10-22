import DeckViewerButton from './DeckViewerButton.jsx'
import GameMenu from './GameMenu.jsx'
import './Controls.css'

export default function Controls({
  phase, canDeploy, hasPendingCard, turnDone, drawsLeft, onDraw, onEndTurn, onReset, deck, deckOwnerLabel,
}) {
  return (
    <div className="controls">
      {phase === 'battle' && canDeploy && (
        <button onClick={onDraw} className="draw pop-in">
          Draw unit <span className="draws-left">{drawsLeft} left</span>
        </button>
      )}
      {phase === 'battle' && (
        <button onClick={onEndTurn} disabled={hasPendingCard} className={`end-turn pop-in${turnDone ? ' nudge' : ''}`}>
          End turn
        </button>
      )}
      <DeckViewerButton deck={deck} label={deckOwnerLabel} />
      <GameMenu onRestart={onReset} />
    </div>
  )
}
