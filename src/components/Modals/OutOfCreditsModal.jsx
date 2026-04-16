export default function OutOfCreditsModal({ onClose, onRefill }) {
  function handleRefill() {
    onRefill(3)   // App.jsx handles the actual credit add
    onClose()
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal-icon">✨</div>
        <h2 id="modal-title" className="modal-title">You've used all your credits</h2>
        <p className="modal-body">
          Each story costs 1 credit to generate, and voice playback costs 2 extra credits.
          Get more credits to keep creating magical stories!
        </p>

        <div className="modal-actions">
          <button className="btn-primary btn-large" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
            💳 Get More Credits (coming soon)
          </button>
          <button className="btn-secondary" onClick={handleRefill}>
            🎁 Refill Demo Credits (+3)
          </button>
        </div>

        <p className="modal-note">
          Credit packs and monthly memberships are coming soon. The demo refill is for testing only.
        </p>

        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  )
}
