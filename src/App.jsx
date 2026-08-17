import { useGameState } from './hooks/useGameState.js'
import PlayerBar from './components/PlayerBar.jsx'
import Board from './components/Board.jsx'
import StatusBar from './components/StatusBar.jsx'
import PendingCardPanel from './components/PendingCardPanel.jsx'
import Controls from './components/Controls.jsx'
import WinScreen from './components/WinScreen.jsx'
import './App.css'

export default function App() {
  const {
    life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    currentPlayer, selectedId, gameOver, winText, message,
    units, reach, targets, placingZoneRows, manaP1, manaP2, canDeploy,
    winOverlayDismissed,
    handleCellTap, drawForBattle, endTurn, resetGame, dismissWinOverlay,
  } = useGameState()

  return (
    <div className="app">
      <h1>Skirmish — pass and play prototype</h1>

      <PlayerBar player={2} name="Archmage (P2)" life={life[2]} mana={manaP2} deckCount={decks[2].length} />

      <Board
        units={units}
        reach={reach}
        targets={targets}
        pendingCard={pendingCard}
        placingZoneRows={placingZoneRows}
        selectedId={selectedId}
        onCellTap={handleCellTap}
      />

      <PlayerBar player={1} name="Warlord (P1)" life={life[1]} mana={manaP1} deckCount={decks[1].length} />

      <StatusBar
        phase={phase}
        deployingPlayer={deployingPlayer}
        deployPlaced={deployPlaced}
        currentPlayer={currentPlayer}
        message={message}
      />

      <PendingCardPanel pendingCard={pendingCard} />

      <Controls
        phase={phase}
        canDeploy={canDeploy}
        hasPendingCard={!!pendingCard}
        onDraw={drawForBattle}
        onEndTurn={endTurn}
        onReset={resetGame}
      />

      <WinScreen
        gameOver={gameOver}
        winText={winText}
        dismissed={winOverlayDismissed}
        onDismiss={dismissWinOverlay}
        onReset={resetGame}
      />
    </div>
  )
}
