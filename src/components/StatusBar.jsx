import './StatusBar.css'

export default function StatusBar({ phase, deployingPlayer, deployPlaced, currentPlayer, message }) {
  return (
    <>
      <div className="turn-label">
        {phase === 'deploy'
          ? `Player ${deployingPlayer} deploying — ${deployPlaced}/3 placed`
          : `Player ${currentPlayer}'s turn`}
      </div>
      <div className="panel">{message}</div>
    </>
  )
}
