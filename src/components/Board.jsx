import { ROWS, COLS } from '../game/constants.js'
import { unitAt } from '../game/rules.js'
import UnitChip from './UnitChip.jsx'
import './Board.css'

export default function Board({ units, reach, targets, pendingCard, placingZoneRows, selectedId, onCellTap }) {
  const cells = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const u = unitAt(units, r, c)
      const classes = ['cell']
      if (reach.some((x) => x.row === r && x.col === c)) classes.push('moveable')
      if (targets.some((t) => t.row === r && t.col === c)) classes.push('attackable')
      if (pendingCard && placingZoneRows.includes(r) && !u) classes.push('placeable')

      cells.push(
        <div key={`${r}-${c}`} className={classes.join(' ')} onClick={() => onCellTap(r, c)}>
          {u && <UnitChip unit={u} selected={u.id === selectedId} />}
        </div>,
      )
    }
  }

  return <div className="board">{cells}</div>
}
