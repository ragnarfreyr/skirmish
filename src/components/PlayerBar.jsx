import './PlayerBar.css'

export default function PlayerBar({ player, name, life, mana, deckCount }) {
  return (
    <div className={`bar p${player}`}>
      <span className="name">{name}</span>
      <span className="stats">
        <span>❤ {life}</span>
        <span className="mv">⚡ {mana}</span>
        <span className="dk">🂠 {deckCount}</span>
      </span>
    </div>
  )
}
