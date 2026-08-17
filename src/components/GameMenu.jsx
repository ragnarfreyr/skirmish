import { useState } from 'react'
import './GameMenu.css'

export default function GameMenu({ onRestart }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="game-menu">
      <button type="button" className="menu-btn" onClick={() => setOpen((o) => !o)} aria-label="Menu">
        ☰
      </button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={() => setOpen(false)} />
          <div className="menu-dropdown">
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
