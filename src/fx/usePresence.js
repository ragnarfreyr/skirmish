import { useEffect, useState } from 'react'

// Keeps something mounted for `exitMs` after `open` turns false, so it can
// play an exit animation instead of vanishing. `closing` is true during that time.
export function usePresence(open, exitMs = 200) {
  const [mounted, setMounted] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = setTimeout(() => setMounted(false), exitMs)
    return () => clearTimeout(t)
  }, [open, exitMs])

  return { render: open || mounted, closing: !open && mounted }
}
