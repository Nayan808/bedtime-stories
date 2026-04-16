import { useState, useRef, useEffect } from 'react'

export default function CreditDisplay({ credits, onRefill }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleRefill(amount) {
    onRefill(amount)   // App.jsx addCredits handles storage + state
    setOpen(false)
  }

  const empty = credits < 1

  return (
    <div className="credit-display" ref={ref}>
      <button
        className={`credit-badge clickable${empty ? ' empty' : ''}`}
        onClick={() => setOpen((v) => !v)}
        title={empty ? 'Out of credits — click to buy' : 'Click to add credits'}
      >
        {empty ? '⭐ Out of credits' : `⭐ ${credits} ${credits === 1 ? 'credit' : 'credits'}`}
      </button>

      {open && (
        <div className="credit-popover">
          <p className="credit-popover-title">Add Credits</p>
          <div className="credit-popover-options">
            <button className="credit-option" onClick={() => handleRefill(3)}>
              <span className="credit-option-amount">+3</span>
              <span className="credit-option-label">Quick top-up</span>
            </button>
            <button className="credit-option" onClick={() => handleRefill(10)}>
              <span className="credit-option-amount">+10</span>
              <span className="credit-option-label">Standard</span>
            </button>
            <button className="credit-option featured" onClick={() => handleRefill(25)}>
              <span className="credit-option-amount">+25</span>
              <span className="credit-option-label">Best value</span>
            </button>
          </div>
          <p className="credit-popover-note">Demo mode — free credits</p>
        </div>
      )}
    </div>
  )
}
