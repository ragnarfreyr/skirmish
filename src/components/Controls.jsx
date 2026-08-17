import './Controls.css'

export default function Controls({ phase, canDeploy, hasPendingCard, onDraw, onEndTurn, onReset }) {
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
      <button onClick={onReset}>Restart</button>
    </div>
  )
}
