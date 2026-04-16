// ─── Storage keys ────────────────────────────────────────────────────────────
export const KEYS = {
  CREDITS:  'bs_credits',
  HISTORY:  'bs_history_v1',
  SETTINGS: 'bs_settings',
  USER:     'bs_user',
}

// ─── Per-user credits (keyed by Google user ID) ───────────────────────────────
// Returns the user's credit balance; gives 3 free credits on first ever login.
export function initUserCredits(userId) {
  const initKey = `bs_init_${userId}`
  const balKey  = `bs_credits_${userId}`
  if (!localStorage.getItem(initKey)) {
    localStorage.setItem(initKey, '1')
    localStorage.setItem(balKey, '3')
    return 3
  }
  const raw = localStorage.getItem(balKey)
  return raw !== null ? parseInt(raw, 10) : 0
}

export function getUserCredits(userId) {
  const raw = localStorage.getItem(`bs_credits_${userId}`)
  return raw !== null ? parseInt(raw, 10) : 0
}

export function setUserCredits(userId, amount) {
  localStorage.setItem(`bs_credits_${userId}`, String(Math.max(0, amount)))
}

export function deductUserCredits(userId, amount) {
  const next = Math.max(0, getUserCredits(userId) - amount)
  setUserCredits(userId, next)
  return next
}

export function addUserCredits(userId, amount) {
  const next = getUserCredits(userId) + amount
  setUserCredits(userId, next)
  return next
}

// ─── User / Auth ──────────────────────────────────────────────────────────────

export function getUser() {
  try {
    const raw = localStorage.getItem(KEYS.USER)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function saveUser(user) {
  localStorage.setItem(KEYS.USER, JSON.stringify(user))
}

export function clearUser() {
  localStorage.removeItem(KEYS.USER)
}

const INITIAL_CREDITS = 3

// ─── Credits ─────────────────────────────────────────────────────────────────

export function getCredits() {
  const raw = localStorage.getItem(KEYS.CREDITS)
  if (raw === null) {
    // First visit — assign 3 free credits
    setCredits(INITIAL_CREDITS)
    return INITIAL_CREDITS
  }
  return parseInt(raw, 10)
}

export function setCredits(amount) {
  localStorage.setItem(KEYS.CREDITS, String(Math.max(0, amount)))
}

export function deductCredits(amount) {
  const current = getCredits()
  const next = Math.max(0, current - amount)
  setCredits(next)
  return next
}

export function addCredits(amount) {
  const current = getCredits()
  const next = current + amount
  setCredits(next)
  return next
}

export function hasCredits(amount = 1) {
  return getCredits() >= amount
}

// ─── History ─────────────────────────────────────────────────────────────────

export function getHistory() {
  try {
    const raw = localStorage.getItem(KEYS.HISTORY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveStory(story) {
  // story shape: { id, title, body, fullText, settings, createdAt, audioBlob? }
  const history = getHistory()
  // prepend newest first
  const updated = [story, ...history]
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
  return updated
}

export function deleteStory(id) {
  const history = getHistory()
  const updated = history.filter((s) => s.id !== id)
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
  return updated
}

export function clearHistory() {
  localStorage.removeItem(KEYS.HISTORY)
}

// Attach audio blob (base64) to an existing story entry
export function attachAudioToStory(id, audioBase64, mimeType) {
  const history = getHistory()
  const updated = history.map((s) =>
    s.id === id ? { ...s, audioBase64, audioMimeType: mimeType } : s
  )
  localStorage.setItem(KEYS.HISTORY, JSON.stringify(updated))
  return updated
}

// ─── Settings ────────────────────────────────────────────────────────────────

export function getSettings() {
  try {
    const raw = localStorage.getItem(KEYS.SETTINGS)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings))
}

// ─── Migration ───────────────────────────────────────────────────────────────
// If we ever increment the history key (bs_history_v2 etc.) run migration here.
export function runMigrations() {
  // v1 → current: nothing to migrate yet, key is already bs_history_v1
  // Credits: never reset on app updates — just read the existing value.
}
