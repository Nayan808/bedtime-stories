import { useState, useEffect, useRef, useCallback } from 'react'
import { deductCredits, addCredits, attachAudioToStory } from '../../services/storage'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]

export default function AudioPlayer({ story, credits, onCreditsChange, onOutOfCredits }) {
  const [voices, setVoices]           = useState([])
  const [selectedVoice, setSelectedVoice] = useState(null)
  const [speed, setSpeed]             = useState(1)
  const [playing, setPlaying]         = useState(false)
  const [unlocked, setUnlocked]       = useState(false)   // paid the 2-credit cost
  const [progress, setProgress]       = useState(0)       // 0–1
  const [elapsed, setElapsed]         = useState(0)       // seconds
  const [totalTime, setTotalTime]     = useState(0)       // estimate in seconds
  const [highlightIdx, setHighlightIdx] = useState(-1)
  const [audioBlob, setAudioBlob]     = useState(null)    // recorded audio
  const [recording, setRecording]     = useState(false)
  const [locked, setLocked]           = useState(false)   // lock screen active
  const [tapCount, setTapCount]       = useState(0)       // unlock taps counted
  const tapResetRef                   = useRef(null)       // timer to reset taps

  // TTS words split
  const words = useRef([])
  const utterRef   = useRef(null)
  const wordIdxRef = useRef(0)
  const timerRef   = useRef(null)
  const startTimeRef = useRef(0)
  const pausedElapsedRef = useRef(0)

  // MediaRecorder for audio capture
  const mediaRecorderRef = useRef(null)
  const audioChunksRef   = useRef([])
  const audioDestRef     = useRef(null)

  // ── Load voices ──
  useEffect(() => {
    function load() {
      const v = window.speechSynthesis.getVoices()
      if (v.length) setVoices(v)
    }
    load()
    window.speechSynthesis.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load)
  }, [])

  // Auto-select first English-ish voice
  useEffect(() => {
    if (voices.length && !selectedVoice) {
      const lang = story.settings?.language || 'English'
      let match = voices.find((v) => v.lang.startsWith('en'))
      if (lang !== 'English') {
        const langCode = LANG_CODES[lang]
        if (langCode) match = voices.find((v) => v.lang.startsWith(langCode)) || match
      }
      setSelectedVoice(match || voices[0])
    }
  }, [voices, story.settings?.language])

  // Estimate total time
  useEffect(() => {
    const wps = 2.5 * speed  // ~150 wpm baseline
    const text = story.body || ''
    const wc = text.split(/\s+/).filter(Boolean).length
    setTotalTime(Math.round(wc / wps))
  }, [story.body, speed])

  // ── Prepare words array ──
  useEffect(() => {
    const raw = `${story.title}. ${story.body || ''}`
    words.current = raw.split(/\s+/).filter(Boolean)
  }, [story.title, story.body])

  // ── Unlock and start ──
  function handlePlayPress() {
    if (story.fromHistory) {
      // Free from history
      startPlayback()
      return
    }
    if (unlocked) {
      togglePlayPause()
      return
    }
    // Costs 2 credits
    if (credits < 2) {
      onOutOfCredits()
      return
    }
    deductCredits(2)
    onCreditsChange()
    setUnlocked(true)
    startPlayback()
  }

  function startPlayback() {
    if (playing) return
    speak(wordIdxRef.current)
  }

  function togglePlayPause() {
    if (playing) {
      window.speechSynthesis.pause()
      setPlaying(false)
      clearInterval(timerRef.current)
      pausedElapsedRef.current += (Date.now() - startTimeRef.current) / 1000
    } else {
      window.speechSynthesis.resume()
      setPlaying(true)
      startTimeRef.current = Date.now()
      startTimer()
    }
  }

  function speak(fromWordIdx = 0) {
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)

    wordIdxRef.current = fromWordIdx
    const text = words.current.slice(fromWordIdx).join(' ')
    if (!text.trim()) return

    const utter = new SpeechSynthesisUtterance(text)
    utter.rate  = speed
    if (selectedVoice) utter.voice = selectedVoice
    utterRef.current = utter

    utter.onstart = () => {
      setPlaying(true)
      startTimeRef.current = Date.now()
      startTimer()
    }
    utter.onboundary = (e) => {
      if (e.name !== 'word') return
      // estimate word index from char index
      const spokenText = text.slice(0, e.charIndex)
      const spokenWords = spokenText.split(/\s+/).filter(Boolean).length
      const idx = fromWordIdx + spokenWords
      wordIdxRef.current = idx
      setHighlightIdx(idx)
      // update progress
      const frac = idx / Math.max(1, words.current.length)
      setProgress(frac)
    }
    utter.onend = () => {
      setPlaying(false)
      setHighlightIdx(-1)
      setProgress(1)
      clearInterval(timerRef.current)
    }
    utter.onerror = () => {
      setPlaying(false)
      clearInterval(timerRef.current)
    }

    window.speechSynthesis.speak(utter)
  }

  function startTimer() {
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      const secs = pausedElapsedRef.current + (Date.now() - startTimeRef.current) / 1000
      setElapsed(Math.min(secs, totalTime))
    }, 500)
  }

  function handleLock() {
    setLocked(true)
    setTapCount(0)
    clearTimeout(tapResetRef.current)
  }

  function handleLockTap() {
    clearTimeout(tapResetRef.current)
    setTapCount((prev) => {
      const next = prev + 1
      if (next >= 3) {
        setLocked(false)
        return 0
      }
      // Reset counter if user stops tapping for 1.5 s
      tapResetRef.current = setTimeout(() => setTapCount(0), 1500)
      return next
    })
  }

  function handleRestart() {
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    wordIdxRef.current = 0
    pausedElapsedRef.current = 0
    setProgress(0)
    setElapsed(0)
    setHighlightIdx(-1)
    setPlaying(false)
    speak(0)
  }

  function handleSpeedChange(s) {
    setSpeed(s)
    if (playing) {
      // restart from current word with new speed
      const idx = wordIdxRef.current
      window.speechSynthesis.cancel()
      clearInterval(timerRef.current)
      setPlaying(false)
      setTimeout(() => speak(idx), 50)
    }
  }

  function handleProgressClick(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = (e.clientX - rect.left) / rect.width
    const idx  = Math.floor(frac * words.current.length)
    window.speechSynthesis.cancel()
    clearInterval(timerRef.current)
    pausedElapsedRef.current = frac * totalTime
    setProgress(frac)
    setElapsed(frac * totalTime)
    speak(idx)
  }

  // ── Audio download via AudioContext ──
  async function handleDownloadAudio() {
    // We capture by re-speaking into an OfflineAudioContext via audio element.
    // Since TTS doesn't route through Web Audio API directly, we use a creative
    // approach: record system audio via MediaRecorder if available, otherwise
    // we store the raw text and create a .txt fallback.
    // The cleanest cross-browser approach: use MediaDevices to capture audio
    // while TTS plays, but that requires user permission. Instead we'll use
    // the base64 blob if already recorded, or prompt.
    try {
      setRecording(true)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks = []
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        // Save to history
        const reader = new FileReader()
        reader.onload = () => {
          attachAudioToStory(story.id, reader.result, 'audio/webm')
        }
        reader.readAsDataURL(blob)
        downloadBlob(blob, `${story.title}.webm`)
        stream.getTracks().forEach((t) => t.stop())
        setRecording(false)
      }
      recorder.start()
      // Speak the story
      const text = `${story.title}. ${story.body || ''}`
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = speed
      if (selectedVoice) utter.voice = selectedVoice
      utter.onend = () => recorder.stop()
      utter.onerror = () => { recorder.stop(); setRecording(false) }
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    } catch {
      // Fallback: download as .txt
      setRecording(false)
      alert('Audio recording requires microphone access. Downloading as text instead.')
      const content = `${story.title}\n\n${story.body}`
      downloadBlob(new Blob([content], { type: 'text/plain' }), `${story.title}.txt`)
    }
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace(/[^a-z0-9.\-_]/gi, '_')
    a.click()
    URL.revokeObjectURL(url)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      clearInterval(timerRef.current)
    }
  }, [])

  const canPlay = story.fromHistory || unlocked || credits >= 2

  // ── Render highlighted text ──
  const allWords = words.current
  const storyTitle = story.title || ''
  const titleWordCount = storyTitle.split(/\s+/).filter(Boolean).length

  return (
    <div className="audio-player">
      <h3 className="player-heading">🎧 Voice Playback</h3>

      {/* ── Cost notice ── */}
      {!unlocked && !story.fromHistory && (
        <div className="voice-cost-notice">
          <span>Listening costs <strong>2 credits</strong> (you have {credits})</span>
        </div>
      )}

      {/* ── Play / Pause ── */}
      <div className="player-controls">
        <button
          className={`btn-play${playing ? ' playing' : ''}`}
          onClick={handlePlayPress}
          disabled={recording}
        >
          {playing ? '⏸ Pause' : (unlocked || story.fromHistory) ? '▶ Play' : `▶ Play — 2 credits`}
        </button>

        <button className="btn-restart" onClick={handleRestart} title="Restart from beginning">
          ↩ Restart
        </button>
        {(unlocked || story.fromHistory) && playing && (
          <button className="btn-lock" onClick={handleLock} title="Lock screen">
            🔒 Lock
          </button>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="progress-bar-track" onClick={handleProgressClick} role="slider" aria-valuenow={Math.round(progress * 100)} tabIndex={0}>
        <div className="progress-bar-fill" style={{ width: `${progress * 100}%` }} />
      </div>
      <div className="progress-time">
        <span>{fmt(elapsed)}</span>
        <span>{fmt(totalTime)}</span>
      </div>

      {/* ── Speed ── */}
      <div className="speed-controls">
        <span className="speed-label">Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            className={`btn-speed${speed === s ? ' active' : ''}`}
            onClick={() => handleSpeedChange(s)}
          >
            {s}x
          </button>
        ))}
      </div>

      {/* ── Voice selector ── */}
      {voices.length > 0 && (
        <div className="voice-selector">
          <label className="voice-label">Voice:</label>
          <select
            className="voice-select"
            value={selectedVoice?.name || ''}
            onChange={(e) => {
              const v = voices.find((v) => v.name === e.target.value)
              setSelectedVoice(v)
            }}
          >
            {voices.map((v) => (
              <option key={v.name} value={v.name}>
                {v.name} ({v.lang})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Highlighted story text ── */}
      {(unlocked || story.fromHistory) && (
        <div className="highlighted-story">
          <p className="hl-title">
            {storyTitle.split(/\s+/).filter(Boolean).map((w, i) => (
              <span key={i} className={highlightIdx === i ? 'word-highlight' : ''}>
                {w}{' '}
              </span>
            ))}
          </p>
          {(story.body || '').split('\n').map((para, pi) => (
            para.trim() ? (
              <p key={pi}>
                {para.split(/\s+/).filter(Boolean).map((w, wi) => {
                  const globalIdx = titleWordCount + /* rough offset */ wi
                  return (
                    <span key={wi} className={highlightIdx === globalIdx ? 'word-highlight' : ''}>
                      {w}{' '}
                    </span>
                  )
                })}
              </p>
            ) : <br key={pi} />
          ))}
        </div>
      )}

      {/* ── Download ── */}
      <div className="download-row">
        <button className="btn-download-audio" onClick={handleDownloadAudio} disabled={recording}>
          {recording ? '⏺ Recording...' : '⬇ Download Audio'}
        </button>
        {recording && <span className="recording-hint">Speak is being captured... wait for TTS to finish.</span>}
      </div>

      {/* ── Lock screen overlay ── */}
      {locked && (
        <div className="lock-overlay" onClick={handleLockTap}>
          <div className="lock-inner">
            <div className="lock-icon">🔒</div>
            <h2 className="lock-title">{story.title || 'Bedtime Story'}</h2>
            <p className="lock-playing">♪ Playing…</p>
            <p className="lock-hint">Tap 3 times to unlock</p>
            <div className="lock-dots">
              {[0, 1, 2].map((i) => (
                <span key={i} className={`lock-dot${tapCount > i ? ' filled' : ''}`} />
              ))}
            </div>
            {tapCount > 0 && (
              <p className="lock-tap-count">{tapCount} / 3</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function fmt(secs) {
  const s = Math.floor(secs)
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

const LANG_CODES = {
  Hindi: 'hi', Marathi: 'mr', Spanish: 'es', French: 'fr',
  German: 'de', Arabic: 'ar', Japanese: 'ja', Portuguese: 'pt',
  Tamil: 'ta', Urdu: 'ur',
}
