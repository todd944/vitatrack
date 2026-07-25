import { scheduledOn } from './conflicts'
import { dateKey } from './date'

// Current streak of scheduled days marked taken, walking backward from
// today. If today is scheduled but not yet marked taken, that's treated as
// "pending" (not a miss) rather than immediately breaking the streak —
// otherwise it would look broken every morning before you've had a chance
// to take anything.
export function computeStreak(us, log, today = new Date()) {
  let streak = 0
  const cursor = new Date(today)

  if (scheduledOn(us, cursor) && !log[dateKey(cursor)]?.[us.id]) {
    cursor.setDate(cursor.getDate() - 1)
  }

  for (let i = 0; i < 365; i++) {
    if (scheduledOn(us, cursor)) {
      if (log[dateKey(cursor)]?.[us.id]) {
        streak += 1
      } else {
        break
      }
    }
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

// % of this calendar month's scheduled days (up through today) that were
// marked taken. Future days in the month aren't counted — they haven't
// happened yet and would unfairly deflate the percentage.
export function computeMonthlyAdherence(us, log, today = new Date()) {
  const year = today.getFullYear()
  const month = today.getMonth()
  let scheduledCount = 0
  let takenCount = 0

  for (let d = 1; d <= today.getDate(); d++) {
    const date = new Date(year, month, d)
    if (scheduledOn(us, date)) {
      scheduledCount += 1
      if (log[dateKey(date)]?.[us.id]) takenCount += 1
    }
  }

  const pct = scheduledCount > 0 ? Math.round((takenCount / scheduledCount) * 100) : null
  return { scheduledCount, takenCount, pct }
}

// Last `days` days as {date, scheduled, taken} for a compact visual strip.
export function recentDayStrip(us, log, today = new Date(), days = 14) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    result.push({
      date,
      scheduled: scheduledOn(us, date),
      taken: !!log[dateKey(date)]?.[us.id],
    })
  }
  return result
}
