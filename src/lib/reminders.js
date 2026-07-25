import { useState, useEffect, useRef } from 'react'
import { supplements } from '../data/supplements'
import { todayKey } from './date'

export function getNotificationPermission() {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export function requestNotificationPermission() {
  if (typeof Notification === 'undefined') return Promise.resolve('unsupported')
  return Notification.requestPermission()
}

// Checks scheduled reminder times against the clock every 15s. This only
// works while the app is open in a browser tab — there's no service worker
// or push server behind it, so it can't wake up a closed tab or notify in
// the background. It fires a real OS notification when permission has been
// granted, and always surfaces an in-app banner as the reliable fallback.
export function useReminders(userSupplements) {
  const [dueReminders, setDueReminders] = useState([])
  const firedRef = useRef(new Set())

  useEffect(() => {
    const check = () => {
      const now = new Date()
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
      const today = now.getDay()
      const date = todayKey()

      userSupplements.forEach((u) => {
        const days = u.days?.length ? u.days : [0, 1, 2, 3, 4, 5, 6]
        if (!days.includes(today)) return

        ;(u.reminderTimes || []).forEach((time) => {
          // Due-or-overdue rather than an exact-minute match — a 15s poll
          // interval can easily straddle the exact minute boundary, and an
          // exact match would silently skip the reminder for the rest of the
          // day. Comparing "HH:MM" strings works directly since they're
          // zero-padded 24-hour.
          if (time > currentTime) return
          const key = `${u.id}-${time}-${date}`
          if (firedRef.current.has(key)) return
          firedRef.current.add(key)

          const s = supplements.find((sp) => sp.id === u.id)

          if (getNotificationPermission() === 'granted') {
            try {
              new Notification('VitaTrack reminder', { body: `Time to take ${s?.name} (${u.dosage})` })
            } catch {
              // Some embedded/sandboxed browser contexts throw even when
              // permission reads as granted — the in-app banner still covers it.
            }
          }

          setDueReminders((prev) => [...prev, { key, supplementId: u.id, name: s?.name, dosage: u.dosage }])
        })
      })
    }

    check()
    const interval = setInterval(check, 15000)
    return () => clearInterval(interval)
  }, [userSupplements])

  const dismiss = (key) => setDueReminders((prev) => prev.filter((r) => r.key !== key))

  return { dueReminders, dismiss }
}
