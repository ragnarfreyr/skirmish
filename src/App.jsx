import { useGameState } from './hooks/useGameState.js'
import PlayerBar from './components/PlayerBar.jsx'
import Board from './components/Board.jsx'
import StatusBar from './components/StatusBar.jsx'
import OpeningHand from './components/OpeningHand.jsx'
import PendingCardPanel from './components/PendingCardPanel.jsx'
import Controls from './components/Controls.jsx'
import WinScreen from './components/WinScreen.jsx'
import TurnBanner from './components/TurnBanner.jsx'
import './App.css'

export default function App() {
  const {
    life, phase, deployingPlayer, deployPlaced, decks, pendingCard,
    openingHand, selectedHandIndex,
    currentPlayer, selectedId, gameOver, winText, message,
    units, terrain, reach, targets, blockedTargets, placingZoneRows, canPlaceCard, manaP1, manaP2, canDeploy,
    winOverlayDismissed, gameId, lastEvent,
    handleCellTap, drawForBattle, endTurn, resetGame, dismissWinOverlay, selectHandCard,
  } = useGameState()

  const activeDeckPlayer = phase === 'deploy' ? deployingPlayer : currentPlayer
  const activeDeckLabel = activeDeckPlayer === 1 ? 'Warlord (P1)' : 'Archmage (P2)'

  return (
    <div className="app">
      <h1>
        Skirmish <span className="h1-sub">pass &amp; play prototype</span>
      </h1>

      <PlayerBar
        player={2} name="Archmage (P2)" life={life[2]} mana={manaP2} deckCount={decks[2].length}
        active={!gameOver && activeDeckPlayer === 2}
      />

      <Board
        key={gameId}
        lastEvent={lastEvent}
        units={units}
        terrain={terrain}
        reach={reach}
        targets={targets}
        blockedTargets={blockedTargets}
        canPlaceCard={canPlaceCard}
        placingZoneRows={placingZoneRows}
        selectedId={selectedId}
        onCellTap={handleCellTap}
      />

      <PlayerBar
        player={1} name="Warlord (P1)" life={life[1]} mana={manaP1} deckCount={decks[1].length}
        active={!gameOver && activeDeckPlayer === 1}
      />

      <StatusBar
        phase={phase}
        deployingPlayer={deployingPlayer}
        deployPlaced={deployPlaced}
        currentPlayer={currentPlayer}
        message={message}
      />

      {phase === 'deploy' ? (
        <OpeningHand player={deployingPlayer} hand={openingHand} selectedIndex={selectedHandIndex} onSelect={selectHandCard} />
      ) : (
        <PendingCardPanel pendingCard={pendingCard} />
      )}

      <Controls
        phase={phase}
        canDeploy={canDeploy}
        hasPendingCard={!!pendingCard}
        onDraw={drawForBattle}
        onEndTurn={endTurn}
        onReset={resetGame}
        deck={decks[activeDeckPlayer]}
        deckOwnerLabel={activeDeckLabel}
      />

      <TurnBanner key={`banner-${gameId}`} phase={phase} player={activeDeckPlayer} gameOver={gameOver} />

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
