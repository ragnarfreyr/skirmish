import './UnitChip.css'

export default function UnitChip({ unit, selected }) {
  const classes = ['unit', `p${unit.owner}`]
  if (unit.isHero) classes.push('hero')
  if (selected) classes.push('selected')
  if (unit.sick) classes.push('sick')
  if (unit.dying) classes.push('dying')
  if (unit._justAttacked) classes.push('attacking')
  if (unit._justHit) classes.push('hit')

  return (
    <div className={classes.join(' ')}>
      <div>{unit.name}</div>
      <div className="stats">
        {unit.atk}/{unit.hp}
      </div>
      <div className="mana">{unit.mana}</div>
      {unit.ranged && <div className="ranged-tag">RNG</div>}
    </div>
  )
}
