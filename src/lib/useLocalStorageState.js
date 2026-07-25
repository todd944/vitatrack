import { useState, useEffect } from 'react'

const PREFIX = 'vitatrack:'

function readStored(key, initialValue) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw != null ? JSON.parse(raw) : initialValue
  } catch {
    return initialValue
  }
}

// Drop-in replacement for useState that persists to localStorage — the
// first real fix for this app's biggest gap as a daily-use product: state
// was entirely in-memory, so refreshing the tab wiped the whole schedule,
// every streak, and all logged history. This covers the single-device case;
// multi-device sync and real push notifications (reminders firing while the
// app isn't open) still need an actual backend — see README.
export function useLocalStorageState(key, initialValue) {
  const [state, setState] = useState(() => readStored(key, initialValue))

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(state))
    } catch {
      // localStorage can throw (quota exceeded, private browsing) — this is
      // a persistence convenience layered on top of in-session state, not
      // the source of truth during the session, so failing silently here is
      // safer than crashing the app over a storage write.
    }
  }, [key, state])

  return [state, setState]
}

export function clearStoredState(keys) {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(PREFIX + key)
    } catch {
      // ignore
    }
  })
}
