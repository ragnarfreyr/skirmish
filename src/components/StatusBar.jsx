import './StatusBar.css'

import { DRAW_ROUNDS } from '../game/constants.js'

export default function StatusBar({ phase, deployingPlayer, deployPlaced, currentPlayer, round, activatedName, message }) {
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
          <>
            <span className={`round${round > DRAW_ROUNDS ? ' no-draws' : ''}`} key={`r${round}`}>
              Round {round}
              {round === DRAW_ROUNDS && ' · last draw'}
              {round > DRAW_ROUNDS && ' · no draws'}
            </span>
            Player {currentPlayer}'s turn —{' '}
            {activatedName ? (
              <span className="activated" key={activatedName}>
                {activatedName} activated
              </span>
            ) : (
              'activate one unit'
            )}
          </>
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
