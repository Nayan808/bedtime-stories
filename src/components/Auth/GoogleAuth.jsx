import { useEffect, useRef, useState } from 'react'
import { saveUser, clearUser } from '../../services/storage'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Decode JWT payload without verifying signature (client-side info only)
function parseJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch { return null }
}

export default function GoogleAuth({ user, onUserChange }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Initialise Google Identity Services
  useEffect(() => {
    if (!CLIENT_ID || !window.google) return

    window.google.accounts.id.initialize({
      client_id: CLIENT_ID,
      callback: (response) => {
        const payload = parseJwt(response.credential)
        if (!payload) return
        const userData = {
          id:      payload.sub,
          name:    payload.name,
          email:   payload.email,
          picture: payload.picture,
        }
        saveUser(userData)
        onUserChange(userData)
      },
      auto_select: false,
    })
  }, [])

  // Wait for GSI script to load then init
  useEffect(() => {
    if (CLIENT_ID && !window.google) {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval)
          window.google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => {
              const payload = parseJwt(response.credential)
              if (!payload) return
              const userData = {
                id:      payload.sub,
                name:    payload.name,
                email:   payload.email,
                picture: payload.picture,
              }
              saveUser(userData)
              onUserChange(userData)
            },
          })
        }
      }, 200)
      return () => clearInterval(interval)
    }
  }, [])

  function handleSignIn() {
    if (!window.google) {
      alert('Google Sign-In is not available. Check your Client ID in .env')
      return
    }
    window.google.accounts.id.prompt()
  }

  function handleSignOut() {
    if (window.google) window.google.accounts.id.disableAutoSelect()
    clearUser()
    onUserChange(null)
    setMenuOpen(false)
  }

  // ── Not signed in ──
  if (!user) {
    return (
      <button className="btn-google-signin" onClick={handleSignIn}>
        <svg className="google-icon" viewBox="0 0 24 24" width="16" height="16">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in
      </button>
    )
  }

  // ── Signed in — show avatar ──
  return (
    <div className="user-menu" ref={menuRef}>
      <button
        className="user-avatar-btn"
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Account menu"
      >
        {user.picture
          ? <img className="user-avatar" src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
          : <span className="user-avatar-fallback">{user.name?.[0]?.toUpperCase()}</span>
        }
      </button>

      {menuOpen && (
        <div className="user-dropdown">
          <div className="user-dropdown-info">
            {user.picture
              ? <img className="user-dropdown-avatar" src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
              : <span className="user-avatar-fallback large">{user.name?.[0]?.toUpperCase()}</span>
            }
            <div>
              <p className="user-dropdown-name">{user.name}</p>
              <p className="user-dropdown-email">{user.email}</p>
            </div>
          </div>
          <button className="user-signout-btn" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
