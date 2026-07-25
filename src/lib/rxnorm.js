// Looks up real medication names via the NIH National Library of Medicine's
// RxNorm API (rxnav.nlm.nih.gov) — free, no API key, called directly from
// the browser (same pattern as the FDA recall check in MedicationCheck.jsx).
//
// Why: medication interaction matching in this app works by comparing what
// a user types against hand-curated alias lists in interactions.js. Blind
// free-text meant a misspelling or an unlisted brand name produced a false
// "no interactions found" — indistinguishable from a genuine all-clear. This
// backs the input with an actual clinical drug database instead, so users
// pick from real, correctly-spelled names.
//
// approximateTerm is RxNorm's typo-tolerant search (good for as-you-type),
// ranked by match score. Response field names are per NLM's RxNav API
// documentation as of this writing — not independently re-verified against
// the current live API, consistent with this app's other external-source
// citations. Any response shape drift degrades to an empty result list
// rather than throwing, so the UI's manual-entry fallback still works.
export async function searchMedications(query, { maxEntries = 8 } = {}) {
  const trimmed = query.trim()
  if (trimmed.length < 2) return []

  const url = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=${maxEntries}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('RxNorm lookup failed')
  const data = await res.json()
  const candidates = data?.approximateGroup?.candidate || []

  // RxNorm often returns multiple RXCUIs for the same name (different
  // strengths/forms) — dedupe by name so the dropdown doesn't repeat itself.
  const seen = new Set()
  const results = []
  for (const c of candidates) {
    if (!c?.name) continue
    const key = c.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    results.push({ rxcui: c.rxcui, name: c.name })
  }
  return results
}
