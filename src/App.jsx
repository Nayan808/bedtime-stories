import { useState, useEffect, useCallback } from 'react'
import {
  runMigrations, getUser,
  initUserCredits, getUserCredits, deductUserCredits, addUserCredits,
} from './services/storage'
import StoryForm from './components/StoryForm/StoryForm'
import StoryOutput from './components/StoryOutput/StoryOutput'
import StoryHistory from './components/StoryHistory/StoryHistory'
import CreditDisplay from './components/CreditDisplay/CreditDisplay'
import OutOfCreditsModal from './components/Modals/OutOfCreditsModal'
import LoginRequiredModal from './components/Modals/LoginRequiredModal'
import GoogleAuth from './components/Auth/GoogleAuth'

export default function App() {
  const [page, setPage]               = useState('home')
  const [credits, setCredits]         = useState(0)
  const [showNoCredits, setShowNoCredits]   = useState(false)
  const [showLoginRequired, setShowLoginRequired] = useState(false)
  const [activeStory, setActiveStory] = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled]     = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [user, setUser]               = useState(() => getUser())

  useEffect(() => {
    runMigrations()

    // Load credits for already-logged-in user (page refresh)
    const saved = getUser()
    if (saved) setCredits(getUserCredits(saved.id))

    const handler = (e) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallPrompt(null) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Called by GoogleAuth after sign-in or sign-out
  function handleUserChange(newUser) {
    setUser(newUser)
    if (newUser) {
      // New user → 3 credits; returning user → restore their balance
      const bal = initUserCredits(newUser.id)
      setCredits(bal)
      // If login modal was open, close it
      setShowLoginRequired(false)
    } else {
      setCredits(0)
    }
  }

  // All credit operations go through here so they stay in sync with localStorage
  const refreshCredits = useCallback(() => {
    if (user) setCredits(getUserCredits(user.id))
  }, [user])

  const deductCredits = useCallback((amount) => {
    if (!user) return
    const next = deductUserCredits(user.id, amount)
    setCredits(next)
  }, [user])

  const addCredits = useCallback((amount) => {
    if (!user) return
    const next = addUserCredits(user.id, amount)
    setCredits(next)
  }, [user])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <button
          className="logo-btn"
          onClick={() => { setPage('home'); setActiveStory(null) }}
          aria-label="Go to home"
        >
          <span className="logo-moon">🌙</span>
          <span className="logo-text">Bedtime Stories</span>
        </button>

        <nav className="header-nav">
          <div className="nav-desktop">
            {installPrompt && !installed && (
              <button className="btn-install" onClick={handleInstall} title="Install app on your device">
                ⬇ Install App
              </button>
            )}
            <button
              className={`nav-btn${page === 'history' ? ' active' : ''}`}
              onClick={() => setPage('history')}
            >
              📚 History
            </button>
          </div>

          {user
            ? <CreditDisplay credits={credits} onRefill={() => addCredits(3)} />
            : <span className="credit-badge">⭐ 0 credits</span>
          }

          <GoogleAuth user={user} onUserChange={handleUserChange} />

          <button
            className="hamburger"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
            <span className={`ham-line${menuOpen ? ' open' : ''}`} />
          </button>
        </nav>

        {menuOpen && (
          <div className="mobile-menu">
            {installPrompt && !installed && (
              <button className="mobile-menu-item" onClick={() => { handleInstall(); setMenuOpen(false) }}>
                ⬇ Install App
              </button>
            )}
            <button
              className={`mobile-menu-item${page === 'history' ? ' active' : ''}`}
              onClick={() => { setPage('history'); setMenuOpen(false) }}
            >
              📚 History
            </button>
            {!user && (
              <button
                className="mobile-menu-item"
                onClick={() => { setShowLoginRequired(true); setMenuOpen(false) }}
              >
                Sign in with Google
              </button>
            )}
          </div>
        )}
      </header>

      <main className="app-main">
        {page === 'history' ? (
          <StoryHistory
            onReadStory={(story) => { setActiveStory({ ...story, fromHistory: true }); setPage('home') }}
            onHome={() => setPage('home')}
          />
        ) : activeStory ? (
          <StoryOutput
            story={activeStory}
            credits={credits}
            onCreditsChange={refreshCredits}
            onDeductCredits={deductCredits}
            onAddCredits={addCredits}
            onNewStory={() => setActiveStory(null)}
            onOutOfCredits={() => setShowNoCredits(true)}
          />
        ) : (
          <StoryForm
            user={user}
            credits={credits}
            onStoryReady={(story) => { setActiveStory(story); refreshCredits() }}
            onDeductCredits={deductCredits}
            onCreditsChange={refreshCredits}
            onOutOfCredits={() => setShowNoCredits(true)}
            onLoginRequired={() => setShowLoginRequired(true)}
            generating={generating}
            setGenerating={setGenerating}
          />
        )}
      </main>

      {showNoCredits && (
        <OutOfCreditsModal
          onClose={() => setShowNoCredits(false)}
          onRefill={(n) => addCredits(n)}
        />
      )}

      {showLoginRequired && (
        <LoginRequiredModal
          onClose={() => setShowLoginRequired(false)}
          onSignIn={handleUserChange}
        />
      )}
    </div>
  )
}
