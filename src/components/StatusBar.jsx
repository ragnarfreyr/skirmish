import './StatusBar.css'

export default function StatusBar({ phase, deployingPlayer, deployPlaced, currentPlayer, message }) {
  return (
    <>
      <div className="turn-label">
        {phase === 'deploy' ? (
          <>
            Player {deployingPlayer} deploying —{' '}
            <span className="count" key={deployPlaced}>
              {deployPlaced}/3
            </span>{' '}
            placed
          </>
        ) : (
          `Player ${currentPlayer}'s turn`
        )}
      </div>
      <div className="panel">
        {/* Keyed by the text so every new message springs in. */}
        <div className="panel-msg" key={message}>
          {message}
        </div>
      </div>
    </>
  )
}
