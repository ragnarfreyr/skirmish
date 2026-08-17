import Confetti from './Confetti.jsx'
import './WinScreen.css'

export default function WinScreen({ gameOver, winText, dismissed, onDismiss, onReset }) {
  if (!gameOver) return null

  if (dismissed) {
    return (
      <div className="win-recap">
        <span>{winText}</span>
        <button onClick={onReset}>Play again</button>
      </div>
    )
  }

  return (
    <>
      <Confetti />
      <div className="win-banner show">
        <h2>{winText}</h2>
        <div className="win-actions">
          <button onClick={onReset}>Play again</button>
          <button className="secondary" onClick={onDismiss}>
            View board
          </button>
        </div>
      </div>
    </>
  )
}
