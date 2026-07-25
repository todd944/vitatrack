import { supplements as libarySupplements } from '../data/supplements'
import { interactions } from '../data/interactions'
import { medicationMatches } from './medications'
import { ulStatusFor } from './dri'

// `u.startDate` (set once, when a supplement is first added — see
// App.jsx's scheduleSupplement) keeps a recurring schedule from silently
// applying to dates before the user actually added it. Without this, a
// "daily" schedule added today looks scheduled-and-missed on every day
// going back in history, which is misleading in the calendar and in the
// adherence stats on the Log tab.
export function scheduledOn(u, date) {
  if (u.startDate) {
    const [y, m, d] = u.startDate.split('-').map(Number)
    if (date < new Date(y, m - 1, d)) return false
  }
  const days = u.days && u.days.length ? u.days : [0, 1, 2, 3, 4, 5, 6]
  return days.includes(date.getDay())
}

// What's actually relevant on one specific day: supplement combos and
// medication interactions only count if both items are scheduled that day
// (two supplements on non-overlapping days never actually meet), plus any
// dose that's near/over its personalized upper limit that day.
// `supplements` defaults to the built-in library but should be passed the
// library-plus-custom-products list so user-added items resolve by name too
// (they just never match any curated interaction/UL entry, which is correct).
export function getDayFlags(date, { userSupplements, medications, profile, supplements = libarySupplements }) {
  const scheduledToday = userSupplements.filter((u) => scheduledOn(u, date))
  const ids = scheduledToday.map((u) => u.id)
  const reasons = []

  interactions.forEach((i) => {
    if (!ids.includes(i.supplementId)) return
    const supplementName = supplements.find((sp) => sp.id === i.supplementId)?.name

    if (i.interactsWith.type === 'supplement') {
      const matches = i.interactsWith.id
        ? ids.includes(i.interactsWith.id)
        : ids.some((id) => {
            if (id === i.supplementId) return false
            const s = supplements.find((sp) => sp.id === id)
            return s && i.interactsWith.name.toLowerCase().includes(s.name.toLowerCase())
          })
      if (matches) reasons.push({ severity: i.severity, text: `${supplementName} + ${i.interactsWith.name}` })
    } else if (i.interactsWith.type === 'medication') {
      if (medicationMatches(i.interactsWith, medications || [])) {
        reasons.push({ severity: i.severity, text: `${supplementName} + ${i.interactsWith.name}` })
      }
    }
  })

  scheduledToday.forEach((u) => {
    const s = supplements.find((sp) => sp.id === u.id)
    if (!s) return
    const status = ulStatusFor(s, u.dosage, profile)
    if (status.level === 'over') reasons.push({ severity: 'danger', text: `${s.name} is at/above your upper limit` })
    else if (status.level === 'near') reasons.push({ severity: 'caution', text: `${s.name} is close to your upper limit` })
  })

  const level = reasons.some((r) => r.severity === 'danger') ? 'danger' : reasons.length > 0 ? 'caution' : null
  return { level, reasons }
}
