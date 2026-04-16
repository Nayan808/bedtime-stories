export default function LandingPage({ onCreateStory, onSignIn, user }) {
  return (
    <div className="landing">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-badge">AI-Powered · Free to Try</div>
        <h1 className="hero-title">
          Magical Bedtime Stories,<br />
          <span className="hero-title-accent">Made for Your Child</span>
        </h1>
        <p className="hero-subtitle">
          Generate personalised, unique bedtime stories in seconds.
          Choose the genre, characters, moral — and let AI write a story
          your child will ask for again and again.
        </p>
        <div className="hero-cta">
          <button className="btn-hero-primary" onClick={onCreateStory}>
            ✨ Create a Story Free
          </button>
          <p className="hero-cta-note">No credit card · 3 free stories on sign-in</p>
        </div>
        <div className="hero-visual">
          <div className="hero-card">
            <span className="hero-card-icon">🌙</span>
            <p className="hero-card-title">"The Dragon Who Was Afraid of the Dark"</p>
            <p className="hero-card-meta">Fantasy · 4–6 yrs · Soothing · ~4 min</p>
          </div>
          <div className="hero-card hero-card-offset">
            <span className="hero-card-icon">🚀</span>
            <p className="hero-card-title">"Arya's Adventure on Planet Zoomie"</p>
            <p className="hero-card-meta">Space · 6–8 yrs · Exciting · ~7 min</p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section">
        <h2 className="section-heading">Everything a bedtime story should be</h2>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <div className="feature-card" key={f.title}>
              <span className="feature-icon">{f.icon}</span>
              <h3 className="feature-title">{f.title}</h3>
              <p className="feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="how-section">
        <h2 className="section-heading">How it works</h2>
        <div className="steps-row">
          {STEPS.map((s, i) => (
            <div className="step" key={s.title}>
              <div className="step-num">{i + 1}</div>
              <h3 className="step-title">{s.title}</h3>
              <p className="step-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ages section ── */}
      <section className="ages-section">
        <h2 className="section-heading">Perfect for every age</h2>
        <div className="ages-row">
          {AGES.map((a) => (
            <div className="age-chip" key={a.range}>
              <span className="age-emoji">{a.emoji}</span>
              <span className="age-range">{a.range}</span>
              <span className="age-label">{a.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="bottom-cta">
        <h2 className="bottom-cta-title">Start your first story tonight</h2>
        <p className="bottom-cta-sub">
          Free for every new device. No subscription required to try.
        </p>
        <button className="btn-hero-primary" onClick={onCreateStory}>
          ✨ Create a Story — It's Free
        </button>
      </section>

    </div>
  )
}

const FEATURES = [
  {
    icon: '🎯',
    title: 'Fully Personalised',
    desc: "Add your child's name, favourite characters, a moral lesson — every story is uniquely theirs.",
  },
  {
    icon: '🎧',
    title: 'Voice Narration',
    desc: 'Listen hands-free with text-to-speech narration. Great for car rides or lights-out time.',
  },
  {
    icon: '🌍',
    title: '12+ Languages',
    desc: 'Generate stories in English, Hindi, Spanish, French, Marathi, Arabic and more.',
  },
  {
    icon: '📚',
    title: 'Story History',
    desc: 'Every story is saved. Re-read or re-play any story from your library anytime.',
  },
  {
    icon: '🛡️',
    title: 'Child-Safe Always',
    desc: 'Built-in AI guardrails ensure every story is age-appropriate, gentle, and safe.',
  },
  {
    icon: '📱',
    title: 'Works Offline',
    desc: 'Install as an app on any phone or desktop. Stories play even without internet.',
  },
]

const STEPS = [
  {
    title: 'Sign in with Google',
    desc: 'One tap, no passwords. Get 3 free stories instantly on your device.',
  },
  {
    title: 'Customise your story',
    desc: "Pick age, genre, characters, language, length — or let the defaults do the magic.",
  },
  {
    title: 'Generate & enjoy',
    desc: 'Your personalised story streams in real-time. Read it or listen with voice mode.',
  },
]

const AGES = [
  { emoji: '🧸', range: '2–4 yrs', label: 'Toddlers' },
  { emoji: '🧚', range: '4–6 yrs', label: 'Pre-school' },
  { emoji: '🦄', range: '6–8 yrs', label: 'Early readers' },
  { emoji: '🚀', range: '8–10 yrs', label: 'Adventurers' },
  { emoji: '📖', range: '10–12 yrs', label: 'Young readers' },
]
