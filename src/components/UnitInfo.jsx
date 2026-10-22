import { hitChance } from '../game/dice.js'
import { COLS } from '../game/constants.js'
import './UnitInfo.css'

// A small stat card that pops out beside the board for the tapped unit, so players can size up
// any unit (theirs or the enemy's) at a glance. It stays open while the unit moves.
export default function UnitInfo({ unit, onClose }) {
  if (!unit) return null

  const avgHits = (unit.attacks * (7 - unit.hit)) / 6
  const status = []
  if (unit.sick) status.push('Just arrived — acts next turn')
  else if (unit.attacked && unit.move === 0) status.push('Done for this turn')
  else if (unit.attacked) status.push('Has attacked this turn')
  if (unit.breached) status.push('Broke through')

  return (
    <div
      className={`unit-info p${unit.owner}`}
      style={{ '--col': unit.col, '--cols': COLS }}
      key={unit.id}
      role="dialog"
      aria-label={`${unit.name} stats`}
    >
      <div className="ui-head">
        <span className="ui-name">
          {unit.isHero && <span className="ui-crown">♛</span>}
          {unit.name}
        </span>
        <span className="ui-owner">P{unit.owner}</span>
        <button type="button" className="ui-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>

      <div className="ui-grid">
        <Stat icon="➜" label="Move" value={`${unit.move}/${unit.maxMove}`} />
        <Stat icon="❤" label="Health" value={`${Math.max(0, unit.hp)}/${unit.maxHp}`} />
        <Stat icon="⚔" label="Attacks" value={`${unit.attacks} ${unit.attacks === 1 ? 'die' : 'dice'}`} />
        <Stat icon="🎯" label="Hits on" value={`${unit.hit}+`} sub={`${hitChance(unit.hit)}%`} gold />
        <Stat
          icon={unit.ranged ? '🏹' : '🗡'}
          label={unit.ranged ? 'Range' : 'Reach'}
          value={unit.ranged ? `${unit.range} sq` : 'Melee'}
        />
        <Stat icon="Σ" label="Avg hits" value={avgHits.toFixed(1)} />
      </div>

      {status.length > 0 && <div className="ui-status">{status.join(' · ')}</div>}
    </div>
  )
}

function Stat({ icon, label, value, sub, gold }) {
  return (
    <div className={`ui-stat${gold ? ' gold' : ''}`}>
      <span className="ui-icon">{icon}</span>
      <span className="ui-label">{label}</span>
      <span className="ui-value">
        {value}
        {sub && <span className="ui-sub">{sub}</span>}
      </span>
    </div>
  )
}
