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

  useEffect(() => {
    runMigrations()
    setCredits(getCredits())
  }, [])

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
          <button
            className={`nav-btn${page === 'history' ? ' active' : ''}`}
            onClick={() => setPage('history')}
          >
            📚 History
          </button>
          <CreditDisplay
            credits={credits}
            onRefill={refreshCredits}
          />
        </nav>
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
