import { useState, useEffect, useCallback } from 'react'
import { runMigrations, getCredits } from './services/storage'
import StoryForm from './components/StoryForm/StoryForm'
import StoryOutput from './components/StoryOutput/StoryOutput'
import StoryHistory from './components/StoryHistory/StoryHistory'
import CreditDisplay from './components/CreditDisplay/CreditDisplay'
import OutOfCreditsModal from './components/Modals/OutOfCreditsModal'

export default function App() {
  const [page, setPage]               = useState('home')   // 'home' | 'history'
  const [credits, setCredits]         = useState(0)
  const [showNoCredits, setShowNoCredits] = useState(false)
  const [activeStory, setActiveStory] = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [installed, setInstalled]     = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)

  useEffect(() => {
    runMigrations()
    setCredits(getCredits())

    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setInstallPrompt(null)
    })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const refreshCredits = useCallback(() => {
    setCredits(getCredits())
  }, [])

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
          {/* Desktop: always visible */}
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

          <CreditDisplay credits={credits} onRefill={refreshCredits} />

          {/* Mobile: hamburger */}
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

        {/* Mobile dropdown */}
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
          </div>
        )}
      </header>

      <main className="app-main">
        {page === 'history' ? (
          <StoryHistory
            onReadStory={(story) => {
              setActiveStory({ ...story, fromHistory: true })
              setPage('home')
            }}
          />
        ) : activeStory ? (
          <StoryOutput
            story={activeStory}
            credits={credits}
            onCreditsChange={refreshCredits}
            onNewStory={() => setActiveStory(null)}
            onOutOfCredits={() => setShowNoCredits(true)}
          />
        ) : (
          <StoryForm
            credits={credits}
            onStoryReady={(story) => {
              setActiveStory(story)
              refreshCredits()
            }}
            onCreditsChange={refreshCredits}
            onOutOfCredits={() => setShowNoCredits(true)}
            generating={generating}
            setGenerating={setGenerating}
          />
        )}
      </main>

      {showNoCredits && (
        <OutOfCreditsModal
          onClose={() => setShowNoCredits(false)}
          onRefill={refreshCredits}
        />
      )}
    </div>
  )
}
