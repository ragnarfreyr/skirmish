import { useState } from 'react'
import { usePresence } from '../fx/usePresence.js'
import './GameMenu.css'

export default function GameMenu({ onRestart }) {
  const [open, setOpen] = useState(false)
  const { render, closing } = usePresence(open, 160)

  return (
    <div className="game-menu">
      <button type="button" className={`menu-btn${open ? ' open' : ''}`} onClick={() => setOpen((o) => !o)} aria-label="Menu">
        ☰
      </button>
      {render && (
        <>
          {open && <div className="menu-backdrop" onClick={() => setOpen(false)} />}
          <div className={`menu-dropdown${closing ? ' closing' : ''}`}>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onRestart()
              }}
            >
              Restart
            </button>
          </div>
        </>
      )}
    </div>
  )
}
