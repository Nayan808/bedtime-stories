import { addCredits } from '../../services/storage'

export default function CreditDisplay({ credits, onRefill }) {
  function handleRefill() {
    addCredits(3)
    onRefill()
  }

  return (
    <div className="credit-display">
      <span className="credit-badge" title="Available credits">
        ⭐ {credits} {credits === 1 ? 'credit' : 'credits'}
      </span>
      <button className="btn-refill" onClick={handleRefill} title="Demo: add 3 free credits">
        + Refill (demo)
      </button>
    </div>
  )
}
